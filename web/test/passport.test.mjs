import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const landing = fs.readFileSync(path.join(here, '../src/landing.js'), 'utf8');
const passport = fs.readFileSync(path.join(here, '../src/passport.js'), 'utf8');
const tpl = fs.readFileSync(path.join(here, '../landing.template.html'), 'utf8');

test('Passport owns progression while museum resume uses a separate storage key', () => {
  assert.match(landing, /createPassport\(\)/);
  assert.match(landing, /speedmax\.museum-session\.v1/);
  assert.doesNotMatch(landing, /const PASSPORT_KEY = 'speedmax\.passport\.v1'/);
  assert.match(passport, /const KEY = 'speedmax\.passport\.v1'/);
});

test('legacy discovery-shaped Passport data is migrated instead of crashing', () => {
  assert.match(passport, /Array\.isArray\(s\.discoveries\)/);
  assert.match(passport, /'bike:' \+ k/);
  assert.match(passport, /s\.stamps && typeof s\.stamps === 'object'/);
});

test('Museum Passport supports discovery progress and return resume', () => {
  assert.match(landing, /function discover\(p\)/);
  assert.match(landing, /passport\.stamp\('bike:' \+ p\.key/);
  assert.match(landing, /function savePose\(\)/);
  assert.match(landing, /session\.pose/);
  assert.match(landing, /Welcome back · Museum Passport/);
  assert.match(tpl, /id="passportBtn"/);
  assert.match(tpl, /id="passportCount"/);
});
