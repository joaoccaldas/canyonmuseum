import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const shell=fs.readFileSync(new URL('../src/ui/kona-shell.js',import.meta.url),'utf8');
const home=fs.readFileSync(new URL('../src/ui/home.js',import.meta.url),'utf8');
const discover=fs.readFileSync(new URL('../src/ui/discover.js',import.meta.url),'utf8');
const plan=fs.readFileSync(new URL('../src/ui/plan.js',import.meta.url),'utf8');
const visual=fs.readFileSync(new URL('../visual-evidence-v2.mjs',import.meta.url),'utf8');

test('shell orchestrates extracted Home, Discover and Plan surfaces',()=>{
  assert.match(shell,/renderHomeSurface/);
  assert.match(shell,/renderDiscoverSurface/);
  assert.match(shell,/renderPlanSurface/);
  assert.doesNotMatch(shell,/Every room, one museum/);
});

test('Discover is lightweight before optional 3D',()=>{
  assert.match(discover,/public-catalog\.json/);
  assert.doesNotMatch(discover,/__ROOMS|__BRANDROOMS|__gallery|museum-data\.js|hall\.js/);
  assert.match(discover,/Enter the world/);
});

test('Home has one primary next action and no direct 3D dependency',()=>{
  assert.match(home,/Make tomorrow easier/);
  assert.doesNotMatch(home,/hall\.js|museum-data\.js|__museum/);
});

test('Plan is lightweight and independent of museum globals',()=>{
  assert.match(plan,/race_week/);
  assert.doesNotMatch(plan,/__EVENT|__ISLAND|museum-data\.js|hall\.js|Three/);
  assert.doesNotMatch(shell,/__EVENT|__ISLAND/);
});

test('visual evidence captures first pages across Random mode',()=>{
  assert.match(visual,/\['light','dark','random'\]/);
  for(const view of ['landing','onboarding','reveal','home','discover','garage','plan','me']) assert.match(visual,new RegExp(view));
});
