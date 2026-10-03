import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../src/ui/kona-shell.js',import.meta.url),'utf8');

test('primary mobile nav exposes exactly the canonical five destinations',()=>{
  const labels=[...source.slice(source.indexOf('<nav class="kona-bottom-nav')).matchAll(/<span>(Home|Explore|Gear|Race|You)<\/span>/g)].map(x=>x[1]);
  assert.deepEqual(labels,['Home','Explore','Gear','Race','You']);
});

test('ambiguous legacy labels are not exposed in bottom navigation',()=>{
  const nav=source.slice(source.indexOf('<nav class="kona-bottom-nav'),source.indexOf('</nav>')+6);
  assert.equal(/<span>(Now|Discover|Garage|Plan|Me|Setup)<\/span>/.test(nav),false);
});
