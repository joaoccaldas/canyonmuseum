// Builds Studio.html: one studio for every product in museum/catalog/products.json.
// Models are fetched at runtime (never inlined), so adding a product is data, and the page stays small.
//   node tools/build_catalog.mjs && node web/build_studio.mjs
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname), root = path.resolve(here, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const inline = s => s.replaceAll('<', '\\u003c');
const res = await build({ entryPoints: [path.join(here, 'src/studio/main.js')], bundle: true, format: 'iife', minify: true, write: false, target: 'es2020', legalComments: 'none' });
const app = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const events = fs.readdirSync(path.join(root, 'museum/events')).filter(f => f.endsWith('.json')).map(f => JSON.parse(read(`museum/events/${f}`)));
const wyld = JSON.parse(read('museum/wyld_room.json'));
const html = read('web/studio.template.html')
  .replace('__PRODUCTS__', () => inline(read('museum/catalog/products.json')))
  .replace('__SKINS__', () => inline(read('museum/skins/museum.json')))
  .replace('__ROOMS__', () => inline(read('museum/world/rooms.json')))
  .replace('__FILMS__', () => inline(read('museum/themes/films.json')))
  .replace('__WYLDROOM__', () => inline(JSON.stringify({ variants: wyld.variants })))
  .replace('__EVENTS__', () => inline(JSON.stringify(events)))
  .replace('__ATLAS_METHOD__', () => inline(JSON.stringify(JSON.parse(read('museum/atlas/bikes.json')).method)))
  .replace('__APP__', () => '/* Speedmax Museum studio · three.js (MIT) bundled */\n' + app);
fs.writeFileSync(path.join(root, 'Studio.html'), html);
console.log('wrote Studio.html ·', (html.length / 1e3).toFixed(0), 'kB · app', (app.length / 1e3).toFixed(0), 'kB');
