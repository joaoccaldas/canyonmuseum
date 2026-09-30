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
  assert.match(pwa, /127\.0\.0\.1.*localhost.*\[::1\]/s);
  assert.match(pwa, /getRegistrations\(\)/);
  assert.match(pwa, /unregister\(\)/);
});

test('sealed service worker verifies release files and keeps GLBs out of the core shell', () => {
  const app = JSON.parse(fs.readFileSync(path.join(root, 'app/app-manifest.json'), 'utf8'));
  assert.ok(app.version && app.files && app.core?.length);
  assert.ok(app.core.every(p => !/\.glb$/i.test(p)));
  assert.ok(app.core.includes('app/kona-core.js') && app.core.includes('app/museum-data.js'));
  assert.ok(!app.core.includes('app/hall.js') && app.files['app/hall.js']);
  assert.ok(app.files['app/studio.js'] && app.files['app/studio-catalog.js']);
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const coreJs = fs.readFileSync(path.join(root, 'app/kona-core.js'), 'utf8');
  assert.match(index, /src="app\/kona-core\.js"/);
  assert.doesNotMatch(index, /src="app\/hall\.js"/);
  assert.match(coreJs, /app\/hall\.js/);
  assert.ok(coreJs.length < 200000, 'the entry bundle pulled in the museum runtime');
  assert.doesNotMatch(index, /window\.__PIECES=/);
  assert.ok(index.length < 250000, `index.html grew back to ${(index.length / 1024).toFixed(0)} kB`);
  assert.match(sw, /fetchVerified/);
  assert.match(sw, /integrity mismatch/);
  assert.match(sw, /speedmax-core-/);
});

test('installed apps pick up verified new versions and every public icon exists', () => {
  assert.match(pwa, /visibilitychange/);
  assert.match(sw, /skip-waiting/);
  assert.match(sw, /type: 'version'/);
  const manifest = JSON.parse(fs.readFileSync(path.join(here, '../../manifest.webmanifest'), 'utf8'));
  for (const i of manifest.icons) assert.ok(fs.existsSync(path.join(here, '../..', i.src)), i.src);
  assert.ok(manifest.icons.some(i => i.purpose === 'maskable' && /-v\d+-/.test(i.src)));
  for (const template of ['web/landing.template.html', 'web/studio.template.html', 'web/experience.template.html']) {
    const html = fs.readFileSync(path.join(root, template), 'utf8');
    for (const m of html.matchAll(/<(?:link)[^>]+href="([^"]+)"/g)) {
      const href = m[1];
      if (/^(?:https?:|data:|#)/.test(href) || !/\.(?:svg|png)$/i.test(href)) continue;
      assert.ok(fs.existsSync(path.join(root, href.replace(/^\.\//, ''))), `${template}: ${href}`);
    }
  }
});

test('Three.js runtime does not use the removed PCFSoftShadowMap constant', () => {
  const files = fs.readdirSync(path.join(root, 'web/src'), { recursive: true }).filter(f => /\.m?js$/.test(f));
  const src = files.map(f => fs.readFileSync(path.join(root, 'web/src', f), 'utf8')).join('\n');
  assert.doesNotMatch(src, /PCFSoftShadowMap/);
});
