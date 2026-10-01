import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const entry=fs.readFileSync(new URL('../src/entry.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../landing.template.html',import.meta.url),'utf8');

test('landing always exposes Build, Sign in and Install while Build is the local path',()=>{
  assert.match(html,/id="buildSelf"/);assert.match(html,/id="entrySignIn"/);
  assert.match(html,/id="entryInstall"/);
});
test('one helper leaves intro and supports canonical consumer routes',()=>{
  assert.match(entry,/function enterApp\(first = 'home'\)/);
  assert.match(entry,/intro\?\.setAttribute\('hidden',''\)/);
  for(const route of ['garage','collection','discover','plan','me']) assert.match(entry,new RegExp("first === '"+route+"'"));
  assert.match(entry,/shell\.now/);
});
test('returning Continue uses canonical app-entry helper',()=>assert.match(entry,/Continue your Kona[\s\S]{0,220}addEventListener\('click', enterApp\)/));
test('every onboarding screen can be escaped',()=>{
  assert.match(entry,/data-quest-skip/);assert.match(entry,/data-quest-back/);assert.match(entry,/data-quest-cancel/);
});
test('sign in is optional and exposes Continue without account',()=>{
  assert.match(entry,/Continue without account/);assert.match(entry,/continueLocal[^\n]+enterApp/);
});
test('reveal enters canonical Home through app-entry helper',()=>assert.match(entry,/enterKona[^\n]+enterApp\('home'\)/));

test('P0 entry uses canonical storage adapter, never raw localStorage',()=>{
  assert.match(entry,/readStorage/);
  assert.match(entry,/writeStorage/);
  assert.equal(/localStorage/.test(entry),false);
  assert.equal(/speedmax\.(?:entryIntent|konaSelf)/.test(entry),false);
});
