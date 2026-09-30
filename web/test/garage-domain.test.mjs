import test from 'node:test';import assert from 'node:assert/strict';
import {groupGarage,raceSetup,userEquipment} from '../src/engine/garage.js';
const products=[{id:'bike:1',name:'Bike'},{id:'shoe:1',name:'Shoe'}];
test('owned dream and try are distinct signals',()=>{const rows=[userEquipment({id:'u1',productId:'bike:1',relationship:'owned'}),userEquipment({id:'u2',productId:'shoe:1',relationship:'dream'})];const g=groupGarage(rows,products);assert.equal(g.owned.length,1);assert.equal(g.dream.length,1);assert.equal(g.try.length,0);});
test('user equipment references product instead of copying specs',()=>{const x=userEquipment({id:'u1',productId:'bike:1'});assert.equal(x.productId,'bike:1');assert.equal('weight' in x,false);assert.equal('brand' in x,false);});
test('invalid relationship fails closed',()=>assert.throws(()=>userEquipment({id:'x',productId:'bike:1',relationship:'sponsored'})));
test('race setup de-duplicates equipment ids',()=>assert.deepEqual(raceSetup({id:'r1',eventId:'kona-2026',equipmentIds:['u1','u1','u2']}).equipmentIds,['u1','u2']));
