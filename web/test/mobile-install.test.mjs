import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../landing.template.html',import.meta.url),'utf8');
const shell=fs.readFileSync(new URL('../src/app-shell.js',import.meta.url),'utf8');
const version=JSON.parse(fs.readFileSync(new URL('../../app/android-version.json',import.meta.url),'utf8'));

test('mobile entry always exposes a discoverable install affordance',()=>{
  assert.match(html,/id="entryInstall"[^>]*>Install app</);
});
test('stale APK is never advertised when native artifact is unpublished',()=>{
  assert.equal(version.published,false);
  assert.equal('apk' in version,false);
});
test('native update copy no longer advertises Speedmax Museum as the parent app',()=>{
  assert.equal(/Speedmax Museum .* is available/.test(shell),false);
  assert.match(shell,/KONA .* is available/);
});
