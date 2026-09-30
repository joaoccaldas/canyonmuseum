import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const entry=fs.readFileSync(new URL('../src/entry.js',import.meta.url),'utf8');
const build=fs.readFileSync(new URL('../../tools/build_app.mjs',import.meta.url),'utf8');
test('museum data is lazy rather than loaded during module evaluation',()=>{assert.doesNotMatch(entry,/const dataReady = loadScript\('app\/museum-data\.js'\)/);assert.match(entry,/ensureMuseumData/);});
test('opening 3D requests museum data before hall runtime',()=>assert.match(entry,/ensureMuseumData\(\)[\s\S]{0,120}loadScript\('app\/hall\.js'\)/));
test('PWA core does not precache museum data',()=>{const core=build.match(/const core = \[([^\]]+)\]/s)?.[1]||'';assert.equal(core.includes('museum-data.js'),false);});
test('entry still has a data-driven event config',()=>assert.match(entry,/ENTRY_EVENT/));
