import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {discoverLanes} from '../src/ui/discover-model.js';
const shell=fs.readFileSync(new URL('../src/ui/kona-shell.js',import.meta.url),'utf8');
test('Discover exposes exactly the four human concepts first',()=>assert.deepEqual(discoverLanes().map(x=>x.id),['places','machines','people','stories']));
test('every primary Discover lane is image-led',()=>{for(const x of discoverLanes())assert.match(x.image,/^assets\//);});
test('3D is a secondary explicit action, not Discover boot',()=>{assert.match(shell,/Enter 3D world/);assert.equal(/function explore\(\)[\s\S]{0,400}enter\?\.\(\)/.test(shell),false);});
test('implementation noun Rooms is not the Discover heading',()=>assert.equal(/<h3>Rooms<\/h3>/.test(shell),false));
