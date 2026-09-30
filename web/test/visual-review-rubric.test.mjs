import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const doc=fs.readFileSync(new URL('../../docs/VISUAL_REVIEW_RUBRIC_V3.md',import.meta.url),'utf8');
test('review covers complete product surfaces',()=>{for(const x of ['Landing','Onboarding','Reveal','Home','Discover','Artifact','Garage','Plan','Me','3D WALK','3D INSPECT'])assert.match(doc,new RegExp(x));});
test('review covers design and product value, not screenshots alone',()=>{for(const x of ['visual hierarchy','accessibility','performance/loading','task completion / user value'])assert.match(doc,new RegExp(x,'i'));});
test('concept boards are not runtime evidence',()=>assert.match(doc,/Concept boards never count as runtime evidence/));
