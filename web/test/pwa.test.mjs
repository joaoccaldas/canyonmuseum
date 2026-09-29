import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const tpl = fs.readFileSync(path.join(root, 'web/landing.template.html'), 'utf8');
const pwa = fs.readFileSync(path.join(root, 'web/src/pwa.mjs'), 'utf8');

test('mobile app manifest is installable and standalone', () => {
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.ok(manifest.icons.some(icon => /icon\.svg$/.test(icon.src)));
});

test('landing page wires manifest and install experience', () => {
  assert.match(tpl, /rel="manifest" href="\.\/manifest\.webmanifest"/);
  assert.match(tpl, /apple-mobile-web-app-capable/);
  assert.match(tpl, /id="installBtn"/);
  assert.match(pwa, /beforeinstallprompt/);
  assert.match(pwa, /Add to Home Screen/);
  assert.match(pwa, /serviceWorker\.register\('\.\/sw\.js'\)/);
});

test('service worker is conservative and does not pre-cache large bike GLBs', () => {
  assert.match(sw, /network-first|Navigation stays network-first/);
  assert.ok(!/\.glb['"]/u.test(sw.split('const SHELL =')[1]?.split(';')[0] || ''));
  assert.match(sw, /event\.request\.destination/);
});
