import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const shell=fs.readFileSync(new URL('../src/ui/kona-shell.js',import.meta.url),'utf8');
const home=fs.readFileSync(new URL('../src/ui/home.js',import.meta.url),'utf8');
const system=fs.readFileSync(new URL('../styles/system.css',import.meta.url),'utf8');
const studio=fs.readFileSync(new URL('../styles/race-self.css',import.meta.url),'utf8');

test('mobile bottom navigation uses task labels while preserving canonical routes',()=>{
  for(const pair of [['home','Home'],['discover','Explore'],['garage','Gear'],['plan','Race'],['me','You']]){
    assert.match(shell,new RegExp('data-tab="'+pair[0]+'"[^>]*[\\s\\S]{0,220}<span>'+pair[1]+'<\\/span>'));
  }
  assert.equal((shell.match(/data-tab="/g)||[]).length,5);
});

test('Home exposes one explicit four-step journey map',()=>{
  assert.match(home,/class="home-flow"/);
  for(const label of ['Explore','Gear','Race','You'])assert.match(home,new RegExp('<b>'+label+'<\\/b>'));
  assert.match(home,/querySelectorAll\('\[data-home-discover\]'\)/);
  assert.match(home,/querySelectorAll\('\[data-home-garage\]'\)/);
  assert.match(home,/querySelectorAll\('\[data-home-plan\]'\)/);
  assert.match(home,/querySelectorAll\('\[data-home-self\]'\)/);
});

test('mobile app removes duplicate Studio chrome and gives active nav a real visual state',()=>{
  assert.match(system,/body\.kona-panel-open \.kona-user-menu\{display:none\}/);
  assert.match(system,/\.kona-bottom-nav \.on\{[^}]*background:/);
  assert.match(system,/\.kona-bottom-nav button,.kona-bottom-nav a\{[^}]*border-radius:14px/);
});

test('User Studio keeps the global mobile nav and uses vertical grids instead of hidden horizontal destinations',()=>{
  assert.match(studio,/@media\(max-width:899px\)[\s\S]*body\.race-self-open \.kona-bottom-nav\{display:grid\}/);
  assert.match(studio,/\.race-self-controls\{grid-row:3;grid-template-columns:repeat\(2/);
  assert.match(studio,/\.studio-destinations\{[\s\S]*grid-row:4;display:grid;grid-template-columns:repeat\(2/);
  assert.match(studio,/\.studio-home\{display:none\}/);
});
