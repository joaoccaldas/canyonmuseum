import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { emptyRaceSetup, normaliseRaceSetup, setupFromBike, encodeRaceSetup, decodeRaceSetup, completedSlots, RACE_SETUP_KEY } from '../src/studio/race-setup.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CAT = JSON.parse(fs.readFileSync(path.join(root, 'museum/catalog/products.json'), 'utf8'));
const product = CAT.products[0];

test('race setup is brand-agnostic and references product ids only', () => {
  const s = setupFromBike(product, 'abc', 'kona');
  assert.equal(s.event, 'kona-2026');
  assert.equal(s.bike.productId, product.id);
  assert.equal(s.bike.look, 'abc');
  assert.deepEqual(s.wheels, { source: 'bike', productId: product.id });
  assert.equal(s.helmet, null);
  assert.equal(s.shoes, null);
  assert.equal(completedSlots(s), 2);
  assert.equal(JSON.stringify(s).includes(product.brand), false);
});

test('race setup deep link round-trips and rejects unknown products/hostile state', () => {
  const s = setupFromBike(product, 'safe-look', 'night');
  const enc = encodeRaceSetup(s, CAT.products);
  const back = decodeRaceSetup(enc, CAT.products);
  assert.equal(back.bike.productId, product.id);
  assert.equal(back.bike.scene, 'night');
  assert.equal(back.bike.look, 'safe-look');

  const bad = Buffer.from(JSON.stringify({ v:1, e:'kona-2026', b:{ p:'not-a-product', s:'<script>', c:'javascript:alert(1)' } })).toString('base64url');
  assert.equal(decodeRaceSetup(bad, CAT.products), null);
  assert.equal(decodeRaceSetup('x'.repeat(1201), CAT.products), null);
});

test('normalisation drops future equipment injection in V0', () => {
  const s = normaliseRaceSetup({
    event:'kona-2026',
    bike:{ productId:product.id, look:'', scene:'kona' },
    helmet:{ id:'evil', html:'<img>' },
    shoes:{ id:'nike-whatever' }
  }, CAT.products);
  assert.equal(s.helmet, null);
  assert.equal(s.shoes, null);
  assert.equal(s.wheels.source, 'bike');
});

test('local storage key is isolated from profile and passport state', () => {
  assert.equal(RACE_SETUP_KEY, 'speedmax.raceSetup.v1');
  assert.notEqual(RACE_SETUP_KEY, 'speedmax.profile.v1');
  assert.notEqual(RACE_SETUP_KEY, 'speedmax.passport.v1');
});

test('empty setup stays empty and share encoding is omitted', () => {
  const s = emptyRaceSetup();
  assert.equal(completedSlots(s), 0);
  assert.equal(encodeRaceSetup(s, CAT.products), '');
});
