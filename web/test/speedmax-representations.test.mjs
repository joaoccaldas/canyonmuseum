import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {representationFor} from '../src/world/product-representations.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../../museum/catalog/products.json',import.meta.url),'utf8'));
const products=catalog.products||catalog;const p=products.find(x=>x.id==='canyon-cfr-2027');
test('Speedmax keeps one canonical id across world and Studio representations',()=>{assert.equal(p.id,'canyon-cfr-2027');assert.notEqual(representationFor(p,'museum'),representationFor(p,'engineering'));});
test('world representation is materially smaller than HD asset',()=>{const sizes={'assets/atlas/studio-kona-2030/bike.glb':186540,'assets/museum/speedmax_web.glb':2081248};assert.ok(sizes[representationFor(p,'museum')]<sizes[representationFor(p,'engineering')]*0.15);});
test('close inspection remains authoritative HD asset',()=>assert.equal(representationFor(p,'engineering'),'assets/museum/speedmax_web.glb'));
