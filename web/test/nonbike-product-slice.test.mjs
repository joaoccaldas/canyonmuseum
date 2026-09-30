import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {artifactViewModel} from '../src/ui/artifact-model.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../../museum/catalog/products.json',import.meta.url),'utf8'));const products=catalog.products||catalog;
test('catalog is no longer bike-only',()=>{assert.ok(products.some(x=>x.type==='bike'));assert.ok(products.some(x=>x.type==='shoe'));});
test('Alphafly travels through canonical Artifact without Nike runtime branch',()=>{const p=products.find(x=>x.id==='nike-alphafly-3-study');const vm=artifactViewModel(p);assert.equal(vm.id,p.id);assert.equal(vm.title,'Alphafly 3');assert.equal(vm.actions.garage,true);});
test('canonical product contains no user relationship',()=>{const p=products.find(x=>x.id==='nike-alphafly-3-study');for(const k of ['owned','dream','try','userId'])assert.equal(k in p,false);});
