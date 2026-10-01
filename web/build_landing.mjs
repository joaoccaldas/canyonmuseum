// Builds the Kona museum landing.
// Catalogs go to app/museum-data.js. The walkable hall goes to app/hall.js.
// index.html stays the document + entry shell; runtime behavior and feature styles are external/lazy.
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
const raceselffile = path.join(root, 'app/race-self-stage.js');
const adminpreviewfile = path.join(root, 'app/admin-asset-preview.js');
const worldshellfile = path.join(root, 'app/world-shell.html');
const viewportfile = path.join(root, 'app/viewport.js');
await build({
  entryPoints: [path.join(here, 'src/runtime/viewport.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  outfile: viewportfile,
  target: 'es2020',
  legalComments: 'none',
});
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
  entryPoints: [path.join(here, 'src/race-self-stage-entry.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  outfile: raceselffile,
  target: 'es2020',
  legalComments: 'none',
});
await build({
  entryPoints: [path.join(here, 'src/ui/admin-asset-preview.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  outfile: adminpreviewfile,
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
const raceSelfBundled = fs.readFileSync(raceselffile, 'utf8').replace(/<\/script/gi, '<\\/script');
fs.writeFileSync(raceselffile, `/* Race Self 3D stage. Edit web/src/ui/race-self-stage.js */\n${raceSelfBundled}`);
const adminPreviewBundled = fs.readFileSync(adminpreviewfile, 'utf8').replace(/<\/script/gi, '<\\/script');
fs.writeFileSync(adminpreviewfile, `/* Admin Asset Portfolio 3D previews. Edit web/src/ui/admin-asset-preview.js */\n${adminPreviewBundled}`);
const bundled = fs.readFileSync(outfile, 'utf8').replace(/<\/script/gi, '<\\/script');
fs.writeFileSync(outfile, `/* Hall app. Edit web/src/landing.js. Catalogs: app/museum-data.js */\n${bundled}`);
const html = fs.readFileSync(path.join(here, 'landing.template.html'), 'utf8');
const worldShell = fs.readFileSync(path.join(here, 'world-shell.template.html'), 'utf8');
fs.writeFileSync(worldshellfile, worldShell);
const out = process.env.OUT_HTML || path.join(root, 'index.html');
fs.writeFileSync(out, html);
const pieces = data.pieces;
console.log(`wrote ${path.relative(root, out)} + ${path.relative(root, worldshellfile)} + ${path.relative(root, viewportfile)} · ${pieces.length} pieces (${pieces.filter(p => p.glb).length} modelled) · shell ${(html.length / 1024).toFixed(0)} kB · core ${(coreBundled.length / 1024).toFixed(0)} kB · race-self ${(raceSelfBundled.length / 1024).toFixed(0)} kB · admin-preview ${(adminPreviewBundled.length / 1024).toFixed(0)} kB · data ${(dataBytes / 1024).toFixed(0)} kB · hall ${(bundled.length / 1024).toFixed(0)} kB`);
