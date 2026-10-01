import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../src/entry.js',import.meta.url),'utf8');

test('returning Home reads canonical RaceIdentity through storage adapter',()=>{
  assert.match(source,/readStorage\('raceIdentity'\)/);
  assert.match(source,/Continue your Kona/);
});

test('first visit enters avatar setup and then Home without the old questionnaire gate',()=>{
  assert.match(source,/paintQuest\('avatar'\)/);
  assert.match(source,/onContinue:\(\)=>enterApp\('home'\)/);
  assert.doesNotMatch(source,/paintQuest\('intent'\)/);
});

test('returning identity remains private by default in copy',()=>{
  assert.match(source,/stays private on this device/);
});
