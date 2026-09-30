import test from 'node:test';
import assert from 'node:assert/strict';
import { discoverMuseumItem, emptyMuseumPassport, parseMuseumPassport, readMuseumPassport, writeMuseumPassport } from '../src/engine/museum-passport.js';

test('invalid passport fails closed to empty v1', () => {
  assert.deepEqual(parseMuseumPassport('{"v":9}'), emptyMuseumPassport());
  assert.deepEqual(parseMuseumPassport('{'), emptyMuseumPassport());
});

test('passport de-duplicates discoveries', () => {
  const p=parseMuseumPassport({v:1,discoveries:['a','a','b'],visits:2,pose:null});
  assert.deepEqual(p.discoveries,['a','b']);
});

test('discovery is idempotent', () => {
  let r=discoverMuseumItem(emptyMuseumPassport(),'bike-a');
  assert.equal(r.added,true);
  r=discoverMuseumItem(r.passport,'bike-a');
  assert.equal(r.added,false);
  assert.deepEqual(r.passport.discoveries,['bike-a']);
});

test('persistence adapter has no hard-coded storage dependency', () => {
  let value=null;
  const first=writeMuseumPassport({v:1,discoveries:['x'],visits:0,pose:null},{write:v=>value=v});
  assert.equal(first.discoveries[0],'x');
  const second=readMuseumPassport({read:()=>value});
  assert.deepEqual(second,first);
});
