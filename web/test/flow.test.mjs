import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, '../src/landing.js'), 'utf8');
const tpl = fs.readFileSync(path.join(here, '../landing.template.html'), 'utf8');

test('museum uses tighter responsive framing', () => {
  assert.match(src, /if \(a < \.78\) return 62/);
  assert.match(src, /return 50;\s+\/\/ desktop/);
  assert.match(src, /PerspectiveCamera\(museumFov\(\), 1, \.06, 900\)/);
});

test('museum movement is deliberately faster and more responsive', () => {
  assert.match(src, /5\.8 : 3\.35/);
  assert.match(src, /Math\.min\(4\.8, d \* 3\.0 \+ 1\.0\)/);
  assert.match(src, /Math\.exp\(-dt \* 15\)/);
  assert.match(src, /coarse \? \.0068 : \.0044/);
});

test('flow mode lets chrome recede during movement', () => {
  assert.match(src, /classList\.toggle\('flowing', flowing\)/);
  assert.match(tpl, /body\.flowing:not\(\.card-open\) header/);
  assert.match(tpl, /body\.flowing:not\(\.card-open\) #rail/);
});
