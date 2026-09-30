import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalProductId, canonicalProduct, equipmentRecord, projectSetup, syncIdentityFromSetup, sealVendorInsight, RACE_IDENTITY_KEY, USER_EQUIPMENT_KEY } from '../src/engine/identity.js';

const bike = { id: 'canyon-cfr-2027', brand: 'Canyon', name: 'Speedmax CFR AXS', type: 'bike', year: 2027 };
const shoe = { id: 'nike-alphafly-3-study', brand: 'Nike', name: 'Alphafly 3', type: 'shoe', year: 2026 };

test('catalog ids become canonical product ids without copying the record', () => {
  assert.equal(canonicalProductId(bike), 'product:canyon-cfr-2027');
  assert.equal(canonicalProductId('product:canyon-cfr-2027'), 'product:canyon-cfr-2027');
  const canon = canonicalProduct(bike);
  assert.equal(canon.entity_type, 'product');
  assert.deepEqual(canon.legacy_ids, ['canyon-cfr-2027']);
  assert.equal(canon.category, 'bike');
  assert.notEqual(canon.id, bike.id);
});

test('the same product is two equipment rows when two people hold it', () => {
  const a = equipmentRecord({ userId: 'user:joao', product: bike, relationship: 'owned' });
  const b = equipmentRecord({ userId: 'user:anna', product: bike, relationship: 'dream' });
  assert.equal(a.product_id, b.product_id);
  assert.notEqual(a.id, b.id);
  assert.equal(a.relationship, 'owned');
  assert.equal(b.relationship, 'dream');
  assert.equal(a.vendor_analytics_eligible, false);
});

test('a saved Race Setup projects equipment ids, and a bike-supplied wheel is not a second product', () => {
  const setup = {
    schema_version: 1,
    event_id: 'kona-2026',
    slots: {
      bike: { product_id: 'canyon-cfr-2027', configuration: { look: '', scene: 'kona' } },
      wheel: { source: 'bike', product_id: 'canyon-cfr-2027' },
      helmet: null,
      shoe: { product_id: 'nike-alphafly-3-study', configuration: { look: '', scene: 'kona' } },
    },
  };
  const { equipment, identity } = projectSetup(setup, [bike, shoe]);
  assert.equal(equipment.length, 2);
  assert.equal(identity.entity_type, 'race-identity');
  assert.equal(identity.mode, 'dream');
  assert.match(identity.setup.bike, /^equipment:/);
  assert.match(identity.setup.shoe, /^equipment:/);
  assert.equal(identity.setup.wheel_front, null);
  assert.equal(identity.setup.wheel_rear, null);
  assert.ok(equipment.every(row => row.relationship === 'try'));
  assert.ok(equipment.every(row => row.product_id.startsWith('product:')));
});

test('sync writes the graph and leaves the Race Setup key alone', () => {
  const mem = new Map();
  const storage = {
    getItem: k => mem.get(k) ?? null,
    setItem: (k, v) => mem.set(k, v),
  };
  storage.setItem('speedmax.raceSetup.v1', '{"keep":true}');
  const setup = { slots: { bike: { product_id: 'canyon-cfr-2027' }, wheel: { source: 'bike', product_id: 'canyon-cfr-2027' } } };
  syncIdentityFromSetup(setup, [bike], storage);
  assert.equal(storage.getItem('speedmax.raceSetup.v1'), '{"keep":true}');
  const identity = JSON.parse(storage.getItem(RACE_IDENTITY_KEY));
  const rows = JSON.parse(storage.getItem(USER_EQUIPMENT_KEY));
  assert.equal(identity.setup.bike, rows[0].id);
  assert.equal(rows[0].product_id, 'product:canyon-cfr-2027');
});

test('vendor insight stays aggregate, opted in, and above the group floor', () => {
  assert.equal(sealVendorInsight({ product_id: 'canyon-cfr-2027', counts: { dream: 3 }, contains_user_ids: false, consent_basis: 'explicit-opt-in' }), null);
  assert.equal(sealVendorInsight({ product_id: 'canyon-cfr-2027', counts: { dream: 12 }, contains_user_ids: true, consent_basis: 'explicit-opt-in' }), null);
  assert.equal(sealVendorInsight({ product_id: 'canyon-cfr-2027', counts: { dream: 12 }, contains_user_ids: false, consent_basis: 'explicit-opt-in', note: 'user:joao' }), null);
  const ok = sealVendorInsight({ product_id: 'nike-alphafly-3-study', counts: { owned: 2, dream: 11, try: 4 }, contains_user_ids: false, consent_basis: 'explicit-opt-in' });
  assert.equal(ok.product_id, 'product:nike-alphafly-3-study');
  assert.equal(ok.counts.dream, 11);
  assert.equal(ok.counts.owned, 2);
  assert.equal(ok.minimum_group_size, 10);
});
