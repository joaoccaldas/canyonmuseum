import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';

const entry=fs.readFileSync(new URL('../src/entry.js',import.meta.url),'utf8');
const shell=fs.readFileSync(new URL('../src/ui/kona-shell.js',import.meta.url),'utf8');
const artifact=fs.readFileSync(new URL('../src/ui/artifact-model.js',import.meta.url),'utf8');
const garage=fs.readFileSync(new URL('../src/engine/garage.js',import.meta.url),'utf8');

test('golden path starts person-first and does not import Three.js in entry',()=>{
  assert.match(entry,/buildSelf|Build my Kona self/);
  assert.equal(/from ['"]three/.test(entry),false);
});

test('primary app IA remains semantic Home Discover Garage Plan Me',()=>{
  for(const key of ['nav.home','nav.discover','nav.garage','nav.plan','nav.me']) assert.match(shell,new RegExp(key.replace('.','\\.')));
});

test('canonical Artifact exposes inspect and Garage intent',()=>{
  assert.match(artifact,/artifactViewModel/);
  assert.match(artifact,/Inspect in 3D/);
  assert.match(artifact,/Add to Garage/);
});

test('Garage persists through canonical UserEquipment rather than a second database',()=>{
  assert.match(garage,/userEquipment/);
  assert.match(garage,/entity_type: 'user-equipment'/);
  assert.doesNotMatch(garage,/localStorage\.setItem\(['"]garage/i);
});
