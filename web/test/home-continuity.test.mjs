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
test('Race Self does not duplicate global app navigation',()=>{
  for(const duplicate of ['Garage','Discover','Plan','Races']) {
    assert.doesNotMatch(raceSelf,new RegExp("tile\\([^\\n]+['\"]"+duplicate+"['\"]"));
  }
  for(const deep of ['Customize','Bike Studio','3D World','Collection','Games']) assert.match(raceSelf,new RegExp(deep));
});
test('five-tab app shell remains the only top-level map',()=>{
  for(const tab of ['home','discover','garage','plan','me']) assert.match(shell,new RegExp('data-tab="'+tab+'"'));
  assert.equal((shell.match(/data-tab=\"/g)||[]).length,5);
});
