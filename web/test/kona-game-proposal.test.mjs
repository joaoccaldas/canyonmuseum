import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>JSON.parse(fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8'));

test('game proposal schemas parse and keep competitive integrity fields explicit',()=>{
  const totem=read('schemas/v1/room-totem.schema.json');
  const door=read('schemas/v1/door-challenge.schema.json');
  const rank=read('schemas/v1/kona-season-ranking.schema.json');
  const intern=read('schemas/v1/kona-intern-summary.schema.json');
  assert.ok(totem.required.includes('grant'));
  assert.ok(door.required.includes('scoring'));
  assert.ok(rank.properties.excluded_events.items.enum.includes('purchase'));
  assert.ok(rank.properties.excluded_events.items.enum.includes('affiliate-click'));
  assert.ok(intern.properties.intern_mode.enum.includes('cosmic'));
  assert.ok(intern.required.includes('serious_mode'));
});

test('proposal examples keep door cadence, bounded early access and source-first editorial framing',()=>{
  const e=read('docs/examples/kona-game-v1.example.json');
  const open=new Date(e.door_challenge.opens_at),close=new Date(e.door_challenge.closes_at);
  assert.equal((close-open)/86400000,3);
  assert.ok(e.door_challenge.reward.early_access_band>0&&e.door_challenge.reward.early_access_band<=.1);
  assert.ok(e.ranking.minimum_population>=25);
  assert.ok(e.intern_examples.length>=4);
});
