import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const css=fs.readFileSync(new URL('../styles/system.css',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../landing.template.html',import.meta.url),'utf8');
test('landing is image-led rather than flat cream',()=>{assert.match(css,/#intro\.kona-entry:not\(\.quest-active\)[\s\S]*url\('assets\/kona-years\/kailua-bay\.jpg'\)/);});
test('mobile hero has an authored crop and full-width primary CTA',()=>{assert.match(css,/@media\(max-width:760px\)[\s\S]*background-position:62% center/);assert.match(css,/\.btn\.primary\{width:100%;min-height:54px/);});
test('onboarding has a dedicated visual state',()=>assert.match(css,/#intro\.kona-entry\.quest-active/));
test('landing exposes only one primary CTA',()=>{const intro=html.slice(html.indexOf('<section id="intro"'),html.indexOf('</section>'));assert.equal((intro.match(/btn primary/g)||[]).length,1);});
