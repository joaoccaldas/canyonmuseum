import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const SOURCE_DIRS = ['web/src','app','tools','integrations'];
const errors = [];
const baselinePath = path.join(ROOT,'tools/repo-hygiene-legacy-baseline.json');
const baseline = fs.existsSync(baselinePath) ? new Set(JSON.parse(fs.readFileSync(baselinePath,'utf8')).files || []) : new Set();

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out=[];
  for (const ent of fs.readdirSync(dir,{withFileTypes:true})) {
    const p=path.join(dir,ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const textFiles = SOURCE_DIRS.flatMap(d=>walk(path.join(ROOT,d))).filter(p=>/\.(js|mjs|json|md|css|html|yml|yaml|py)$/.test(p));
if (textFiles.length < 20) { console.error(`repository hygiene guard misconfigured: only ${textFiles.length} files discovered under ${ROOT}`); process.exit(2); }
for (const file of textFiles) {
  const rel=path.relative(ROOT,file).replaceAll('\\','/');
  const text=fs.readFileSync(file,'utf8');

  if (/\/Users\/[^/]+\//.test(text) || /C:\\Users\\/i.test(text)) {
    errors.push(`${rel}: contains a private absolute user path`);
  }
  if (rel !== 'web/src/engine/storage.js' && /['"`]speedmax\.[A-Za-z0-9_.:-]+['"`]/.test(text) && !baseline.has(rel) && !rel.startsWith('app/')) {
    errors.push(`${rel}: introduces direct legacy speedmax.* storage/config key; use the KONA adapter`);
  }
}

for (const banned of ['downloads/SpeedmaxMuseum.apk']) {
  if (fs.existsSync(path.join(ROOT,banned))) errors.push(`${banned}: release binary belongs in Actions/Releases, not source control`);
}

if (errors.length) {
  console.error('repository hygiene guard failed');
  for (const e of errors) console.error(' - '+e);
  process.exit(1);
}
console.log(`repository hygiene guard: PASS (${textFiles.length} text/source files checked; ${baseline.size} known legacy source files baselined)`);
