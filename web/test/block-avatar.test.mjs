import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { AVATAR_OPTIONS, defaultAvatarStyle, normaliseAvatarStyle } from '../src/engine/avatar.js';

const stage=fs.readFileSync(new URL('../src/ui/race-self-stage.js',import.meta.url),'utf8');
const home=fs.readFileSync(new URL('../src/ui/avatar-home.js',import.meta.url),'utf8');

test('block avatar exposes stable customization slots',()=>{
  for(const slot of ['skin','hair','top','bottoms','shoes','accessory']) assert.ok(Array.isArray(AVATAR_OPTIONS[slot])&&AVATAR_OPTIONS[slot].length>=2);
  const d=defaultAvatarStyle();assert.equal(normaliseAvatarStyle({...d,hair:'bogus'}).hair,d.hair);
});
test('Race Self stage uses block geometry, not the old capsule mannequin',()=>{
  assert.match(stage,/BoxGeometry/);
  assert.doesNotMatch(stage,/CapsuleGeometry/);
  assert.match(stage,/setAvatarStyle/);
});
test('hub owns live avatar customization UI',()=>{
  for(const slot of ['skin','hair','top','bottoms','shoes','accessory']) assert.match(home,new RegExp(slot));
  assert.match(home,/data-avatar-slot/);
  assert.match(home,/setAvatarStyle/);
});
