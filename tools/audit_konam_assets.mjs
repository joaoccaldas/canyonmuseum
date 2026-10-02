#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'konam-quality-evidence');
fs.mkdirSync(OUT,{recursive:true});
const roots=['assets','renders'].map(x=>path.join(ROOT,x)).filter(fs.existsSync);
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(ent=>{
  const p=path.join(dir,ent.name); return ent.isDirectory()?walk(p):[p];
});
const files=roots.flatMap(walk).filter(p=>fs.statSync(p).isFile());
const rel=p=>path.relative(ROOT,p).replaceAll('\\','/');
const rows=[];
for(const p of files){
 const st=fs.statSync(p), ext=path.extname(p).toLowerCase();
 const hash=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
 rows.push({file:rel(p),bytes:st.size,ext,sha256:hash});
}
const groups=new Map();
for(const r of rows){const k=r.sha256+':'+r.bytes;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);}
const duplicates=[...groups.values()].filter(g=>g.length>1).map(g=>({
  bytes_each:g[0].bytes,count:g.length,wasted_duplicate_bytes:g[0].bytes*(g.length-1),
  files:g.map(x=>x.file).sort()
})).sort((a,b)=>b.wasted_duplicate_bytes-a.wasted_duplicate_bytes);
const byExt={};
for(const r of rows){const k=r.ext||'(none)';byExt[k]??={count:0,bytes:0};byExt[k].count++;byExt[k].bytes+=r.bytes;}
const largest=[...rows].sort((a,b)=>b.bytes-a.bytes).slice(0,80);
const glbs=rows.filter(r=>r.ext==='.glb').sort((a,b)=>b.bytes-a.bytes);
const oversizedGlbs=glbs.filter(r=>r.bytes>3500000);
const report={
 schema_version:1,generated_at:new Date().toISOString(),
 totals:{
   files:rows.length,
   bytes:rows.reduce((n,r)=>n+r.bytes,0),
   exact_duplicate_groups:duplicates.length,
   duplicate_bytes_recoverable:duplicates.reduce((n,g)=>n+g.wasted_duplicate_bytes,0),
   glb_files:glbs.length,
   glb_over_3_5mb:oversizedGlbs.length
 },
 by_extension:byExt,
 largest,
 oversized_glbs:oversizedGlbs,
 exact_duplicates:duplicates.slice(0,120),
 rules:[
   'Exact duplicate files are dedupe candidates only after verifying all public/generated paths and cache semantics.',
   'Do not delete duplicate assets during M0. Carry the report into post-migration cleanup.',
   'Bike GLBs above the existing 3.5 MB contract require explicit exception or optimization.',
   'Exact byte equality is safe evidence of duplication; similar-looking files are not treated as duplicates.'
 ]
};
fs.writeFileSync(path.join(OUT,'asset-deduplication.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.totals,null,2));
for(const g of duplicates.slice(0,15))console.log('DUP',g.wasted_duplicate_bytes,g.files.join(' | '));
if(oversizedGlbs.length){for(const x of oversizedGlbs)console.log('OVERSIZE_GLB',x.bytes,x.file);}
