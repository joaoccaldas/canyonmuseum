import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const shell=fs.readFileSync(new URL('../src/ui/kona-shell.js',import.meta.url),'utf8');
test('Discover uses canonical live product signals rather than nonexistent museum flag',()=>{assert.equal(shell.includes('filter(p=>p.museum)'),false);assert.match(shell,/p\.room \|\| p\.asset \|\| p\.public/);});
test('Garage hydrates persisted UserEquipment through readGarage',()=>assert.match(shell,/groupGarage\(readGarage\(\), allProducts\(\)\)/));
