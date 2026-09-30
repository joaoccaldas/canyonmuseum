import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const src=fs.readFileSync(new URL('../../tools/repo-hygiene.mjs',import.meta.url),'utf8');
test('hygiene root resolves to repository, not its parent',()=>assert.match(src,/path\.resolve\(new URL\('\.\.', import\.meta\.url\)\.pathname\)/));
test('hygiene guard fails closed if discovery unexpectedly returns too few files',()=>assert.match(src,/textFiles\.length < 20/));
