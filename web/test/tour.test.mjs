import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { planTour } from '../src/museum/tour.js';

const plan = JSON.parse(fs.readFileSync(new URL('../../museum/world/tour.json', import.meta.url)));
const titles = JSON.parse(fs.readFileSync(new URL('../../museum/kona_champions.json', import.meta.url))).titles;
const variants = JSON.parse(fs.readFileSync(new URL('../../museum/wyld_room.json', import.meta.url))).variants;
const years = JSON.parse(fs.readFileSync(new URL('../../museum/kona_years.json', import.meta.url))).years;

const world = {
  pieces: [{ id: 'a', glb: 'a.glb' }, { id: 'b' }, { id: 'f', glb: 'f.glb', flagship: true }],
  champs: titles.map((t, i) => ({ ...t, index: i })),
  wyld: variants.map((v, i) => ({ ...v, index: i })),
  pier: { stations: years.map((y, i) => ({ ...y, index: i })), finale: { kind: 'finale' } },
};

test('every exhibit the tour plan names exists in the museum data', () => {
  for (const s of plan.stops) {
    for (const y of s.titles || []) assert.ok(titles.some(t => t.year === y), `champion title ${y}`);
    for (const id of s.variants || []) assert.ok(variants.some(v => v.id === id), `WYLD variant ${id}`);
    for (const y of s.years || []) assert.ok(years.some(v => v.year === y), `pier year ${y}`);
  }
});

test('planTour resolves stops by key, in walking order, skipping missing exhibits', () => {
  const stops = planTour(plan, world);
  assert.equal(stops[0].kind, 'hween');
  assert.deepEqual(stops.filter(s => s.kind === 'piece').map(s => s.p.id), ['a', 'f']);   // no-model pieces are skipped; flagships come later
  assert.deepEqual(stops.filter(s => s.kind === 'champ').map(s => s.c.year), [2015, 2017, 2019, 2024]);
  assert.equal(stops.at(-1).y.kind, 'finale');
  const noPier = planTour(plan, { ...world, pier: null });
  assert.ok(noPier.every(s => s.kind !== 'pier'));
  assert.deepEqual(planTour({ stops: [{ room: 'kona', titles: [1901] }] }, world), []);
});

test('the tour keeps the stops it had before it became data', () => {
  const stops = planTour(plan, world);
  assert.deepEqual(stops.filter(s => s.kind === 'champ').map(s => s.c.index), [0, 2, 4, 5]);
  assert.deepEqual(stops.filter(s => s.kind === 'wyld').map(s => s.v.index), [0, 3]);
  assert.deepEqual(stops.filter(s => s.kind === 'pier' && s.y.kind !== 'finale').map(s => s.y.index), [0, 4, 9, 10, 11]);
});
