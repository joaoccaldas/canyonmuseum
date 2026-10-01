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

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
const ajv=new Ajv2020({allErrors:true,strict:true});addFormats(ajv);
const validators=Object.fromEntries(['room-totem','door-challenge','kona-season-ranking','kona-intern-summary'].map(name=>[name,ajv.compile(read('schemas/v1/'+name+'.schema.json'))]));
const example=read('docs/examples/kona-game-v1.example.json');
test('complete proposal payloads satisfy draft-2020 contracts',()=>{
 for(const [name,rows] of [['room-totem',example.totems],['door-challenge',[example.door_challenge]],['kona-season-ranking',[example.ranking]],['kona-intern-summary',example.intern_contract_examples]])for(const row of rows)assert.ok(validators[name](row),JSON.stringify(validators[name].errors));
});
test('ranking rejects absent speed caps, pay events and small populations',()=>{
 for(const change of [x=>delete x.caps,x=>delete x.caps.early_access,x=>x.excluded_events.pop(),x=>x.excluded_events.push('paid-room'),x=>x.minimum_population=2]){const row=structuredClone(example.ranking);change(row);assert.equal(validators['kona-season-ranking'](row),false);}
});
test('serious stories require straight mode and sponsorship requires disclosure',()=>{
 const serious=structuredClone(example.intern_contract_examples[0]);serious.intern_mode='cosmic';assert.equal(validators['kona-intern-summary'](serious),false);
 for(const label of [undefined,null,'','   ']){const sponsored=structuredClone(example.intern_contract_examples[1]);sponsored.sponsor_label=label;assert.equal(validators['kona-intern-summary'](sponsored),false);}
});
test('door rejects unbounded early access and invalid scoring dimensions',()=>{
 for(const change of [x=>x.reward.early_access_band=.5,x=>x.scoring.weights.theme=-1,x=>x.scoring.weights.luck=.1]){const row=structuredClone(example.door_challenge);change(row);assert.equal(validators['door-challenge'](row),false);}
});
