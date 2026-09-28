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

// Part sheets for the exploded view. Modern bikes: PARTS from web/src/data.js (with the
// profile's overrides). Heritage bikes: the archived specification rows, matched per part.
async function modernParts(profileFile) {
  const src = fs.readFileSync(path.join(here, 'src/data.js'), 'utf8');
  const profile = JSON.parse(fs.readFileSync(path.join(root, profileFile), 'utf8'));
  globalThis.__BIKE_PROFILE = profile;
  const mod = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64') + '#' + profileFile);
  delete globalThis.__BIKE_PROFILE;
  const out = {};
  for (const [id, v] of Object.entries(mod.PARTS)) if (!v.alias && v.name) out[id] = { name: v.name, group: v.group, spec: v.spec, weight: v.weight, note: v.note };
  return out;
}
const HERITAGE_SPEC = {                                            // part id -> archived spec row(s)
  frame: ['Frame'], fork: ['Fork'], crankset: ['Crankset', 'Cranks'], chainrings: ['Crankset'], crank_arm_ds: ['Crankset'], crank_arm_nds: ['Crankset'],
  cassette: ['Cassette'], chain: ['Chain', 'Drivetrain'], rear_derailleur: ['Rear derailleur', 'Drivetrain'], front_derailleur: ['Front derailleur', 'Drivetrain'],
  brake_front: ['Brakes'], brake_rear: ['Brakes'], brake_levers: ['Brake levers', 'Shifters'], wheel_front: ['Wheels', 'Front wheel'], wheel_rear: ['Wheels', 'Rear wheel'],
  saddle: ['Saddle'], seatpost: ['Seatpost'], stem: ['Stem', 'Cockpit'], base_bar: ['Handlebar', 'Base bar', 'Cockpit'], extensions: ['Aerobar', 'Extensions', 'Cockpit'],
  cables: ['Drivetrain'], spindle: ['Bottom bracket', 'Crankset'],
};
const HERITAGE_GROUP = { frame: 'frame', fork: 'frame', wheel_front: 'wheels', wheel_rear: 'wheels', saddle: 'contact', seatpost: 'contact', stem: 'cockpit', base_bar: 'cockpit', extensions: 'cockpit', brake_levers: 'cockpit', brake_front: 'brakes', brake_rear: 'brakes', cables: 'cockpit' };
function heritageParts(key) {
  const f = path.join(root, `museum/viewer-${key}.json`);
  const b = JSON.parse(fs.readFileSync(f, 'utf8')).bike, labels = JSON.parse(fs.readFileSync(f, 'utf8')).partLabels || {};
  const rows = Object.fromEntries((b.spec || []).map(([k, v]) => [k.toLowerCase(), [k, v]]));
  const out = {};
  for (const [id, keys] of Object.entries(HERITAGE_SPEC)) {
    const hit = keys.map(k => rows[k.toLowerCase()]).find(Boolean);
    const nice = { wheel_front: 'Front wheel', wheel_rear: 'Rear wheel', brake_front: 'Front brake', brake_rear: 'Rear brake', crank_arm_ds: 'Drive-side crank', crank_arm_nds: 'Non-drive crank', rear_derailleur: 'Rear derailleur', front_derailleur: 'Front derailleur', spindle: 'Bottom-bracket spindle' };
    const name = labels[id] || nice[id] || id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    out[id] = { name, group: HERITAGE_GROUP[id] || 'drivetrain', spec: hit ? hit[1] : null, specLabel: hit ? hit[0] : null,
      note: id === 'frame' ? b.story : hit ? null : 'Simplified external form rebuilt from the archived specification.' };
  }
  return out;
}
const manifests = Object.fromEntries(fs.readdirSync(path.join(root, 'museum/bikes')).filter(f => f.startsWith('canyon-')).map(f => {
  const m = JSON.parse(fs.readFileSync(path.join(root, 'museum/bikes', f), 'utf8')); return [m.pipeline?.out_dir?.split('/').pop(), m];
}));
function archivePhoto(key) {
  const m = manifests[key]; const r = m?.references?.find(x => /\.jpe?g$/.test(x.path));
  if (!r) return null;
  const ts = r.url.match(/\/web\/(\d{8})/)?.[1];
  return { src: r.url.replace(/\/web\/(\d+)\//, '/web/$1im_/'), credit: `Canyon studio photograph · archived ${ts ? ts.slice(0, 4) : ''} · Wayback Machine`, href: r.url };
}
function productPhoto(file, pageUrl) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const src = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  return src ? { src, credit: 'Canyon.com product photograph', href: pageUrl } : null;
}

// The hall walks the timeline: every documented generation, modelled or not.
const pieces = catalog.heritage.map(h => {
  const b = h.key ? studio(h.key) : {};
  return {
    key: h.key || null, years: h.years, name: h.name, material: h.material, note: h.note,
    why: h.why || null, source: h.source || null, viewer: h.viewer || null,
    glb: h.key ? GLB[h.key] : null, finish: h.key ? FINISH[h.key] : null,
    thumb: h.key ? `assets/reference/paintings/${h.key}.jpg` : null,
    stats: h.key ? [[`${b.weight} kg`, `size ${b.size}`], [b.gear, b.gearSub], [b.rims, /^[\d/ ]+$/.test(b.rims || '') ? 'mm rims' : 'wheels']] : null,
    parts: h.key ? heritageParts(h.key) : null, photo: h.key ? archivePhoto(h.key) : null,
    uncertain: h.key ? (manifests[h.key]?.uncertainties || []).slice(0, 4) : null,
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

    parts: await modernParts(e.viewerProfile),
    photo: productPhoto(`assets/reference/${key}/product-${key === 'cfr' ? 4524 : 4520}-se.html`, spec.source || 'https://www.canyon.com/'),
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
