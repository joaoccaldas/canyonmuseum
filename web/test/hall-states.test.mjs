import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {HALL_STATES,setHallState} from '../src/ui/hall-state.js';
const js=fs.readFileSync(new URL('../src/landing.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles/hall-states.css',import.meta.url),'utf8');
function body(){const s=new Set();return{dataset:{},classList:{add:x=>s.add(x),remove:x=>s.delete(x),contains:x=>s.has(x)},classes:s};}
test('hall state controller supports WALK INSPECT NAVIGATE READ',()=>assert.deepEqual(HALL_STATES,['walk','inspect','navigate','read']));
test('controller removes prior state and records current state',()=>{const b=body();setHallState('walk',{body:b});setHallState('inspect',{body:b});assert.equal(b.classList.contains('hall-walk'),false);assert.equal(b.classList.contains('hall-inspect'),true);assert.equal(b.dataset.hallState,'inspect');});
test('invalid state fails closed to walk',()=>{const b=body();assert.equal(setHallState('party',{body:b}),'walk');assert.equal(b.classList.contains('hall-walk'),true);});
test('opening exhibit enters inspect and closing returns to walk',()=>{assert.match(js,/setHallState\('inspect'\)/);assert.match(js,/function closeCard[\s\S]{0,140}setHallState\('walk'\)/);});
test('walk suppresses rail/tour while touch keeps locomotion',()=>{assert.match(css,/body\.hall-walk #rail/);assert.match(css,/body\.hall-walk #tourPill/);assert.match(css,/@media \(pointer:coarse\)[\s\S]*#joy/);});
