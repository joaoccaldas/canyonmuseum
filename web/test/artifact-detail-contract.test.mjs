import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const s=JSON.parse(fs.readFileSync(new URL('../../schemas/artifact-detail-v1.schema.json',import.meta.url),'utf8'));
test('artifact contract supports multiple equipment categories',()=>{for(const x of ['bike','shoe','helmet','watch','component'])assert.ok(s.types.includes(x));});
test('artifact hero has one primary action and limited facts',()=>{assert.equal(s.rules.primary_actions_max,1);assert.ok(s.rules.hero_facts_max<=4);});
test('commercial actions require disclosure',()=>assert.equal(s.rules.affiliate_requires_disclosure,true));
