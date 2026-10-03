"""Laya chooses existing portfolio objects; it never generates biography."""
from __future__ import annotations

import json
import os
import re
import threading
import unicodedata
from collections import OrderedDict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODEL = "aac6fef/laya-mlx"
REVISION = "20aed815fc6acde75733882e7ec0e3f28aeb9717"
MAX_RESULTS = 4
MIN_RELEVANCE = 0.50
STOP_WORDS = set("a about all an and are as at be brett bretts can could did do does for from have he hes his how i in is it me my of on or please show tell that the their them these this to want was what whats which who with would you your".split())


class SearchCancelled(Exception):
    pass


def normalize_query(query: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", query).casefold().split())


def terms(text: str) -> set[str]:
    text = unicodedata.normalize("NFKD", text).casefold()
    words = re.findall(r"[^\W_]+", "".join(char for char in text if not unicodedata.combining(char)))
    return {word[:-1] if len(word) > 3 and word.endswith("s") else word
            for word in words if word not in STOP_WORDS}


class PortfolioEngine:
    def __init__(self) -> None:
        # Offline by default: the prototype uses an already cached, pinned model.
        os.environ.setdefault("HF_HOME", str(ROOT / ".cache/huggingface"))
        os.environ.setdefault("HF_HUB_OFFLINE", "1")
        os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
        import laya_mlx as laya
        import mlx.core as mx
        import numpy as np
        from fastembed import TextEmbedding

        mx.set_cache_limit(256 * 1024 * 1024)
        self.entries = json.loads((ROOT / "src/content/catalog.json").read_text())
        embedding_cache = os.environ.get("LAYA_EMBEDDING_CACHE", str(Path(os.environ["HF_HOME"]).parent / "embeddings"))
        self.embedder = TextEmbedding("sentence-transformers/all-MiniLM-L6-v2", cache_dir=embedding_cache,
                                      threads=2, local_files_only=True)
        self.vectors = np.asarray(list(self.embedder.embed([self.facts(entry) for entry in self.entries])), dtype=np.float32)
        self.labels = [terms(entry["title"] + " " + " ".join(entry["topics"]) + " " + entry["category"])
                       for entry in self.entries]
        self.term_counts = {word: sum(word in other for other in self.labels)
                            for labels in self.labels for word in labels}
        self.agent = laya.load(MODEL, revision=REVISION, dtype="float16", batch_size=4, cache_prompts=True)
        self.cache: OrderedDict[str, list[str]] = OrderedDict()
        # Load weights and compile the inference path before reporting readiness.
        self._scores("design", self.entries[:4], threading.Event())

    @staticmethod
    def facts(entry: dict) -> str:
        # Compact authored evidence fits the model context. Full detail remains
        # in the same catalog and is shown by the UI when an object opens.
        return "\n".join([
            f"Title: {entry['title']}",
            f"Category: {entry['category']}",
            f"Topics: {', '.join(entry['topics'])}",
            f"Description: {entry['summary']}",
        ])

    def _scores(self, query: str, entries: list[dict], cancelled: threading.Event) -> list[float]:
        from laya_mlx.agent import collate_items
        from laya_mlx.common import temp_bucket
        import numpy as np

        question = {
            "type": "choice",
            "instructions": f'Does this item fit the description: "{query}"?',
            "criteria": {
                "yes": "Yes, it fits.",
                "no": "No, it does not fit.",
            },
        }
        items = []
        for entry in entries:
            prepared, _ = self.agent.prepare(
                self.facts(entry), {"relevance": question}
            )
            items.append(prepared[0])
        scores = []
        for offset in range(0, len(items), self.agent.batch_size):
            if cancelled.is_set():
                raise SearchCancelled()
            chunk = items[offset:offset + self.agent.batch_size]
            batch = collate_items(chunk, self.agent.tok.pad_token_id,
                                  pad_to_multiple=self.agent.pad_to_multiple,
                                  max_length=self.agent.cfg.get("max_len", 512))
            logits, _ = self.agent.forward(batch)
            logits = np.asarray(logits)
            if not np.isfinite(logits).all():
                raise FloatingPointError("Non-finite relevance output")
            for row, item in enumerate(chunk):
                count, kind = len(item["markers"]), item["qtype"]
                scale = self.agent.temperature_by_options.get(
                    temp_bucket(kind, count), self.agent.temperature[kind]
                )
                values = logits[row, :count] / max(0.001, float(scale))
                probabilities = np.exp(values - values.max())
                scores.append(float(probabilities[0] / probabilities.sum()))
        if cancelled.is_set():
            raise SearchCancelled()
        return scores

    def retrieve(self, query: str) -> list[tuple[dict, float, bool]]:
        import numpy as np

        parts = re.split(r"\s+(?:but no|but not|without|except(?: for)?|excluding)\s+", query, maxsplit=1)
        positive, negative = parts[0], parts[1] if len(parts) > 1 else ""
        requested, excluded = terms(positive), terms(negative)
        vector = np.asarray(next(self.embedder.embed([positive])), dtype=np.float32)
        similarities = self.vectors @ vector
        cutoff = max(0.26, float(similarities.max()) * 0.72)
        skills = bool(re.search(r"\bgood at\b|\bskills?\b|\bstrengths?\b", positive))
        projects = bool(requested) and requested <= {"project", "portfolio"}
        known_counts = [self.term_counts[word] for word in requested if word in self.term_counts]
        rarest = min(known_counts) if known_counts else 0
        named_terms = {word for word in requested if self.term_counts.get(word) == rarest and rarest <= 2}
        candidates = []
        for entry, labels, similarity in zip(self.entries, self.labels, similarities):
            if (excluded & labels or (skills and entry["category"] not in {"work", "craft"})
                    or (projects and entry["category"] != "project")):
                continue
            named = bool(named_terms & labels) or any(requested == terms(topic) for topic in entry["topics"])
            if named_terms and rarest == 1 and not skills and not named:
                continue
            if skills or named or similarity >= cutoff:
                candidates.append((entry, float(similarity), named))
        return candidates

    def search(self, query: str, cancelled: threading.Event) -> dict:
        key = normalize_query(query)
        if cancelled.is_set():
            raise SearchCancelled()
        if key in self.cache:
            self.cache.move_to_end(key)
            return {"ids": self.cache[key].copy(), "source": "laya"}
        if not key:
            return {"ids": [], "source": "laya"}
        candidates = self.retrieve(key)
        scores = self._scores(key, [entry for entry, _, _ in candidates], cancelled)
        # Grounded retrieval avoids scoring unrelated items. Laya ranks the
        # candidates; explicit names and strong semantic evidence prevent known
        # false negatives for short requests such as "running career".
        ranked = sorted(zip(candidates, scores), key=lambda item: 0.7 * item[1] + 0.3 * item[0][1], reverse=True)
        ids = [entry["id"] for (entry, similarity, named), score in ranked
               if score >= MIN_RELEVANCE or named or similarity >= 0.40][:MAX_RESULTS]
        self.cache[key] = ids
        if len(self.cache) > 128:
            self.cache.popitem(last=False)
        return {"ids": ids.copy(), "source": "laya"}
