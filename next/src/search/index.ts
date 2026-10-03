import type { PortfolioEntry } from '../content/types.ts';
import { directMatch, normalizeQuery, searchLocally } from './local.ts';

export { normalizeQuery, searchLocally } from './local.ts';

export interface SearchResult {
  ids: string[];
  source: 'laya' | 'local';
}

export async function searchPortfolio(
  query: string,
  entries: readonly PortfolioEntry[],
  signal: AbortSignal,
): Promise<SearchResult> {
  signal.throwIfAborted();
  const normalized = normalizeQuery(query);
  if (!normalized) return { ids: [], source: 'local' };
  const direct = directMatch(normalized, entries);
  if (direct !== null && !/\bwithout\b|\bexcept\b|\bexcluding\b|\bbut (no|not)\b/.test(normalized)) {
    return { ids: direct, source: 'local' };
  }

  const baseUrl = import.meta.env?.VITE_SEARCH_API_URL?.replace(/\/$/, '');
  if (import.meta.env?.PROD && !baseUrl) return { ids: searchLocally(normalized, entries), source: 'local' };

  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  signal.addEventListener('abort', abort, { once: true });
  const timeout = globalThis.setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(baseUrl ? `${baseUrl}/search` : '/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.trim().slice(0, 240) }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('Search service unavailable');
    const result: unknown = await response.json();
    signal.throwIfAborted();
    if (!result || typeof result !== 'object' || !('ids' in result)
      || !Array.isArray(result.ids) || !('source' in result) || result.source !== 'laya') {
      throw new Error('Invalid search response');
    }
    const validIds = new Set(entries.map((entry) => entry.id));
    return {
      ids: [...new Set(result.ids.filter((id): id is string => typeof id === 'string' && validIds.has(id)))].slice(0, 4),
      source: 'laya',
    };
  } catch {
    // Stale requests must never replace a newer result with a local fallback.
    signal.throwIfAborted();
    return { ids: searchLocally(normalized, entries), source: 'local' };
  } finally {
    globalThis.clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
  }
}
