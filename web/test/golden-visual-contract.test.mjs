import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import { LOCALES, t } from '../src/i18n.js';
const shell=fs.readFileSync(new URL('../src/ui/kona-shell.js',import.meta.url),'utf8');
const landing=fs.readFileSync(new URL('../landing.template.html',import.meta.url),'utf8');

test('mobile IA stays at five canonical destinations in every supported locale',()=>{
  const keys=['nav.home','nav.discover','nav.garage','nav.plan','nav.me'];
  for(const key of keys) assert.match(shell,new RegExp(key.replace('.','\\.')));
  for(const locale of LOCALES) assert.equal(new Set(keys.map(k=>t(k,locale))).size,5);
});
test('landing retains one person-first build action',()=>{const n=(landing.match(/id="buildSelf"/g)||[]).length;assert.equal(n,1);});
test('landing declares responsive viewport and install manifest',()=>{assert.match(landing,/viewport-fit=cover/);assert.match(landing,/manifest\.webmanifest/);});
