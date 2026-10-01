#!/usr/bin/env node
// RC8 brand authority gate. Keep this narrow and enforceable: it prevents new parallel design systems.
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const errors=[];
const active=[
 'web/styles/system.css','web/styles/shell-mobile.css','web/styles/home.css','web/styles/garage.css',
 'web/styles/race-self.css','web/styles/entry-visual-v2.css','web/styles/studio.css',
 'web/styles/collection.css','web/styles/experience.css','web/styles/components.css','web/styles/admin-assets.css'
];
for(const rel of active){
 const css=read(rel);
 if(/--(?:sans|serif|mono)\s*:\s*['"][^'"]/.test(css))errors.push(rel+': owns a raw font family; alias brand tokens instead');
 if(/font-family\s*:\s*['"]?(?:Inter|Manrope|Instrument Serif)/i.test(css))errors.push(rel+': hard-codes a brand font');
 if(/--(?:sand|paper|ink|muted|faint|reef|lava)\s*:\s*#[0-9a-f]{3,8}/i.test(css))errors.push(rel+': owns a raw palette alias instead of brand tokens');
}
const tokens=read('brand/tokens.css'),components=read('web/styles/components.css'),shell=read('web/src/ui/kona-shell.js');
for(const token of ['--brand-sand','--brand-lava','--brand-ocean','--brand-sunrise','--brand-hibiscus','--brand-lilac','--brand-lime','--brand-font-ui','--brand-font-editorial','--brand-font-data','--brand-font-hand','--brand-mobile-gutter:20px'])if(!tokens.includes(token))errors.push('brand/tokens.css missing '+token);
for(const primitive of ['.btn-primary','.btn-secondary','.btn-text','.btn-icon','.ui-input','.ui-sheet'])if(!components.includes(primitive))errors.push('components.css missing '+primitive);
if(!/\[data-tab=home\]'\)\.onclick=now/.test(shell))errors.push('Home tab must invoke canonical Home, not Race Self');
if(!read('web/styles/studio.css').includes('--sand:var(--brand-bg)'))errors.push('Studio must consume brand tokens');
if(!read('web/styles/experience.css').includes('--accent:var(--brand-sunrise)'))errors.push('Experiences must consume brand accent');
if(!read('web/styles/collection.css').includes('font-family:var(--brand-font-ui)'))errors.push('Collection must consume brand typography');
if(errors.length){console.error('brand authority gate failed');for(const e of errors)console.error(' - '+e);process.exit(1);}
console.log('brand authority gate: PASS ('+active.length+' active styles checked)');
