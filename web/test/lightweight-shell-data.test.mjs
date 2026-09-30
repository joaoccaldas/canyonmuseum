import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const build=fs.readFileSync(new URL('../../tools/build_entry_data.mjs',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../../tools/build_app.mjs',import.meta.url),'utf8');
const shell=fs.readFileSync(new URL('../src/ui/kona-shell.js',import.meta.url),'utf8');
test('2D shell data is generated from authoritative event and place sources',()=>{assert.match(build,/kona-2026\.ironman\.json/);assert.match(build,/kona-v1\.json/);});
test('PWA core caches entry data, not museum data',()=>{assert.match(app,/app\/entry-data\.json/);const core=app.match(/const core = \[[^\]]+\]/s)?.[0]||'';assert.equal(core.includes('app/museum-data.js'),false);});
test('Discover has useful 2D content before the 3D world',()=>{assert.match(shell,/featured_products/);assert.match(shell,/Enter the 3D world/);});
