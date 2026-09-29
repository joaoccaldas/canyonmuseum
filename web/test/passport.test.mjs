import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, '../src/landing.js'), 'utf8');
const tpl = fs.readFileSync(path.join(here, '../landing.template.html'), 'utf8');

test('Museum Passport is local-first and contains no identity fields', () => {
  assert.match(src, /speedmax\.passport\.v1/);
  assert.match(src, /localStorage\.setItem\(PASSPORT_KEY/);
  for (const forbidden of ['email', 'phone', 'address', 'birthdate']) {
    assert.ok(!new RegExp(`passport\\.${forbidden}\\b`).test(src), forbidden);
  }
});

test('Museum Passport supports discovery progress and return resume', () => {
  assert.match(src, /function discover\(p\)/);
  assert.match(src, /passport\.discoveries\.push/);
  assert.match(src, /function savePose\(\)/);
  assert.match(src, /Welcome back · Museum Passport/);
  assert.match(tpl, /id="passportBtn"/);
  assert.match(tpl, /id="passportCount"/);
});
