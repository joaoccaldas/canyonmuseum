import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const src=fs.readFileSync(new URL('../visual-evidence-v2.mjs',import.meta.url),'utf8');
test('visual harness uses canonical runtime shell',()=>assert.match(src,/window\.__konaShell/));
test('state transition failure is blocking',()=>assert.match(src,/could not enter requested state/));
test('non-landing captures reject visible landing intro',()=>assert.match(src,/landing intro still visible after state transition/));
test('Home, deep Race Self, Plan and Me have semantic state assertions',()=>{assert.match(src,/calm Home content missing/);assert.match(src,/deep Race Self content missing/);assert.match(src,/personal 3D loaded before explicit Race Self entry/);assert.match(src,/no Plan content detected/);assert.match(src,/no Me\/Passport content detected/);});
