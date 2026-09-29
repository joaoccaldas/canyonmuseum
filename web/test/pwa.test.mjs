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
  assert.ok(manifest.icons.some(icon => /icon-v3\.svg$/.test(icon.src)));
});

test('landing page wires manifest and install experience', () => {
  assert.match(tpl, /rel="manifest" href="\.\/manifest\.webmanifest"/);
  assert.match(tpl, /apple-mobile-web-app-capable/);
  assert.match(tpl, /id="installBtn"/);
  assert.match(pwa, /beforeinstallprompt/);
  assert.match(pwa, /Add to Home Screen/);
  assert.match(pwa, /serviceWorker\.register\('\.\/sw\.js'(, \{ updateViaCache: 'none' \})?\)/);   // updateViaCache: installed apps always fetch a fresh sw.js
  assert.match(pwa, /127\.0\.0\.1.*localhost.*\[::1\]/s);          // local dev never hides a stopped server behind cached HTML
  assert.match(pwa, /getRegistrations\(\)/);
  assert.match(pwa, /unregister\(\)/);
});

test('service worker is conservative and does not pre-cache large bike GLBs', () => {
  assert.match(sw, /network-first|Navigation stays network-first/);
  assert.ok(!/\.glb['"]/u.test(sw.split('const SHELL =')[1]?.split(';')[0] || ''));
  assert.match(sw, /event\.request\.destination/);
});

test('installed apps pick up new versions and new icons', () => {
  assert.match(pwa, /visibilitychange/);                              // re-check for a new museum when the app is reopened
  assert.match(sw, /stale-while-revalidate/);                         // assets refresh in the background
  const manifest = JSON.parse(fs.readFileSync(path.join(here, '../../manifest.webmanifest'), 'utf8'));
  for (const i of manifest.icons) assert.ok(fs.existsSync(path.join(here, '../..', i.src)), i.src);
  assert.ok(manifest.icons.some(i => i.purpose === 'maskable' && /-v\d+-/.test(i.src)));   // versioned names bust launcher caches
});


test('Three.js runtime does not use removed soft shadow map constant', () => {
  const src = fs.readdirSync(path.join(root, 'web/src'), { recursive: true })
    .filter(f => /\.m?js$/.test(f))
    .map(f => fs.readFileSync(path.join(root, 'web/src', f), 'utf8')).join('\n');
  assert.doesNotMatch(src, /PCFSoftShadowMap/);
});
