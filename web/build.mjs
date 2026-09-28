import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';
const here = path.dirname(new URL(import.meta.url).pathname);
const glbPath = process.env.GLB || path.join(here, '..', 'assets', 'speedmax_web.glb');
const res = await build({ entryPoints: [path.join(here, 'src/main.js')], bundle: true, format: 'iife', minify: true, write: false, target: 'es2020', legalComments: 'none', loader: {'.png':'dataurl'} });
const app = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const glb = fs.readFileSync(glbPath).toString('base64');
const tpl = fs.readFileSync(path.join(here, 'index.template.html'), 'utf8');
const profile=JSON.parse(fs.readFileSync(process.env.BIKE_PROFILE||path.join(here,'../museum/viewer-cfr.json'),'utf8'));
let template=tpl;
if(profile.bike.key==='slx'){
  template=template
    .replaceAll('Speedmax<br>CFR AXS','Speedmax<br>CF SLX 8 Di2')
    .replaceAll('Speedmax CFR AXS','Speedmax CF SLX 8 Di2')
    .replaceAll('SPEEDMAX CFR','SPEEDMAX CF SLX')
    .replaceAll('CFR AXS','CF SLX 8 Di2')
    .replaceAll('AXS · MY2027','Di2 · MY2027')
    .replaceAll('9.1 kg','9.56 kg')
    .replaceAll('50 × 14','52 × 14')
    .replaceAll('50×14','52×14')
    .replaceAll('Canyon collection · Exhibit 01','Canyon collection · Exhibit 02')
    .replaceAll('The architecture of speed.','The second-generation racer.')
    .replaceAll("Canyon's fastest and most adjustable triathlon bike yet","Canyon's second-tier triathlon platform, Di2-equipped.")
    .replaceAll('SRAM Red AXS with dual-sided power, DT Swiss ARC 1100 85 mm wheels, AeroShield cockpit and AeroFuel storage.',
      'Shimano Ultegra Di2 with 4iiii power, DT Swiss ARC 1600 65/85 mm wheels, AeroShield cockpit and AeroFuel storage.');
}
const html = template.replace('<head>','<head><script>window.__BIKE_PROFILE='+JSON.stringify(profile).replaceAll('<','\\u003c')+';</script>').replace('__GLB__', () => glb).replace('__APP__', () => '/* Speedmax CFR study · three.js (MIT) bundled */\n' + app);
const out = process.env.OUT_HTML || path.join(here, 'dist', 'index.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log('wrote', out, (html.length / 1e6).toFixed(2), 'MB · app', (app.length / 1e3).toFixed(0), 'kB');
