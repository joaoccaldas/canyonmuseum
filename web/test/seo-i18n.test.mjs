import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const harden=fs.readFileSync(new URL('../../tools/harden_pages.mjs',import.meta.url),'utf8');
const tpl=fs.readFileSync(new URL('../landing.template.html',import.meta.url),'utf8');
test('English and pt-BR alternates are declared',()=>{assert.match(tpl,/hreflang="pt-BR"/);assert.match(tpl,/hreflang="en"/);});
test('software application structured data exists',()=>assert.match(tpl,/"@type":"SoftwareApplication"/));
test('hardening publishes pt-BR page and LLM guide',()=>{assert.match(harden,/pt-br\.html/);assert.match(harden,/llms-pt-br\.txt/);});
