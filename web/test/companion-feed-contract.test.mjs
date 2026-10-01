import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const companion=fs.readFileSync(new URL('../src/ui/companion.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles/companion.css',import.meta.url),'utf8');
const registry=JSON.parse(fs.readFileSync(new URL('../../integrations/companion/sources.json',import.meta.url),'utf8'));

test('Kona Now is the existing companion route, not a duplicate feed implementation',()=>{
  assert.match(companion,/What's going on in Kona\?/);
  assert.match(companion,/renderKonaNowPreview/);
  assert.match(companion,/balancedPreview/);
  assert.match(companion,/sourceManager/);
  assert.match(companion,/liveSubscriptions/);
  assert.match(companion,/data-personal-rss/);
  assert.doesNotMatch(companion,/innerHTML=.*iframe/i);
});

test('story cards expose visual, informative summary and original-source CTA contracts',()=>{
  for(const marker of ['companion-thumbnail','companion-thumb-fallback','companion-summary','companion-story-link','Watch at source','Read full story']) assert.match(companion,new RegExp(marker));
  for(const marker of ['.companion-feed{display:grid','grid-template-columns:repeat(2','var(--brand-font-editorial)','var(--brand-font-hand)']) assert.ok(css.includes(marker),marker);
});

test('curated source registry adds athletes without breaking the bounded provider contract',()=>{
  const ids=new Set(registry.sources.map(s=>s.id));
  const urls=new Set(registry.sources.map(s=>s.feed_url));
  assert.equal(ids.size,registry.sources.length);
  assert.equal(urls.size,registry.sources.length);
  assert.ok(ids.has('kristian-blummenfelt'));
  assert.ok(ids.has('laura-philipp'));
  assert.ok(registry.sources.filter(s=>s.kind==='video').length>=8);
  assert.ok(registry.sources.length<=12,'default sources must fit the edge provider bound');
});
