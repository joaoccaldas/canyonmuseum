import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const system=fs.readFileSync(new URL('../styles/system.css',import.meta.url),'utf8');
const shell=fs.readFileSync(new URL('../styles/shell-mobile.css',import.meta.url),'utf8');
const hall=fs.readFileSync(new URL('../styles/hall-web.css',import.meta.url),'utf8');
const hallMobile=fs.readFileSync(new URL('../styles/hall-mobile.css',import.meta.url),'utf8');
const entry=fs.readFileSync(new URL('../styles/entry-visual-v2.css',import.meta.url),'utf8');

test('Race Self hub has one stylesheet owner',()=>{
  assert.match(shell,/\.player-hub/);assert.match(shell,/\.hub-launcher/);
  assert.doesNotMatch(system,/\.player-hub|\.hub-launcher/);
  assert.doesNotMatch(hall,/\.player-hub|\.hub-launcher/);
  assert.doesNotMatch(hallMobile,/\.player-hub|\.hub-launcher/);
  assert.doesNotMatch(entry,/\.player-hub|\.hub-launcher/);
});
test('install and update UI belong to consumer system CSS, not world CSS',()=>{
  assert.match(system,/#appSheet/);assert.match(system,/#updateBar/);
  assert.doesNotMatch(hall,/#appSheet|#updateBar/);
  assert.doesNotMatch(hallMobile,/#appSheet|#updateBar/);
});
test('world interaction chrome remains world-owned',()=>{
  for(const selector of ['#joy','#rail','#tourPill']) assert.match(hall+hallMobile,new RegExp(selector.replace('#','\\#')));
  assert.doesNotMatch(shell,/#joy\{|#tourPill\{/);
});
