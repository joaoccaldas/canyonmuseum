#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'konam-quality-evidence');
fs.mkdirSync(OUT,{recursive:true});
const dir=path.join(ROOT,'.github/workflows');
const files=fs.existsSync(dir)?fs.readdirSync(dir).filter(f=>/\.ya?ml$/.test(f)).sort():[];
const rows=[];
for(const f of files){
 const text=fs.readFileSync(path.join(dir,f),'utf8');
 const nodeVersions=[...text.matchAll(/node-version:\s*['"]?([^\s'"]+)/g)].map(m=>m[1]);
 const actions=[...text.matchAll(/uses:\s*([^\s#]+)/g)].map(m=>m[1]);
 rows.push({
   file:'.github/workflows/'+f,
   node_versions:[...new Set(nodeVersions)],
   checkout_versions:[...new Set(actions.filter(x=>x.startsWith('actions/checkout@')))],
   setup_node_versions:[...new Set(actions.filter(x=>x.startsWith('actions/setup-node@')))],
   upload_artifact_versions:[...new Set(actions.filter(x=>x.startsWith('actions/upload-artifact@')))],
   persist_credentials_false:/persist-credentials:\s*false/.test(text),
   permissions_read:/permissions:\s*\n(?:\s+[^\n]+\n)*?\s+contents:\s*read/m.test(text)||/permissions:\s*\{[^}]*contents:\s*read/.test(text),
   workflow_dispatch:/workflow_dispatch:/.test(text),
 });
}
const nodeSet=[...new Set(rows.flatMap(r=>r.node_versions))].sort();
const report={
 schema_version:1,generated_at:new Date().toISOString(),
 totals:{workflow_files:rows.length,node_versions:nodeSet},
 workflows:rows,
 findings:[
   ...(nodeSet.length>1?[{severity:'medium',id:'mixed-node-major',detail:'Multiple explicit Node versions are used across workflows: '+nodeSet.join(', ')}]:[]),
   ...rows.filter(r=>!r.permissions_read).map(r=>({severity:'review',id:'workflow-permissions',file:r.file,detail:'No simple contents:read permission contract detected; review manually.'})),
 ],
 migration_rules:[
   'Do not upgrade dependencies and CI runtime versions in the same M0 migration commit.',
   'After M0, converge JavaScript CI to one supported Node LTS/major unless a tool has a documented exception.',
   'Pin major versions of official GitHub actions and keep checkout credentials disabled for jobs that do not push.',
   'Any workflow that publishes must consume exact-SHA certification rather than infer green state from an older commit.'
 ]
};
fs.writeFileSync(path.join(OUT,'ci-architecture.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.totals,null,2));
for(const f of report.findings)console.log(f.severity.toUpperCase(),f.id,f.file||'',f.detail);
