// Builds Guide.html: the Museum Guide web app (bikes, Kona stats, news, help).
//   node web/build_guide.mjs
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname), root = path.resolve(here, '..');
const J = f => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const catalog = J('museum/catalog.json');
const studio = key => { const f = `museum/studio/viewer-${key}-studio.json`; return fs.existsSync(path.join(root, f)) ? J(f).bike : {}; };
const viewer = key => { const f = `museum/viewer-${key}.json`; return fs.existsSync(path.join(root, f)) ? J(f).bike : {}; };
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const manifests = Object.fromEntries(fs.readdirSync(path.join(root, 'museum/bikes')).filter(f => f.startsWith('canyon-')).map(f => { const m = J(`museum/bikes/${f}`); return [m.pipeline?.out_dir?.split('/').pop(), m]; }));

const bikes = catalog.heritage.map(h => {
  const s = h.key ? studio(h.key) : {}, v = h.key ? viewer(h.key) : {};
  return { key: h.key || slug(h.name + '-' + h.years), name: h.name, years: h.years, material: h.material, note: h.note, story: v.story || null,
    viewer: h.viewer || null, source: h.source || null, thumb: h.key ? `assets/reference/paintings/${h.key}.jpg` : null,
    stats: h.key ? [[`${s.weight} kg`, `size ${s.size}`], [s.gear, s.gearSub], [s.rims, /^[\d/ ]+$/.test(s.rims || '') ? 'mm rims' : 'wheels']] : null,
    spec: v.spec || null, uncertain: h.key ? (manifests[h.key]?.uncertainties || []).slice(0, 6) : null };
});
const prices = J('museum/prices-se.json');
const PART_NAMES = { cassette: 'Cassette', chain: 'Chain', arm_pads: 'Arm pads', bottom_bracket: 'Bottom bracket', udh_hanger: 'Derailleur hanger', aeroshield_pro_upgrade: 'AeroShield cockpit' };
for (const [key, id] of [['cfr', 'canyon-speedmax-cfr-axs-my2027-m'], ['slx', 'canyon-speedmax-slx-8-di2-my2027-m']]) {
  const e = catalog.entries.find(x => x.id === id), c = e.comparison, spec = J(e.viewerProfile).bike.specs;
  bikes.push({ key, name: spec.name, years: 'MY2027', material: `${key === 'cfr' ? 'CFR' : 'CF SLX'} carbon · ${c.groupset}`, story: key === 'cfr' ? 'The sixth-generation flagship: AeroShield cockpit, AeroFuel storage and a Splitter Plate seatpost, built for Kona.' : 'The same MY2027 platform with Shimano Ultegra Di2 and 4iiii power — the Speedmax most athletes will actually race.',
    viewer: e.viewer, thumb: e.thumbnail, product: spec.source, components: spec.components,
    stats: [[`${spec.weightKg} kg`, 'size M'], [c.gear, `${c.cassette} · 12 sp`], [c.wheels.split('·')[1].trim().replace(' mm', ''), 'mm rims']],
    buy: key === 'cfr' ? Object.entries(prices.items).map(([k, p]) => ({ part: PART_NAMES[k] || k, name: p.name, url: p.url, price: p.price, currency: p.currency, match: p.match })) : null });
}
const refHtml = fs.readFileSync(path.join(root, 'assets/reference/cfr/product-4524-se.html'), 'utf8');
const locales = [...new Set([...refHtml.matchAll(/https:\/\/www\.canyon\.com\/(en-[a-z]{2})\//g)].map(m => m[1]))];
const fieldFacts = [
  { value: '2024', text: 'The first year Canyon topped the bike count at the men’s Kona championship, according to Canyon.', source: 'https://media-centre.canyon.com/en-INT/242948-patrick-lange-brings-double-victory-for-canyon-speedmax-cfr-at-2024-triathlon-world-championships/' },
  { value: '502 / 2,199', text: 'Speedmax bikes among the competitors surveyed at the 2025 men’s championship in Nice — nearly a quarter of the field, the most popular bike on the course.', source: 'https://media-centre.canyon.com/en-INT/254364-triathlon-world-championships-sam-laidlow-and-the-sensational-speedmax-set-the-benchmark-in-nice/' },
  { value: '3 of 15', text: 'Canyon Speedmax CFRs among the fifteen fastest bike splits of the 2025 women’s race in Kona — Matthews, Philipp and Konczalla.', source: 'https://slowtwitch.com/triathlon/kona-2025-the-bikes-of-the-fastest-pro-riders/' },
  { value: '1st & 10th', text: 'Speedmax finishes in the 2017 men’s Kona top ten: Patrick Lange’s win and Boris Stein in tenth.', source: 'https://www.slowtwitch.com/Products/Bike_details_of_the_Top_15_Kona_male_Pros_6639.html' },
];
const news = fs.existsSync(path.join(root, 'museum/news.json')) ? J('museum/news.json').items.slice(0, 20) : [];
const data = { bikes, kona: J('museum/kona_years.json'), locales, buyChecked: prices.checkedAt.slice(0, 10), fieldFacts, news };
const res = await build({ entryPoints: [path.join(here, 'src/guide.js')], bundle: true, format: 'iife', minify: true, write: false, target: 'es2020', legalComments: 'none' });
const html = fs.readFileSync(path.join(here, 'guide.template.html'), 'utf8')
  .replace('__GUIDE__', () => JSON.stringify(data).replaceAll('<', '\\u003c'))
  .replace('__APP__', () => res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script'));
fs.writeFileSync(path.join(root, 'Guide.html'), html);
console.log(`wrote Guide.html · ${bikes.length} bikes · ${news.length} headlines · ${(html.length / 1024).toFixed(0)} kB`);
