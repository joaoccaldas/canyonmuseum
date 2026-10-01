import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const shell=fs.readFileSync(new URL('../src/ui/kona-shell.js',import.meta.url),'utf8');
const home=fs.readFileSync(new URL('../src/ui/home.js',import.meta.url),'utf8');
const avatarHome=fs.readFileSync(new URL('../src/ui/avatar-home.js',import.meta.url),'utf8');
const raceCards=fs.readFileSync(new URL('../src/ui/race-cards.js',import.meta.url),'utf8');
const discover=fs.readFileSync(new URL('../src/ui/discover.js',import.meta.url),'utf8');
const catalog=fs.readFileSync(new URL('../src/engine/catalog.js',import.meta.url),'utf8');
const garage=fs.readFileSync(new URL('../src/ui/garage.js',import.meta.url),'utf8');
const plan=fs.readFileSync(new URL('../src/ui/plan.js',import.meta.url),'utf8');
const me=fs.readFileSync(new URL('../src/ui/me.js',import.meta.url),'utf8');
const entry=fs.readFileSync(new URL('../src/entry.js',import.meta.url),'utf8');
const visual=fs.readFileSync(new URL('../visual-evidence-v2.mjs',import.meta.url),'utf8');

test('shell orchestrates calm Home, deep Race Self, Discover, Plan and Me surfaces',()=>{
  assert.match(shell,/renderHomeSurface/);
  assert.match(shell,/renderAvatarHome/);
  assert.match(shell,/renderDiscoverSurface/);
  assert.match(shell,/renderPlanSurface/);
  assert.match(shell,/renderMeSurface/);
  assert.doesNotMatch(shell,/Every room, one museum/);
});

test('Discover is lightweight before optional 3D',()=>{
  assert.match(discover,/loadPublicCatalog/);
  assert.match(catalog,/integrations\/public-catalog\.json/);
  assert.doesNotMatch(discover,/__ROOMS|__BRANDROOMS|__gallery|museum-data\.js|hall\.js/);
  assert.match(discover,/Enter the world/);
});

test('Garage and Me resolve Product presentation from the shared public projection',()=>{
  assert.match(garage,/getPublicProduct/);
  assert.match(me,/getPublicProduct/);
  assert.doesNotMatch(garage,/BIKES|SHOES|questLabels/);
  assert.doesNotMatch(me,/BIKES|SHOES|questLabels/);
});

test('Home is lightweight and Race Self is explicit depth, not a second app menu',()=>{
  assert.match(home,/data-home-self/);
  assert.match(home,/YOUR RACE SELF/);
  assert.doesNotMatch(home,/race-self-stage\.js|hall\.js|museum-data\.js/);
  for(const tile of ['Customize','Bike Studio','3D World','Collection','Games']) assert.match(avatarHome,new RegExp(tile));
  for(const duplicate of ['Garage','Discover','Races']) assert.doesNotMatch(avatarHome,new RegExp("'>"+duplicate+"<"));
  assert.match(avatarHome,/hub-launcher/);
  assert.match(avatarHome,/app\/race-self-stage\.js/);
  assert.doesNotMatch(avatarHome,/app\/hall\.js|museum-data\.js|__museum/);
  assert.match(raceCards,/Search IRONMAN races/);
});

test('Plan is lightweight and independent of museum globals',()=>{
  assert.match(plan,/race_week/);
  assert.doesNotMatch(plan,/__EVENT|__ISLAND|museum-data\.js|hall\.js/);
  assert.doesNotMatch(shell,/__EVENT|__ISLAND/);
});

test('Me is RaceIdentity-first and owns no independent persistence',()=>{
  assert.match(me,/race_identity/);
  assert.match(me,/Passport/);
  assert.doesNotMatch(me,/localStorage|writeStorage/);
  assert.doesNotMatch(shell,/gameProgress|readGameState|sendMagicLink|backupGameState/);
});

test('post-onboarding entry opens canonical Home',()=>{
  assert.match(entry,/enterApp\('home'\)/);
  assert.match(entry,/Enter KONA/);
});

test('visual evidence captures first pages across Random mode',()=>{
  assert.match(visual,/\['light','dark','random'\]/);
  for(const view of ['landing','onboarding','reveal','home','race-self','discover','garage','plan','me']) assert.match(visual,new RegExp(view));
});
