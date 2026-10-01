import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const shell=fs.readFileSync(new URL('../src/ui/kona-shell.js',import.meta.url),'utf8');
const home=fs.readFileSync(new URL('../src/ui/home.js',import.meta.url),'utf8');
const raceSelf=fs.readFileSync(new URL('../src/ui/avatar-home.js',import.meta.url),'utf8');

test('Home is the shell surface and Race Self is entered explicitly',()=>{
  assert.match(shell,/function now\(\)[\s\S]*renderHomeSurface/);
  assert.match(shell,/async function raceSelf\(\)[\s\S]*renderAvatarHome/);
  assert.match(home,/data-home-self/);
  assert.doesNotMatch(home,/race-self-stage\.js|\.glb|THREE/);
});
test('Race Self exposes contextual personal controls, not a second app map',()=>{
  for(const duplicate of ['3D World','Collection','Games','Garage','Discover','Plan']) assert.doesNotMatch(raceSelf,new RegExp(duplicate));
  for(const control of ['Avatar','Bike','Races','Settings']) assert.match(raceSelf,new RegExp(control));
  assert.doesNotMatch(raceSelf,/hub-launcher/);
  assert.match(raceSelf,/race-self-controls/);
});
test('five-tab app shell remains the only top-level map',()=>{
  for(const tab of ['home','discover','garage','plan','me']) assert.match(shell,new RegExp('data-tab="'+tab+'"'));
  assert.equal((shell.match(/data-tab=\"/g)||[]).length,5);
});
