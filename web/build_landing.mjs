// Builds the Kona museum landing (index.html): a walkable gallery of every Speedmax
// generation. Bikes are streamed from assets/**/speedmax_web.glb at runtime, so the
// page stays small; exhibit order and wall text come from museum/catalog.json.
//   node web/build_landing.mjs        (from repo root or web/)
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'museum/catalog.json'), 'utf8'));
const studio = key => {
  const f = path.join(root, 'museum/studio', `viewer-${key}-studio.json`);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).bike : {};
};

// Documented finishes for the hall (same colours as tools/render_paintings.mjs).
const FINISH = {
  'speedmax-three-2005': '#14161a', 'speedmax-2007': '#8a1f1f', 'speedmax-al-2011': '#d8d8dc',
  'speedmax-cf-2011': '#101014', cfr: '#eceaf0', slx: '#cdc8dd',
};
const GLB = {
  'speedmax-three-2005': 'assets/heritage/speedmax-three-2005/speedmax_web.glb',
  'speedmax-2007': 'assets/heritage/speedmax-2007/speedmax_web.glb',
  'speedmax-al-2011': 'assets/heritage/speedmax-al-2011/speedmax_web.glb',
  'speedmax-cf-2011': 'assets/heritage/speedmax-cf-2011/speedmax_web.glb',
  cfr: 'assets/museum/speedmax_web.glb', slx: 'assets/museum-slx/speedmax_web.glb',
};

// The hall walks the timeline: every documented generation, modelled or not.
const pieces = catalog.heritage.map(h => {
  const b = h.key ? studio(h.key) : {};
  return {
    key: h.key || null, years: h.years, name: h.name, material: h.material, note: h.note,
    why: h.why || null, source: h.source || null, viewer: h.viewer || null,
    glb: h.key ? GLB[h.key] : null, finish: h.key ? FINISH[h.key] : null,
    thumb: h.key ? `assets/reference/paintings/${h.key}.jpg` : null,
    stats: h.key ? [[`${b.weight} kg`, `size ${b.size}`], [b.gear, b.gearSub], [b.rims, /^[\d/ ]+$/.test(b.rims || '') ? 'mm rims' : 'wheels']] : null,
  };
});
for (const [key, id, blurb] of [
  ['cfr', 'canyon-speedmax-cfr-axs-my2027-m', 'The sixth-generation flagship: AeroShield cockpit, AeroFuel storage and a Splitter Plate seatpost, built for Kona.'],
  ['slx', 'canyon-speedmax-slx-8-di2-my2027-m', 'The same MY2027 platform with Shimano Ultegra Di2 and 4iiii power — the Speedmax most athletes will actually race.'],
]) {
  const e = catalog.entries.find(x => x.id === id), c = e.comparison;
  const spec = JSON.parse(fs.readFileSync(path.join(root, e.viewerProfile), 'utf8')).bike.specs;
  pieces.push({
    key, years: '2027', name: spec.name, material: `CFR carbon · ${c.groupset}`.replace('CFR carbon · Shimano', 'CF SLX carbon · Shimano'),
    note: blurb, viewer: e.viewer, glb: GLB[key], finish: FINISH[key], thumb: e.thumbnail, flagship: true,
    stats: [[`${spec.weightKg} kg`, 'size M'], [c.gear, `${c.cassette} · 12 sp`], [c.wheels.split('·')[1].trim().replace(' mm', ''), 'mm rims']],
  });
}

const res = await build({ entryPoints: [path.join(here, 'src/landing.js')], bundle: true, format: 'iife', minify: true, write: false, target: 'es2020', legalComments: 'none' });
const app = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const html = fs.readFileSync(path.join(here, 'landing.template.html'), 'utf8')
  .replace('__PIECES__', () => JSON.stringify(pieces).replaceAll('<', '\\u003c'))
  .replace('__APP__', () => app);
const out = process.env.OUT_HTML || path.join(root, 'index.html');
fs.writeFileSync(out, html);
console.log(`wrote ${path.relative(root, out)} · ${pieces.length} pieces (${pieces.filter(p => p.glb).length} modelled) · ${(html.length / 1024).toFixed(0)} kB`);
