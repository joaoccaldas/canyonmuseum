import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FINDS } from '../src/finds.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const J = f => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));

test('Kona island guide has stable ids, authoritative sources and no live tracking', () => {
  const g = J('museum/kona/island-guide.json');
  assert.equal(g.schema_version, 1);
  assert.equal(g.race_2026.date, '2026-10-10');
  assert.equal(g.population.geography, 'Hawaii County, Hawaii');
  assert.equal(g.population.population, 210043);
  const ids = g.places.map(p => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const p of g.places) {
    assert.ok(p.name && p.location_query && p.source, p.id);
    assert.match(p.source, /^https:\/\/(?:www\.)?(?:nps\.gov|gohawaii\.com)\//, p.id);
    assert.ok(Array.isArray(p.categories) && p.categories.length, p.id);
    assert.equal('lat' in p || 'lng' in p || 'long' in p, false, `${p.id}: geocode only when sourced/verified`);
  }
  assert.match(JSON.stringify(g), /does not track a visitor's live location/);
  assert.ok(g.places.some(p => p.sensitivity === 'culturally-significant'));
});

test('Island Stories is a connected, sourced-content wing with eight rooms', () => {
  const idx = J('museum/world/wings/index.json');
  assert.ok(idx.wings.includes('island-stories.json'));
  const w = J('museum/world/wings/island-stories.json');
  assert.equal(w.rooms.length, 8);
  assert.equal(w.floor, 'upper');
  assert.ok(w.rooms.some(r => r.id === 'island-today'));
  assert.ok(w.rooms.some(r => r.id === 'visit-care'));
  for (const r of w.rooms) {
    assert.ok(r.design?.wall && r.design?.floor && r.design?.light && r.design?.accent, r.id);
  }
});

test('the hidden-find promise is exactly nine real, unique, rarity-labelled objects', () => {
  assert.equal(FINDS.length, 9);
  assert.equal(new Set(FINDS.map(f => f.id)).size, 9);
  const allowed = new Set(['common','rare','archive','prototype']);
  for (const f of FINDS) {
    assert.ok(allowed.has(f.rarity), f.id);
    assert.ok(Number.isFinite(f.x) && Number.isFinite(f.y) && Number.isFinite(f.z), f.id);
  }
  assert.ok(FINDS.some(f => f.rarity === 'prototype'));
});

test('room design stays data-driven instead of naming rooms in the engine', () => {
  const src = fs.readFileSync(path.join(root, 'web/src/engine/wing.js'), 'utf8');
  for (const id of ['carbon','air','future','heat','night','archive','voyaging','royal-kona','volcanoes','ocean','coffee','island-today','race-week','visit-care']) {
    assert.doesNotMatch(src, new RegExp(`['"\\]${id}['"\\]`), `engine hard-codes ${id}`);
  }
  assert.match(src, /r\.design \|\| \{\}/);
});
