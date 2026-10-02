#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const plan=read('world/konam/state-migration-plan-v1.json');
const finds=read('museum/game/finds-v1.json');
const progression=read('museum/game/progression-v2.json');
const ids=new Set((finds.items||[]).map(x=>x.id));
const problems=[];
for(const [legacy,id] of Object.entries(plan.legacy_find_map||{})){
  if(!ids.has(id))problems.push(`legacy find ${legacy} maps to unknown collectible ${id}`);
}
const mapped=[...Object.values(plan.legacy_find_map||{})];
if(new Set(mapped).size!==mapped.length)problems.push('legacy find map is not one-to-one');
const levels=(progression.levels||[]).map(x=>({level:x.level,xp:x.xp,name:x.name}));
if(levels.length!==10)problems.push(`expected current canonical progression to expose 10 levels, found ${levels.length}`);
const report={
 schema_version:1,
 legacy_find_map:plan.legacy_find_map,
 canonical_find_count:(finds.items||[]).length,
 canonical_levels:levels,
 semantic_risk_count:(plan.identified_semantic_risks||[]).length,
 problems
};
const out=path.join(ROOT,'konam-quality-evidence');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'state-migration.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(problems.length)process.exit(1);
