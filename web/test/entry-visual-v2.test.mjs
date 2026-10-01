import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const html=fs.readFileSync(new URL('../landing.template.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles/entry-visual-v2.css',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../src/entry.js',import.meta.url),'utf8');
test('landing makes guest entry primary and sign in secondary',()=>{assert.match(html,/id="buildSelf"[\s\S]*Enter as guest/);assert.match(html,/id="entrySignIn"[\s\S]*Sign in/);});
test('landing renders a real hero image element',()=>assert.match(html,/class="entry-media"[\s\S]*queen-k\.jpg/));
test('bottom app navigation is hidden until app entry',()=>{assert.match(css,/body\.entry-landing \.kona-bottom-nav/);assert.match(css,/body\.entry-quest \.kona-bottom-nav/);});
test('quest hides landing content instead of appending below it',()=>assert.match(css,/intro-inner> :not\(#konaQuest\).*display:none/));
test('entry mode is explicit on body for visual/runtime evidence',()=>assert.match(js,/body\.dataset\.entryMode/));

test('landing explains the three core product promises before entry',()=>{assert.match(html,/Race Self/);assert.match(html,/3D Studio/);assert.match(html,/Explore Kona/);});
