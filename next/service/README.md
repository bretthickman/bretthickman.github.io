# Portfolio relevance service

This local prototype uses the same cached Laya MLX model as Emoji Gravity. It
retrieves candidate items in `src/content/catalog.json` using cached MiniLM
embeddings and authored metadata, then uses Laya to judge and rank those
candidates. It returns up to four existing IDs. Explicit topics and strong
semantic matches remain eligible when the classifier underrates a short request.
It never generates personal facts or portfolio copy.
The model revision is pinned in `engine.py`.

From the `next/` directory on this Mac:

```sh
cd next # when starting at the repository root
HF_HOME=/Users/bretthickman/Documents/Codex/2026-09-21/i-wa/outputs/emoji-gravity/.cache/huggingface \
  /Users/bretthickman/Documents/Codex/2026-09-21/i-wa/outputs/emoji-gravity/.venv/bin/python \
  -m uvicorn service.app:app --host 127.0.0.1 --port 8788
```

The reference project's files are read only. No model download is attempted.
`GET /health` reports readiness while the model prewarms in a worker thread.
`POST /search` accepts `{ "query": "What is Brett good at?" }` and returns
`{ "ids": [...], "source": "laya" }`. Prompts are limited to 240 characters.
Only 128 prompt results are cached in memory. Requests expire after 7.5 seconds;
disconnects cancel inference between batches. Empty and unrelated queries can
return an empty array. Model scores are heuristic relevance scores.

Vite proxies `/api/search` to `http://127.0.0.1:8788/search`. To use a separately
hosted service, set `VITE_SEARCH_API_URL` to its base URL and configure
`PORTFOLIO_ALLOWED_ORIGINS` as a comma separated list of allowed site origins.
The browser uses an eight second timeout and falls back to authored metadata
search if the service is unavailable. That path is labelled `local`, never Laya.
Résumé and contact requests take the predictable local path immediately.

For a fresh Apple Silicon machine, install `service/requirements.txt` in a Python
3.12 environment and cache `aac6fef/laya-mlx` revision
`20aed815fc6acde75733882e7ec0e3f28aeb9717` under `HF_HOME` before launching.
Cache `sentence-transformers/all-MiniLM-L6-v2` in the sibling `embeddings`
directory, or set `LAYA_EMBEDDING_CACHE` to an existing FastEmbed cache.
MLX requires Apple Silicon. A Linux deployment needs a corresponding Laya runtime
behind this same API. GitHub Pages serves static files and cannot run this Python
service: public Laya search requires hosting, request limits, and operational
setup. Until then, the static portfolio retains local metadata search.

Restart the service after editing the catalog so both the model context and its
cache use the updated authored content.
