import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { LOCALES, t } from '../src/i18n.js';

const source=fs.readFileSync(new URL('../src/ui/kona-shell.js',import.meta.url),'utf8');
const keys=['nav.home','nav.discover','nav.garage','nav.plan','nav.me'];

test('primary mobile nav exposes exactly five canonical semantic destinations',()=>{
  for(const key of keys) assert.match(source,new RegExp("t\\('"+key+"'"));
  for(const locale of LOCALES){
    const labels=keys.map(key=>t(key,locale));
    assert.equal(labels.length,5);
    assert.equal(new Set(labels).size,5);
    assert.ok(labels.every(Boolean));
  }
});

test('legacy primary labels are not exposed in bottom navigation',()=>{
  const nav=source.slice(source.indexOf('<nav class="kona-bottom-nav'),source.indexOf('</nav>')+6);
  assert.equal(/<span>(Now|Explore|Setup)<\/span>/.test(nav),false);
});
