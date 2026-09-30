import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import { LOCALES, t } from '../src/i18n.js';

const entry=fs.readFileSync(new URL('../src/entry.js',import.meta.url),'utf8');
const shell=fs.readFileSync(new URL('../src/ui/kona-shell.js',import.meta.url),'utf8');
const artifact=fs.readFileSync(new URL('../src/ui/artifact-model.js',import.meta.url),'utf8');

test('golden path starts person-first and does not import Three.js in entry',()=>{
  assert.match(entry,/buildSelf|Build my Kona self/);
  assert.equal(/from ['"]three/.test(entry),false);
});

test('primary app IA is Home Discover Garage Plan Me through locale keys',()=>{
  for(const key of ['nav.home','nav.discover','nav.garage','nav.plan','nav.me']) assert.match(shell,new RegExp("t\\('"+key+"'"));
  assert.deepEqual(LOCALES,['en','pt-BR']);
  for(const locale of LOCALES) for(const key of ['nav.home','nav.discover','nav.garage','nav.plan','nav.me']) assert.notEqual(t(key,locale),key, locale+' missing '+key);
});

test('canonical Artifact is available to the journey',()=>{
  assert.match(artifact,/artifactViewModel/);
  assert.match(artifact,/Inspect in 3D/);
});

test('Garage remains explicitly incomplete until real UserEquipment UI lands',()=>{
  // Prevent us from claiming the journey is done because the nav label exists.
  const doc=fs.readFileSync(new URL('../../docs/PROVEN_JOURNEYS.md',import.meta.url),'utf8');
  assert.match(doc,/Artifact → Add to Garage → reload \| FAIL/);
});
