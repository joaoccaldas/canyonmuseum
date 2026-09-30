import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const entry=fs.readFileSync(new URL('../src/entry.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../landing.template.html',import.meta.url),'utf8');

test('landing always exposes Build, Sign in and Install while Build is the local path',()=>{
  assert.match(html,/id="buildSelf"/);assert.match(html,/id="entrySignIn"/);
  assert.match(html,/id="entryInstall"/);
});
test('one helper leaves intro and supports Home or Garage entry',()=>{
  assert.match(entry,/function enterApp\(first = 'home'\)[\s\S]{0,220}intro\?\.setAttribute\('hidden',''\)[\s\S]{0,180}first === 'garage'[\s\S]{0,80}shell\.garage[\s\S]{0,80}shell\.now/);
});
test('returning Continue uses canonical app-entry helper',()=>assert.match(entry,/Continue your Kona[\s\S]{0,220}addEventListener\('click', enterApp\)/));
test('every onboarding screen can be escaped',()=>{
  assert.match(entry,/data-quest-skip/);assert.match(entry,/data-quest-back/);assert.match(entry,/data-quest-cancel/);
});
test('sign in is optional and exposes Continue without account',()=>{
  assert.match(entry,/Continue without account/);assert.match(entry,/continueLocal[^\n]+enterApp/);
});
test('reveal enters Garage through canonical app-entry helper',()=>assert.match(entry,/enterKona[^\n]+enterApp\('garage'\)/));

test('P0 entry uses canonical storage adapter, never raw localStorage',()=>{
  assert.match(entry,/readStorage/);
  assert.match(entry,/writeStorage/);
  assert.equal(/localStorage/.test(entry),false);
  assert.equal(/speedmax\.(?:entryIntent|konaSelf)/.test(entry),false);
});
