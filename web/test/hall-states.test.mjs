import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const js=fs.readFileSync(new URL('../src/landing.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles/hall-states.css',import.meta.url),'utf8');
test('hall defines explicit interaction states',()=>{for(const x of ['walk','inspect','navigate','read'])assert.match(js,new RegExp('hall-'+x));});
test('opening exhibit enters inspect and closing returns to walk',()=>{assert.match(js,/hallState\('inspect'\)/);assert.match(js,/function closeCard[\s\S]{0,120}hallState\('walk'\)/);});
test('walk mode suppresses persistent rail and tour chrome',()=>{assert.match(css,/body\.hall-walk #rail/);assert.match(css,/body\.hall-walk #tourPill/);});
test('touch walk keeps movement affordance',()=>assert.match(css,/@media \(pointer:coarse\)[\s\S]*#joy/));
