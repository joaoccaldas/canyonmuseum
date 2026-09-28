import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const file = path.join(root, 'web/src/artworld.js');
const src = fs.readFileSync(file, 'utf8');

test('art world runtime parses as standalone browser script', () => {
  assert.doesNotThrow(() => new Function(src));
});

test('distance-reactive place studies and hidden collection stay wired', () => {
  for (const token of ['St. George', 'Las Vegas', 'Nice', 'Kona', 'horror-in', 'horror-out', 'regionOf', 'walkable', 'update']) {
    assert.ok(src.includes(token), token);
  }
});

test('hidden collection uses sparse full-detail bikes plus lightweight archive silhouettes', () => {
  assert.match(src, /fullCount\s*=\s*mobile\s*\?\s*4\s*:\s*6/);
  assert.match(src, /ghostCount\s*=\s*mobile\s*\?\s*5\s*:\s*10/);
  assert.match(src, /simplified/);
});
