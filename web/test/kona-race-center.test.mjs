import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { KONA_CENTER_BOUNDS, KONA_CENTER_OVERVIEW, konaCenterWalkable } from '../src/kona-center.js';

const root=new URL('../../',import.meta.url);
const data=JSON.parse(fs.readFileSync(new URL('../../museum/world/kona-race-center-v1.json',import.meta.url),'utf8'));
const landing=fs.readFileSync(new URL('../src/landing.js',import.meta.url),'utf8');
const mobile=fs.readFileSync(new URL('../styles/hall-mobile.css',import.meta.url),'utf8');

test('race-center data distinguishes confirmed 2026 facts from provisional detailed layout',()=>{
  assert.equal(data.event.id,'kona-2026');
  assert.equal(data.event.date,'2026-10-10');
  assert.equal(data.event.venue,'Kailua Pier');
  assert.equal(data.event.confirmed_2026,true);
  assert.equal(data.geometry_basis.detailed_reference_year,2025);
  assert.match(data.geometry_basis.note,/Not surveying-grade|not surveying-grade/i);
  assert.ok(data.landmarks.some(x=>x.id==='transition'));
  assert.ok(data.landmarks.some(x=>x.id==='finish-line'));
  assert.ok(data.landmarks.some(x=>x.id==='hot-corner'));
  assert.ok(data.flows.some(x=>x.kind==='bike'));
  assert.ok(data.flows.some(x=>x.kind==='run'));
});
test('race center has stable map bounds and overview pose',()=>{
  assert.equal(KONA_CENTER_OVERVIEW.roomId,'kona-center');
  assert.ok(konaCenterWalkable(KONA_CENTER_OVERVIEW.to.x,KONA_CENTER_OVERVIEW.to.z));
  assert.ok(KONA_CENTER_BOUNDS.x1>KONA_CENTER_BOUNDS.x0);
  assert.ok(KONA_CENTER_BOUNDS.z1>KONA_CENTER_BOUNDS.z0);
});
test('detailed race center remains lazy until explicit room entry',()=>{
  assert.match(landing,/let konaCenter = null/);
  assert.match(landing,/ensureKonaCenter/);
  assert.match(landing,/id==='kona-center'\)\{ensureKonaCenter\(\)/);
  assert.doesNotMatch(landing,/const konaCenter = KONA_CENTER_DATA \? buildKonaRaceCenter/);
});
test('mobile exhibit cards isolate themselves from world chrome',()=>{
  assert.match(mobile,/body\.card-open #rail\{[^}]*opacity:\.12/);
  assert.match(mobile,/body\.card-open #konaWorld>header\{[^}]*opacity:\.10/);
  assert.match(mobile,/#card\{[\s\S]*background:var\(--brand-surface/);
  assert.match(mobile,/bottom:calc\(10px \+ env\(safe-area-inset-bottom\)\)/);
});
