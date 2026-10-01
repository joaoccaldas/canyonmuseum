import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const html=fs.readFileSync(new URL('../landing.template.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles/entry-visual-v2.css',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../src/entry.js',import.meta.url),'utf8');
test('landing has one dominant build action and no redundant guest CTA',()=>{assert.match(html,/id="buildSelf"/);assert.equal(/id="entryGuest"/.test(html),false);});
test('landing renders a real hero image element',()=>assert.match(html,/class="entry-media"[\s\S]*queen-k\.jpg/));
test('bottom app navigation is hidden until app entry',()=>{assert.match(css,/body\.entry-landing \.kona-bottom-nav/);assert.match(css,/body\.entry-quest \.kona-bottom-nav/);});
test('quest hides landing content instead of appending below it',()=>assert.match(css,/intro-inner> :not\(#konaQuest\).*display:none/));
test('entry mode is explicit on body for visual/runtime evidence',()=>assert.match(js,/body\.dataset\.entryMode/));
test('mobile landing keeps CTA ahead of optional product depth',()=>{
  const mobile=css.slice(css.indexOf('@media(max-width:899px){'),css.indexOf('@media(max-width:360px){'));
  assert.match(mobile,/entry-actions-wrap[^}]*order:2/);
  assert.match(mobile,/entry-product[^}]*order:3/);
  assert.match(mobile,/entry-product-nav[\s\S]{0,100}display:none/);
  assert.match(mobile,/entry-race-clock[\s\S]{0,100}display:none/);
});
test('mobile entry uses small viewport height and a single authored order rule',()=>{
  assert.match(css,/min-height:100svh/);
  assert.equal((css.match(/entry-actions-wrap\{order:2/g)||[]).length,1);
  assert.equal((css.match(/entry-product\{order:3/g)||[]).length,1);
});
