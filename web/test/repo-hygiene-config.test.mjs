import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const source=fs.readFileSync(new URL('../../tools/repo-hygiene.mjs',import.meta.url),'utf8');
test('hygiene root resolves to repository, not parent',()=>assert.match(source,/new URL\('\.\.', import\.meta\.url\)/));
test('generated app bundles are not source authorities',()=>assert.match(source,/SOURCE_DIRS = \['web\/src','tools','integrations'\]/));
test('guard fails closed when discovery is implausibly small',()=>assert.match(source,/textFiles\.length < 20/));
test('legacy debt is an exact burn-down list',()=>{assert.match(source,/LEGACY_STORAGE_DEBT/);assert.match(source,/NEW direct legacy/);});
