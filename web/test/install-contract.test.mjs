import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const manifest=JSON.parse(fs.readFileSync(new URL('../../manifest.webmanifest',import.meta.url),'utf8'));
const android=JSON.parse(fs.readFileSync(new URL('../../app/android-version.json',import.meta.url),'utf8'));
test('installed PWA uses neutral current product identity',()=>{assert.equal(manifest.name,'KONA');assert.equal(manifest.short_name,'KONA');});
test('PWA starts inside current app scope',()=>{assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');assert.equal(manifest.display,'standalone');});
test('native APK is not advertised when no signed public artifact exists',()=>{assert.equal(android.published,false);assert.equal('apk' in android,false);});
