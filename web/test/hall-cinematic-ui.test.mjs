import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const webCss = await readFile(resolve(here, '../styles/hall-web.css'), 'utf8');
const mobileCss = await readFile(resolve(here, '../styles/hall-mobile.css'), 'utf8');

test('cinematic hall interaction states are present', () => {
  assert.ok(webCss.includes('body.walking:not(.card-open):not(.touring) header'));
  assert.ok(webCss.includes('body.card-open #rail'));
  assert.ok(webCss.includes('body.touring #rail'));
  assert.ok(webCss.includes('body.flowing:not(.card-open):not(.touring) header'));
});

test('inspection keeps the hall while suppressing navigation chrome', () => {
  assert.ok(webCss.includes('body.card-open #nearby'));
  assert.ok(!webCss.includes('body.card-open #hall{display:none'));
});

test('global chrome uses one parent accent', () => {
  assert.ok(!webCss.includes('linear-gradient(100deg,#ff3d8e,#5fd8d3)'));
  assert.ok(webCss.includes('#updateBar button,#updateBar a.go{background:var(--lava)'));
});

test('mobile inspection uses a focused exhibit sheet', () => {
  assert.ok(mobileCss.includes('body.card-open #card'));
  assert.ok(mobileCss.includes('max-height:min(62dvh'));
  assert.ok(mobileCss.includes('#joy{width:96px;height:96px'));
});
