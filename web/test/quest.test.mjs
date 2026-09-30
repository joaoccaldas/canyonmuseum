import test from 'node:test';
import assert from 'node:assert/strict';
import { BIKES, decodeShare, encodeShare, questReady, relationshipFor } from '../src/quest.js';
import { identityFromQuest } from '../src/engine/identity.js';

test('the first quest can finish without a bike and does not invent brands', () => {
  assert.equal(questReady({ intent: 'dreaming', goal: 'Finish' }), true);
  assert.equal(questReady({ intent: 'dreaming' }), false);
  assert.equal(relationshipFor('racing'), 'owned');
  assert.equal(relationshipFor('dreaming'), 'dream');
  assert.equal(relationshipFor('exploring'), 'try');
  assert.ok(BIKES.every(bike => bike.id.startsWith('canyon-')));
  assert.equal(BIKES.some(bike => /cervelo|trek|bmc/i.test(bike.label)), false);
  const graph = identityFromQuest({ intent: 'dreaming', bikeId: 'canyon-cfr-2027', shoeId: 'nike-alphafly-3-study', goal: 'Sub-10' });
  assert.equal(graph.identity.mode, 'dream');
  assert.equal(graph.identity.goal.label, 'Sub-10');
  assert.equal(graph.equipment.length, 2);
  assert.ok(graph.equipment.every(row => row.relationship === 'dream' && row.vendor_analytics_eligible === false));
});

test('a share link round-trips only a known setup', () => {
  const draft = { intent: 'dreaming', bikeId: 'canyon-cfr-2027', shoeId: 'nike-alphafly-3-study', goal: 'Sub-10' };
  assert.deepEqual(decodeShare(encodeShare(draft)), draft);
  assert.equal(decodeShare('dreaming.canyon-cfr-2027..sub-10').bikeId, 'canyon-cfr-2027');
  assert.equal(decodeShare('dreaming.canyon-cfr-2027..sub-10').shoeId, null);
  assert.equal(decodeShare('dreaming.cervelo-p5..sub-10'), null);
  assert.equal(decodeShare('dreaming.canyon-cfr-2027.nike-alphafly-3-study.sub-10.extra'), null);
  assert.equal(encodeShare({ intent: 'dreaming', goal: 'Win Kona' }), null);
});
