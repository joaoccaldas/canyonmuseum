import test from 'node:test';import assert from 'node:assert/strict';
import {addToGarage,groupGarage,readGarage,removeFromGarage} from '../src/engine/garage.js';
function memory(){const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}}
test('Discover add → Garage → reload persistence contract',()=>{
 globalThis.localStorage=memory();
 let r=addToGarage('canyon-cfr-2027',{relationship:'dream'});assert.equal(r.added,true);
 const afterReload=readGarage();assert.equal(afterReload.length,1);assert.equal(afterReload[0].productId,'canyon-cfr-2027');assert.equal(afterReload[0].relationship,'dream');
 assert.equal(groupGarage(afterReload).dream.length,1);
 removeFromGarage(afterReload[0].id);assert.equal(readGarage().length,0);
 delete globalThis.localStorage;
});
test('duplicate add is idempotent',()=>{globalThis.localStorage=memory();addToGarage('canyon-cfr-2027');const r=addToGarage('canyon-cfr-2027');assert.equal(r.added,false);assert.equal(readGarage().length,1);delete globalThis.localStorage;});
