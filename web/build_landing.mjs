// Builds the Kona museum landing.
// Catalogs go to app/museum-data.js. The walkable hall goes to app/hall.js.
// index.html stays the shell: layout, phone-fit, and the script tags.
//   node web/build_landing.mjs
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { assembleMuseumData, writeMuseumData } from './museum_data.mjs';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');
const data = await assembleMuseumData();
const dataBytes = writeMuseumData(data);
const outfile = path.join(root, 'app/hall.js');
const corefile = path.join(root, 'app/kona-core.js');
await build({
  entryPoints: [path.join(here, 'src/entry.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  outfile: corefile,
  target: 'es2020',
  legalComments: 'none',
});
await build({
  entryPoints: [path.join(here, 'src/landing.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  outfile,
  target: 'es2020',
  legalComments: 'none',
});
const coreBundled = fs.readFileSync(corefile, 'utf8').replace(/<\/script/gi, '<\\/script');
fs.writeFileSync(corefile, `/* KONA shell. No Three.js. Edit web/src/entry.js */\n${coreBundled}`);
const bundled = fs.readFileSync(outfile, 'utf8').replace(/<\/script/gi, '<\\/script');
fs.writeFileSync(outfile, `/* Hall app. Edit web/src/landing.js. Catalogs: app/museum-data.js */\n${bundled}`);
const packCss = file => fs.readFileSync(path.join(here, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').trim();
const html = fs.readFileSync(path.join(here, 'landing.template.html'), 'utf8')
  .replace('__HALL_WEB_CSS__', () => packCss('styles/hall-web.css'))
  .replace('__HALL_MOBILE_CSS__', () => packCss('styles/hall-mobile.css') + '\n' + packCss('styles/entry-visual-v2.css'));
const out = process.env.OUT_HTML || path.join(root, 'index.html');
fs.writeFileSync(out, html);
const pieces = data.pieces;
console.log(`wrote ${path.relative(root, out)} · ${pieces.length} pieces (${pieces.filter(p => p.glb).length} modelled) · shell ${(html.length / 1024).toFixed(0)} kB · core ${(coreBundled.length / 1024).toFixed(0)} kB · data ${(dataBytes / 1024).toFixed(0)} kB · hall ${(bundled.length / 1024).toFixed(0)} kB`);
