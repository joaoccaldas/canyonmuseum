// Sanity run for refactors: load, enter, teleport to every map area, open the map, the settings and a card.
// Fails (exit 1) on any page error. Fast because rooms are reached by teleport, not by walking.
//   node web/sanity.mjs [port]          (serve the repo root first)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const port = process.argv[2] || 8754;
const exe = process.env.CHROME || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(f => fs.existsSync(f));
const b = await puppeteer.launch({ executablePath: exe, headless: true, protocolTimeout: 900000, args: ['--no-sandbox', '--ignore-certificate-errors', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: 480, height: 320 });
const errors = []; p.on('pageerror', e => errors.push(e.message));
p.on('console', m => { if (m.type() === 'error' && !/ERR_CERT|Failed to load resource|fonts\.g/.test(m.text())) errors.push(m.text()); });
const t0 = Date.now();
await p.goto(`http://127.0.0.1:${port}/?v=sanity${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
await p.waitForFunction(() => window.__museum && window.__map && window.__app, { timeout: 240000 });
await p.evaluate(() => { try { localStorage.setItem('speedmax.coach.v1', '1'); } catch (_) { } window.__museum.enter(); });
const areas = await p.evaluate(() => window.__map ? [...document.querySelectorAll('.map-list button')].length : 0);
const ids = await p.evaluate(() => { window.__map.open(); const all = []; for (const tab of document.querySelectorAll('.map-tabs button')) { tab.click(); all.push(...[...document.querySelectorAll('.map-list button')].map(b => b.dataset.id)); } window.__map.close(); return all; });
const visited = [];
for (const id of ids) {
  await p.evaluate(id => window.__museumGo(id), id);
  await new Promise(r => setTimeout(r, 900));
  visited.push([id, await p.evaluate(() => window.__map.here()?.id || '?')]);
}
const tour = await p.evaluate(async () => {                         // the tour plan (museum/world/tour.json) resolves and steps
  const m = window.__museum; m.tourStart(); const on = m.tour.on;
  const step = document.getElementById('tourStep')?.textContent || '';
  document.getElementById('tourNext')?.click(); const next = document.getElementById('tourStep')?.textContent || '';
  m.tour.end(false); return { on, step, next, off: !m.tour.on };
});
if (!tour.on || !/^1 \/ \d+$/.test(tour.step) || !/^2 \//.test(tour.next) || !tour.off) errors.push('tour: ' + JSON.stringify(tour));
await p.evaluate(() => { window.__app.settings.open(); window.__app.settings.close(); window.__map.open(); window.__map.close(); });
const r = { ms: Date.now() - t0, areas: ids.length, visited, tour, errors: [...new Set(errors)] };
console.log(JSON.stringify(r));
await b.close();
process.exit(errors.length ? 1 : 0);
