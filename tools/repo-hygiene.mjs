import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
// app/*.js are deterministic build outputs. Source authority lives under web/src and tools/integrations.
const SOURCE_DIRS = ['web/src','tools','integrations'];
const errors = [];
const debt = [];

// Exact grandfathered legacy-storage authorities on 2026-09-30.
// This is a burn-down list, not permission to add new legacy callers.
const LEGACY_STORAGE_DEBT = new Set([
  'web/src/engine/app-state.js',
  'web/src/engine/game-state.js',
  'web/src/engine/identity.js',
  'web/src/engine/profile.js',
  'web/src/engine/progression.js',
  'web/src/exp/main.js',
  'web/src/finds.js',
  'web/src/landing.js',
  'web/src/main.js',
  'web/src/passport.js',
  'web/src/studio/race-setup.js',
]);

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
if (textFiles.length < 20) {
  console.error(`repository hygiene guard misconfigured: only ${textFiles.length} files discovered under ${ROOT}`);
  process.exit(2);
}
for (const file of textFiles) {
  const rel=path.relative(ROOT,file).replaceAll('\\','/');
  const text=fs.readFileSync(file,'utf8');

  if (/\/Users\/[^/]+\//.test(text) || /C:\\Users\\/i.test(text)) {
    errors.push(`${rel}: contains a private absolute user path`);
  }

  if (rel !== 'web/src/engine/storage.js' && /['"`]speedmax\.[A-Za-z0-9_.:-]+['"`]/.test(text)) {
    if (LEGACY_STORAGE_DEBT.has(rel)) debt.push(rel);
    else errors.push(`${rel}: introduces a NEW direct legacy speedmax.* key; use engine/storage.js`);
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
console.log(`repository hygiene guard: PASS (${textFiles.length} authoritative text/source files checked)`);
if (debt.length) {
  console.warn(`legacy storage migration debt: ${debt.length} grandfathered source modules remain`);
  for (const rel of debt) console.warn(' - '+rel);
}
