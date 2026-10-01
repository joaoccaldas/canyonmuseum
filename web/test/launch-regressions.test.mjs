import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readPassportState, savePassportState, normalizePassport } from '../src/engine/passport-state.js';
import { createRaceSetupStore } from '../src/studio/race-setup.js';
import { applyEvent, emptyProgression } from '../src/engine/progression.js';
import { itemCollection } from '../src/engine/items.js';
import { syncIdentityFromSetup } from '../src/engine/identity.js';
const memory = entries => {
  const rows = new Map(Object.entries(entries || {}));
  return { getItem: k => rows.get(k) ?? null, setItem: (k,v) => rows.set(k,v), removeItem: k => rows.delete(k) };
};
test('Museum and Experiences passport schemas survive both route orders and reload', () => {
  for (const first of ['museum','experiences']) {
    const museum={v:1,discoveries:['cfr'],visits:2,pose:{x:0,z:3}};
    const experiences={v:1,stamps:{'find:lava:raven':{at:10,label:'Raven'}},badges:{collector:10},xp:80};
    const storage=memory({'speedmax.passport.v1':JSON.stringify(first==='museum'?museum:experiences)});
    const loaded=readPassportState(storage);
    assert.ok(loaded.stamps && loaded.badges && Array.isArray(loaded.discoveries));
    savePassportState(first==='museum'?experiences:museum,storage);
    const merged=readPassportState(storage);
    assert.deepEqual(merged.discoveries,['cfr']);
    assert.equal(merged.stamps['find:lava:raven'].at,10);
    assert.equal(merged.badges.collector,10);
    assert.equal(merged.xp,80);
    assert.equal(merged.visits,2);
    savePassportState({...loaded,pose:{x:2,z:4}},storage);
    assert.equal(readPassportState(storage).xp,80,'stale world pose saves cannot erase earned XP');
  }
});
test('malformed passport fields normalize safely and blocked saves report failure', () => {
  assert.deepEqual(normalizePassport({discoveries:null,stamps:[],badges:null}).discoveries,[]);
  const blocked={getItem:()=>null,setItem:()=>{throw new Error('quota');}};
  assert.throws(()=>savePassportState({v:1,xp:5},blocked),/could not be saved/);
  assert.throws(()=>createRaceSetupStore(blocked).save(null,[]),/could not be saved/);
});
test('fixed collectible reward cannot be farmed by repeating an action', () => {
  const event={type:'FIND_DISCOVERED',subject:'find:lava:raven'};
  let state=applyEvent(emptyProgression(),event).state;
  const xp=state.xp,credits=state.credits;
  for(let i=0;i<100;i++)state=applyEvent(state,{...event,id:`new-request-${i}`}).state;
  assert.equal(state.xp,xp);assert.equal(state.credits,credits);assert.equal(state.discoveries.length,1);
});
test('parallel legacy and canonical passport histories merge without losing either', () => {
  const storage=memory({
    'speedmax.passport.v1':JSON.stringify({discoveries:['cfr'],visits:4,stamps:{old:{at:1}},xp:80}),
    'kona.passport.v1':JSON.stringify({discoveries:['slx'],visits:2,stamps:{recent:{at:2}},xp:5}),
  });
  const state=savePassportState(readPassportState(storage),storage);
  assert.deepEqual(state.discoveries,['cfr','slx']);
  assert.deepEqual(Object.keys(state.stamps),['old','recent']);
  assert.equal(state.visits,4);assert.equal(state.xp,80);
});
test('collection includes new passport stamps even when progression already exists', () => {
  const items=itemCollection({progression_engine:emptyProgression(),progression:{stamps:{'find:tunnel:tuft':{at:1}},discoveries:['cfr']}});
  assert.equal(items.filter(x=>x.kind==='find').length,1);
  assert.equal(items.filter(x=>x.kind==='bike').length,1);
});
test('Studio preview has no startup identity write and saves only successful requests', () => {
  const src=fs.readFileSync(new URL('../src/studio/main.js',import.meta.url),'utf8');
  assert.doesNotMatch(src.split('// ---------------------------------------------------------------- renderer')[0],/syncIdentityFromSetup\(raceSetup/);
  assert.match(src,/if \(await show\(p\)\) saveCurrentToSetup/);
  assert.match(src,/if \(!current \|\| loadingProduct\)/);
});
test('a failed graph save preserves existing identity and equipment', () => {
  const equipment=JSON.stringify([{id:'equipment:shoe',product_id:'product:shoe',relationship:'owned'}]);
  const identity=JSON.stringify({goal:{label:'Finish comfortably'},setup:{shoe:'equipment:shoe'}});
  const store=memory({'kona.userEquipment.v1':equipment,'kona.raceIdentity.v1':identity});
  const set=store.setItem;let failed=false;
  store.setItem=(key,value)=>{if(key==='kona.raceIdentity.v1'&&!failed){failed=true;throw new Error('quota');}set(key,value);};
  const result=syncIdentityFromSetup(null,[],store);
  assert.equal(result.persisted,false);
  assert.equal(store.getItem('kona.userEquipment.v1'),equipment);
  assert.equal(store.getItem('kona.raceIdentity.v1'),identity);
});
