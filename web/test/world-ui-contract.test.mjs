import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const web=fs.readFileSync(new URL('../styles/hall-web.css',import.meta.url),'utf8');
const mobile=fs.readFileSync(new URL('../styles/hall-mobile.css',import.meta.url),'utf8');

test('WALK state recedes room rail during active movement',()=>{
  assert.match(web,/body\.walking\.flowing[^\{]+#rail/);
  assert.match(web,/pointer-events:none/);
});

test('INSPECT state removes rail and nearby competition',()=>{
  assert.match(web,/body\.card-open #rail/);
  assert.match(web,/body\.card-open #nearby/);
  assert.match(mobile,/body\.card-open #joy/);
});

test('NAVIGATE state makes map the dominant overlay',()=>{
  assert.match(web,/body\.map-open header/);
  assert.match(web,/body\.map-open #rail/);
});

test('mobile inspect remains a bounded bottom sheet',()=>{
  assert.match(mobile,/body\.card-open #card/);
  assert.match(mobile,/max-height:min\(52dvh,520px\)/);
});
