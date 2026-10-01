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
test('User Studio is personal depth with world shortcuts and personal controls',()=>{
  for(const destination of ['Canyon Museum','Discover Kona','Race week','Passport']) assert.match(raceSelf,new RegExp(destination));
  for(const control of ['Avatar','Bike','Races','Settings']) assert.match(raceSelf,new RegExp(control));
  assert.doesNotMatch(raceSelf,/hub-launcher/);
  assert.match(raceSelf,/race-self-controls/);
});
test('five-tab app shell remains the only top-level map and Home means Home',()=>{
  assert.match(shell,/\[data-tab=home\]'\)\.onclick=now/);
  for(const tab of ['home','discover','garage','plan','me']) assert.match(shell,new RegExp('data-tab="'+tab+'"'));
  assert.equal((shell.match(/data-tab=\"/g)||[]).length,5);
});
