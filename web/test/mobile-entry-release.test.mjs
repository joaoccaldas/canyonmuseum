import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const entry=fs.readFileSync(new URL('../src/entry.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../landing.template.html',import.meta.url),'utf8');
const ver=JSON.parse(fs.readFileSync(new URL('../../app/android-version.json',import.meta.url),'utf8'));
test('build starts explicit onboarding state',()=>assert.match(entry,/classList\.add\('quest-active'\)/));
test('reveal has a dominant Enter KONA action',()=>assert.match(entry,/id="enterKona">Enter KONA/));
test('registration is optional after local identity exists',()=>assert.match(entry,/already saved privately on this device/));
test('install is discoverable on first screen',()=>assert.match(html,/id="entryInstall"/));
test('removed APK is not advertised',()=>{assert.equal(ver.published,false);assert.equal('apk' in ver,false);});
