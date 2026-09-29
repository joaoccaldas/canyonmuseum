import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, '../src/landing.js'), 'utf8');

test('walkable floor overlays are depth-separated on mobile', () => {
  assert.ok(src.includes('polygonOffsetFactor: -2'));
  assert.ok(src.includes('setPosition(0, .014, z)'));
  assert.ok(src.includes('e.position.set(x, .014, -16.5)'));
  assert.ok(src.includes('b.top + .012'));
  assert.ok(src.includes("'#f7e3b8', .16), RCX, .014, RCZ"));
});

test('decorative floor overlays do not write depth', () => {
  const line = src.match(/line: new THREE\.MeshBasicMaterial\(\{[^\n]+/u)?.[0] || '';
  const edge = src.match(/edge: new THREE\.MeshBasicMaterial\(\{[^\n]+/u)?.[0] || '';
  assert.match(line, /depthWrite: false/);
  assert.match(edge, /depthWrite: false/);
});
