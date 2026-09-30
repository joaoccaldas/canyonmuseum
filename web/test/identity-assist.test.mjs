import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmCandidate, rememberHistory, reviewCandidates, scoreMatch } from '../src/engine/identity-assist.js';
import { assistMarkup } from '../src/ui/race-assist.js';

const hints = { name: 'Ana Costa', country: 'PT', birthYear: 1990, knownRace: 'Example Triathlon', email: 'ana@example.com' };

function candidate(overrides) {
  return {
    id: 'ex-1',
    source: 'example-timing',
    athleteName: 'Ana Costa',
    country: 'PT',
    birthYear: 1990,
    eventName: 'Example Triathlon',
    year: 2024,
    time: '5:00:00',
    ...overrides,
  };
}

test('a name alone stays hidden, and email never counts', () => {
  assert.equal(scoreMatch({ name: 'Ana Costa', email: 'ana@example.com' }, candidate()).score, 0.35);
  assert.equal(reviewCandidates({ name: 'Ana Costa', email: 'ana@example.com' }, [candidate()]).length, 0);
});

test('likely, possible and ambiguous results stay unconfirmed until the person says so', () => {
  const rows = reviewCandidates(hints, [
    candidate(),
    candidate({ id: 'ex-2', eventName: 'Other Race', time: '6:00:00' }),
    candidate({ id: 'ex-3', athleteName: 'Ana Costa', eventName: 'Second Example', birthYear: null, country: null }),
  ]);
  const likely = rows.find(row => row.id === 'ex-1');
  const possible = rows.find(row => row.id === 'ex-2');
  assert.equal(likely.confidence, 0.9);
  assert.equal(likely.band, 'likely');
  assert.equal(likely.ambiguous, true);
  assert.equal(possible.confidence, 0.7);
  assert.equal(rows.some(row => row.id === 'ex-3'), false);
  assert.equal(confirmCandidate(likely, 'not-me').ok, false);
  const saved = confirmCandidate(likely, 'thats-me', '2026-09-30T00:00:00.000Z');
  assert.equal(saved.history.confirmed, true);
  assert.equal(saved.history.ambiguous, true);
  assert.equal(saved.history.source, 'example-timing');
  assert.equal(saved.history.email, undefined);
});

test('the same confirmed result is stored once and erase removes it', async () => {
  const storage = new Map();
  const memory = {
    get length() { return storage.size; },
    key: index => [...storage.keys()][index] ?? null,
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key),
  };
  const [row] = reviewCandidates(
    { name: 'Rui Costa', country: 'PT', birthYear: 1990, knownRace: 'Example Triathlon' },
    [candidate({ id: 'ex-9', athleteName: 'Rui Costa' })],
  );
  const decided = confirmCandidate(row, 'thats-me', '2026-09-30T00:00:00.000Z');
  rememberHistory(decided.history, memory);
  rememberHistory(decided.history, memory);
  assert.equal(JSON.parse(storage.get('speedmax.raceHistory.v1')).length, 1);
  storage.set('other', 'keep');
  const { eraseAppState } = await import('../src/engine/app-state.js');
  assert.equal(eraseAppState(memory), 1);
  assert.equal(storage.get('speedmax.raceHistory.v1'), undefined);
  assert.equal(storage.get('other'), 'keep');
});

test('assist cards escape text and do not invent a search', () => {
  const [row] = reviewCandidates(
    { name: 'Ana Costa', country: 'PT', birthYear: 1990, knownRace: 'Example Triathlon' },
    [candidate({ eventName: '<script>' })],
  );
  const html = assistMarkup([row]);
  assert.match(html, /&lt;script&gt;/);
  assert.equal(html.includes('fetch('), false);
  assert.match(html, /That's me/);
  assert.match(html, /Find my races/);
});
