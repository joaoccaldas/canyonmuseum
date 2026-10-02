#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'konam-quality-evidence');
fs.mkdirSync(OUT,{recursive:true});
const walk=dir=>fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}).flatMap(ent=>{
  const p=path.join(dir,ent.name); return ent.isDirectory()?walk(p):[p];
}):[];
const files=[...walk(path.join(ROOT,'web/src')),...walk(path.join(ROOT,'tools')),...walk(path.join(ROOT,'integrations'))]
  .filter(p=>/\.(?:js|mjs)$/.test(p)).sort();
const rel=p=>path.relative(ROOT,p).replaceAll('\\','/');

const rows=files.map(p=>{
  const t=fs.readFileSync(p,'utf8');
  return {
    file:rel(p),bytes:Buffer.byteLength(t),lines:t.split(/\r?\n/).length,
    imports:(t.match(/^import\s/gm)||[]).length,exports:(t.match(/\bexport\b/g)||[]).length,
    innerHTML:(t.match(/innerHTML/g)||[]).length,
    insertAdjacentHTML:(t.match(/insertAdjacentHTML/g)||[]).length,
    localStorage:(t.match(/\blocalStorage\b/g)||[]).length,
    speedmax_keys:(t.match(/['"`]speedmax\.[A-Za-z0-9_.:-]+['"`]/g)||[]).length,
    hardcoded_canyon_origin:(t.match(/https:\/\/joaoccaldas\.github\.io\/canyonmuseum\//g)||[]).length,
    fetch:(t.match(/\bfetch\s*\(/g)||[]).length,
    timers:(t.match(/\bset(?:Timeout|Interval)\s*\(/g)||[]).length,
    listeners:(t.match(/addEventListener\s*\(/g)||[]).length,
    eval:(t.match(/\beval\s*\(/g)||[]).length,
    documentWrite:(t.match(/document\.write\s*\(/g)||[]).length,
  };
});
const biggest=[...rows].sort((a,b)=>b.bytes-a.bytes);
const directStorage=rows.filter(r=>r.localStorage).sort((a,b)=>b.localStorage-a.localStorage);
const legacy=rows.filter(r=>r.speedmax_keys).sort((a,b)=>b.speedmax_keys-a.speedmax_keys);
const origins=rows.filter(r=>r.hardcoded_canyon_origin).sort((a,b)=>b.hardcoded_canyon_origin-a.hardcoded_canyon_origin);
const htmlBuilders=rows.filter(r=>r.innerHTML||r.insertAdjacentHTML).sort((a,b)=>(b.innerHTML+b.insertAdjacentHTML)-(a.innerHTML+a.insertAdjacentHTML));

const thresholds={large:30000,very_large:60000};
const report={
  schema_version:1,
  generated_at:new Date().toISOString(),
  totals:{
    scanned_files:rows.length,
    bytes:rows.reduce((n,r)=>n+r.bytes,0),
    files_over_30kb:rows.filter(r=>r.bytes>=thresholds.large).length,
    files_over_60kb:rows.filter(r=>r.bytes>=thresholds.very_large).length,
    direct_localStorage_files:directStorage.length,
    direct_legacy_key_files:legacy.length,
    hardcoded_canyon_origin_files:origins.length,
    eval_occurrences:rows.reduce((n,r)=>n+r.eval,0),
    document_write_occurrences:rows.reduce((n,r)=>n+r.documentWrite,0),
  },
  biggest_modules:biggest.slice(0,40),
  direct_storage:directStorage,
  direct_legacy_keys:legacy,
  hardcoded_origin:origins,
  html_builders:htmlBuilders.slice(0,50),
  interpretation:{
    size:'Large files are decomposition candidates, not automatic defects. Migration M0 should preserve them; later refactors must follow stable seams.',
    storage:'Direct localStorage is a migration hazard when a canonical storage adapter exists. Grandfather only deliberate compatibility surfaces.',
    html:'innerHTML is acceptable only with static markup or escaped/validated values. Prefer one shared escape/safe DOM contract.',
    origin:'Hard-coded deployment origin must become one source-owned site metadata value during M1; generated output should never be hand-renamed.',
  }
};
fs.writeFileSync(path.join(OUT,'code-architecture.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.totals,null,2));
console.log('largest:',biggest.slice(0,12).map(r=>r.file+':'+r.bytes).join(', '));
