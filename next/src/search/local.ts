import type { PortfolioEntry } from '../content/types.ts';

const stopWords = new Set(
  'a about all an and are as at be brett bretts can could do does for from have he hes his how i in is it me my of on or please show something tell that the their them these this to want was what whats which who with would you your'.split(' '),
);

const relatedTerms: Record<string, readonly string[]> = {
  career: ['work', 'experience'],
  coding: ['code', 'programming', 'development'],
  developer: ['code', 'programming', 'development'],
  interfaces: ['interface', 'ui', 'interaction'],
  motion: ['animation', 'physics', 'interaction'],
  playful: ['game', 'humor', 'jokes'],
  runner: ['running', 'track', 'athletics'],
  runs: ['running', 'track'],
  sports: ['running', 'track', 'athletics'],
  hobbies: ['running', 'games', 'life'],
  strengths: ['skills', 'craft', 'design', 'systems', 'interaction'],
};

export function normalizeQuery(query: string): string {
  return query.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[’']/g, '').replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ').trim().slice(0, 240);
}

function terms(text: string): string[] {
  return normalizeQuery(text).split(/[\s-]+/).filter((term) => term && !stopWords.has(term));
}

function matches(word: string, haystack: Set<string>): boolean {
  return haystack.has(word) || (word.endsWith('s') && haystack.has(word.slice(0, -1)));
}

function metadata(entry: PortfolioEntry): Set<string> {
  return new Set(terms(`${entry.title} ${entry.label} ${entry.category} ${entry.topics.join(' ')}`));
}

/** Known destinations stay predictable even while the relevance service starts. */
export function directMatch(query: string, entries: readonly PortfolioEntry[]): string[] | null {
  const words = new Set(terms(query));
  if (words.has('resume') || words.has('cv')) {
    return entries.filter((entry) => entry.topics.some((topic) => /resume|résumé|\bcv\b/i.test(topic))
      || /resume|résumé/i.test(entry.title)).map((entry) => entry.id).slice(0, 1);
  }
  if ([...words].some((word) => ['contact', 'email', 'reach'].includes(word))) {
    return entries.filter((entry) => entry.appearance === 'contact').map((entry) => entry.id).slice(0, 1);
  }
  return null;
}

/** Authored metadata gives a useful, explicit fallback; it never writes facts. */
export function searchLocally(query: string, entries: readonly PortfolioEntry[]): string[] {
  const normalized = normalizeQuery(query);
  if (!normalized) return [];
  const [positive, negative = ''] = normalized.split(/\s+(?:but no|but not|without|except(?: for)?|excluding)\s+/, 2);
  const excluded = terms(negative);
  const positiveTerms = terms(positive);
  const skillsRequest = /\bgood at\b|\bskills?\b|\bstrengths?\b/.test(positive);
  const workRequest = positiveTerms.join(' ') === 'work';
  const projectRequest = positiveTerms.length > 0
    && positiveTerms.every((term) => ['project', 'projects', 'portfolio'].includes(term));
  const outsideWork = /\boutside (?:of )?work\b/.test(positive);
  const candidates = entries.filter((entry) => {
    if (skillsRequest && entry.category !== 'craft' && entry.category !== 'work') return false;
    if (workRequest && entry.category !== 'work') return false;
    if (projectRequest && entry.category !== 'project') return false;
    if (outsideWork && entry.category !== 'life') return false;
    const labels = metadata(entry);
    return !excluded.some((word) => [word, ...(relatedTerms[word] ?? [])].some((term) => matches(term, labels)));
  });
  const direct = directMatch(positive, candidates);
  if (direct !== null) return direct;

  let requested = positiveTerms;
  if (skillsRequest) {
    requested = ['strengths'];
  } else if (/\brunning career\b/.test(positive)) {
    requested = ['running'];
  } else if (outsideWork) {
    requested = ['life'];
  }
  if (!requested.length) return [];

  return candidates.map((entry) => {
    const labels = metadata(entry);
    const description = new Set(terms(entry.summary));
    let score = 0;
    let covered = 0;
    for (const word of requested) {
      const aliases = [word, ...(relatedTerms[word] ?? [])];
      const labelHits = aliases.filter((alias) => matches(alias, labels)).length;
      const descriptionHit = aliases.some((alias) => matches(alias, description));
      if (labelHits || descriptionHit) covered += 1;
      score += labelHits ? 3 + Math.min(labelHits - 1, 2) : descriptionHit ? 1 : 0;
    }
    // Most meaningful words must have evidence. Unrelated asks return no cards.
    return { id: entry.id, score, coverage: covered / requested.length };
  }).filter((entry) => entry.score > 0 && entry.coverage >= 0.75)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4).map((entry) => entry.id);
}
