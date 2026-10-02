#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'konam-quality-evidence');
fs.mkdirSync(OUT,{recursive:true});
const limits={
 'app/kona-core.js':280000,
 'app/race-self-stage.js':820000,
 'app/collectible-stage.js':800000,
 'app/admin-asset-preview.js':780000,
 'app/museum-data.js':220000,
 'app/hall.js':1150000,
 'app/studio.js':980000,
};
const rows=[];
let failed=false;
for(const [file,max_bytes] of Object.entries(limits)){
 const p=path.join(ROOT,file);
 if(!fs.existsSync(p)){rows.push({file,missing:true,max_bytes});failed=true;continue;}
 const bytes=fs.statSync(p).size;
 const ratio=bytes/max_bytes;
 const state=ratio>1?'over':ratio>.9?'near':'ok';
 if(state==='over')failed=true;
 rows.push({file,bytes,max_bytes,headroom_bytes:max_bytes-bytes,usage_percent:Math.round(ratio*1000)/10,state});
}
const report={
 schema_version:1,generated_at:new Date().toISOString(),
 intent:'Guard against silent pre-migration bundle growth. Limits include modest headroom above the 2026-10-02 known-good build and are not performance targets.',
 rows,
 rules:[
   'A budget failure blocks migration until the size increase is explained or reduced.',
   'Passing this file-size gate does not prove runtime performance; phone draw-call, memory and thermal evidence remain separate.',
   'Do not raise a limit merely to make CI green. Record the before/after reason and measured device impact.'
 ]
};
fs.writeFileSync(path.join(OUT,'bundle-budgets.json'),JSON.stringify(report,null,2)+'\n');
for(const r of rows)console.log(r.file,r.missing?'MISSING':r.bytes+' / '+r.max_bytes+' ('+r.usage_percent+'%)',r.state||'');
if(failed)process.exit(1);
