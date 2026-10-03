import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import type { PortfolioEntry } from '../src/content/types.ts';
import { normalizeQuery, searchLocally } from '../src/search/local.ts';
import { searchPortfolio } from '../src/search/index.ts';

const entries = JSON.parse(readFileSync(new URL('../src/content/catalog.json', import.meta.url), 'utf8')) as PortfolioEntry[];

test('a résumé request finds the actual downloadable résumé', () => {
  assert.deepEqual(searchLocally('Can I see Brett’s résumé?', entries), ['resume']);
  assert.deepEqual(searchLocally('CV', entries), ['resume']);
});

test('the skills question surfaces a coherent set of authored work and craft', () => {
  const ids = searchLocally('What is Brett good at?', entries);
  assert.equal(ids.length, 4);
  assert.ok(ids.includes('design-systems'));
  assert.ok(ids.includes('interaction-design'));
  assert.ok(ids.every((id) => ['work', 'craft'].includes(entries.find((entry) => entry.id === id)!.category)));
});

test('exclusions remove matching objects rather than just reducing their score', () => {
  const ids = searchLocally('projects without music', entries);
  assert.ok(ids.length > 0);
  assert.ok(!ids.includes('virtuosos'));
  assert.ok(!ids.includes('frogmancer'));
  assert.deepEqual(searchLocally('résumé without résumé', entries), []);
  const nongameProjects = searchLocally('projects without games', entries);
  assert.ok(nongameProjects.length > 0);
  assert.ok(nongameProjects.every((id) => entries.find((entry) => entry.id === id)!.category === 'project'));
  assert.ok(!nongameProjects.includes('contact'));
});

test('specific topics require enough evidence to avoid broad partial matches', () => {
  assert.deepEqual(searchLocally('Design systems', entries), ['design-systems']);
  assert.deepEqual(searchLocally('Creative programming', entries), ['creative-programming']);
});

test('a playful request finds authored games when the backend is offline', () => {
  const ids = searchLocally('Something playful', entries);
  assert.ok(ids.length > 0);
  assert.ok(ids.includes('robolol'));
  assert.ok(ids.every((id) => {
    const entry = entries.find((entry) => entry.id === id)!;
    return entry.topics.some((topic) => /game|humor|jokes/i.test(topic));
  }));
});

test('running and contact can be found from ordinary requests', () => {
  assert.deepEqual(searchLocally('Tell me about running', entries), ['running']);
  assert.deepEqual(searchLocally('Running career', entries), ['running']);
  assert.deepEqual(searchLocally('What does Brett do outside work?', entries), ['running']);
  assert.deepEqual(searchLocally('Show me his work', entries), ['design-systems', 'virtuosos']);
  assert.deepEqual(searchLocally('How can I reach Brett?', entries), ['contact']);
});

test('an empty or unsupported topic does not lift random objects', () => {
  assert.deepEqual(searchLocally('   ', entries), []);
  assert.deepEqual(searchLocally('quantum particle accelerators', entries), []);
  assert.deepEqual(searchLocally('What is his favorite pizza topping?', entries), []);
});

test('normalization keeps meaningful words and handles accents and punctuation', () => {
  assert.equal(normalizeQuery('  Show Brett’s RÉSUMÉ?!  '), 'show bretts resume');
  assert.equal(normalizeQuery('x'.repeat(300)).length, 240);
});

test('a successful model response only exposes valid, unique content IDs', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => Response.json({
    ids: ['running', 'invented-biography', 'running'], source: 'laya',
  }));
  const result = await searchPortfolio('running', entries, new AbortController().signal);
  assert.deepEqual(result, { ids: ['running'], source: 'laya' });
});

test('an unavailable service falls back without claiming to use Laya', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => { throw new Error('Connection refused'); });
  const result = await searchPortfolio('running', entries, new AbortController().signal);
  assert.deepEqual(result, { ids: ['running'], source: 'local' });
});

test('an aborted request cannot return a fallback over a newer search', async (context) => {
  const controller = new AbortController();
  context.mock.method(globalThis, 'fetch', async () => {
    controller.abort();
    throw new DOMException('Request aborted', 'AbortError');
  });
  await assert.rejects(searchPortfolio('running', entries, controller.signal), { name: 'AbortError' });
});
