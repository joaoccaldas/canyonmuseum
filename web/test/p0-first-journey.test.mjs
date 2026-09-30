import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const entry=fs.readFileSync(new URL('../src/entry.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../landing.template.html',import.meta.url),'utf8');
const harden=fs.readFileSync(new URL('../../tools/harden_pages.mjs',import.meta.url),'utf8');

test('landing exposes build and sign-in without requiring 3D',()=>{assert.match(html,/id="buildSelf"/);assert.match(html,/id="entrySignIn"/);});
test('onboarding is a dedicated visual state',()=>assert.match(entry,/setEntryMode\('quest'\)/));
test('reveal has exactly one primary continuation into Garage',()=>{assert.match(entry,/id="enterKona">Open your Garage/);assert.match(entry,/enterKona[\s\S]{0,220}enterApp\('garage'\)/);});
test('save/sign-in remains optional after reveal',()=>assert.match(entry,/Save across devices/));
test('CSP allows the exact public Supabase project used by auth adapter',()=>assert.match(harden,/connect-src[^\n]*https:\/\/mtvpnoqwjpoqaiocrklq\.supabase\.co/));
test('entry source itself never imports Three.js',()=>{assert.equal(/from ['"]three/.test(entry),false);assert.equal(/app\/hall\.js/.test(entry),true);});

test('generated core bundle carries the P0 continuation contract',()=>{const bundle=fs.readFileSync(new URL('../../app/kona-core.js',import.meta.url),'utf8');assert.match(bundle,/Open your Garage/);});

test('entry uses tiny entry-data and defers museum-data until explicit 3D entry',()=>{
  assert.match(entry,/fetch\('app\/entry-data\.json'/);
  assert.match(entry,/ensureMuseumData/);
  assert.equal(/const dataReady = loadScript\('app\/museum-data\.js'\)/.test(entry),false);
});
