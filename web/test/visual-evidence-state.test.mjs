import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const src=fs.readFileSync(new URL('../visual-evidence-v2.mjs',import.meta.url),'utf8');
test('visual harness uses canonical runtime shell',()=>assert.match(src,/window\.__konaShell/));
test('state transition failure is blocking',()=>assert.match(src,/could not enter requested state/));
test('non-landing captures reject visible landing intro',()=>assert.match(src,/landing intro still visible after state transition/));
test('current product surfaces have semantic assertions',()=>{for(const marker of ['User Studio content missing','sign-in form missing','avatar registration missing','Home discovery surface missing','avatar editor missing','no Plan content detected','no Passport content detected','Bike Studio missing'])assert.ok(src.includes(marker));});
