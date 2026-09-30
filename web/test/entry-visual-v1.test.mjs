import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const css=fs.readFileSync(new URL('../styles/entry-visual-v1.css',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../src/entry.js',import.meta.url),'utf8');
test('landing uses a real Kona hero image and strong contrast layer',()=>{assert.match(css,/kailua-bay\.jpg/);assert.match(css,/rgba\(5,15,20,.96\)/);});
test('onboarding retains same visual world rather than flat appended form',()=>{assert.match(css,/#intro\.quest-active[\s\S]*kailua-bay\.jpg/);});
test('reveal has visual hero and exactly one primary Enter action',()=>{assert.match(js,/class="reveal-hero"/);const block=js.slice(js.indexOf('class="reveal-hero"'),js.indexOf("host.querySelector('#enterKona')"));assert.equal((block.match(/btn primary/g)||[]).length,1);assert.match(block,/id="enterKona"/);});
test('reveal de-emphasizes implementation copy',()=>assert.match(js,/Already safe on this device\./));
