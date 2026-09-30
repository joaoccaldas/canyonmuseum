import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIRS = ['web/src','tools','integrations'];
const LEGACY_SPEEDMAX_ALLOWLIST = new Set([
  'web/src/engine/profile.js','web/src/engine/app-state.js','web/src/engine/game-state.js',
  'web/src/finds.js','web/src/engine/identity.js','web/src/engine/progression.js',
  'web/src/exp/main.js','web/src/main.js','web/src/passport.js','web/src/landing.js',
  'web/src/studio/race-setup.js','tools/harden_pages.mjs','web/src/engine/storage.js',
]);
const errors = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out=[];
  for (const ent of fs.readdirSync(dir,{withFileTypes:true})) {
    const p=path.join(dir,ent.name);
    if (ent.isDirectory()) out.push(...walk(p)); else out.push(p);
  }
  return out;
}

const textFiles=SOURCE_DIRS.flatMap(d=>walk(path.join(ROOT,d))).filter(p=>/\.(js|mjs|json|md|css|html|yml|yaml|py)$/.test(p));
if(textFiles.length<25) errors.push(`guard scanned suspiciously few source files: ${textFiles.length}`);

for(const file of textFiles){
 const rel=path.relative(ROOT,file).replaceAll('\\','/');
 const text=fs.readFileSync(file,'utf8');
 if(/\/Users\/[^/]+\//.test(text)||/C:\\Users\\/i.test(text)) errors.push(`${rel}: contains a private absolute user path`);
 if(rel!=='web/src/engine/storage.js' && /['"`]speedmax\.[A-Za-z0-9_.:-]+['"`]/.test(text) && !LEGACY_SPEEDMAX_ALLOWLIST.has(rel))
   errors.push(`${rel}: new direct legacy speedmax.* key; use the KONA storage adapter`);
}
for(const banned of ['downloads/SpeedmaxMuseum.apk']) if(fs.existsSync(path.join(ROOT,banned))) errors.push(`${banned}: release binary belongs in Actions/Releases`);

if(errors.length){console.error('repository hygiene guard failed');for(const e of errors)console.error(' - '+e);process.exit(1);}
console.log(`repository hygiene guard: PASS (${textFiles.length} source files checked; ${LEGACY_SPEEDMAX_ALLOWLIST.size} legacy-key files grandfathered for migration)`);
