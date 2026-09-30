import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const entry=fs.readFileSync(new URL('../src/entry.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../landing.template.html',import.meta.url),'utf8');

test('landing always exposes Build, Sign in and Install while Build is the local path',()=>{
  assert.match(html,/id="buildSelf"/);assert.match(html,/id="entrySignIn"/);
  assert.match(html,/id="entryInstall"/);
});
test('one helper actually leaves intro and opens Home',()=>{
  assert.match(entry,/function enterApp\(\)[\s\S]{0,180}intro\?\.setAttribute\('hidden',''\)[\s\S]{0,100}shell\.now/);
});
test('returning Continue uses canonical app-entry helper',()=>assert.match(entry,/Continue your Kona[\s\S]{0,220}addEventListener\('click', enterApp\)/));
test('every onboarding screen can be escaped',()=>{
  assert.match(entry,/data-quest-skip/);assert.match(entry,/data-quest-back/);assert.match(entry,/data-quest-cancel/);
});
test('sign in is optional and exposes Continue without account',()=>{
  assert.match(entry,/Continue without account/);assert.match(entry,/continueLocal[^\n]+enterApp/);
});
test('reveal Enter KONA uses same app-entry helper',()=>assert.match(entry,/enterKona[^\n]+enterApp/));

test('P0 entry uses canonical storage adapter, never raw localStorage',()=>{
  assert.match(entry,/readStorage/);
  assert.match(entry,/writeStorage/);
  assert.equal(/localStorage/.test(entry),false);
  assert.equal(/speedmax\.(?:entryIntent|konaSelf)/.test(entry),false);
});
