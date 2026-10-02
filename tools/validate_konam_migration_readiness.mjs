#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const J=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const problems=[];
const assert=(ok,msg)=>{if(!ok)problems.push(msg)};
const uniq=a=>new Set(a).size===a.length;

const manifest=J('world/konam/migration-manifest-v1.json');
const naming=J('world/konam/naming-origin-map-v1.json');
const state=J('world/konam/state-migration-plan-v1.json');
const legacy=J('world/konam/legacy-finds-map-v1.json');
const roomPlan=J('world/konam/room-production-plan-v1.json');
const review=J('collections/kona-141-production-review-v1.json');
const perf=J('world/konam/performance-budget-v1.json');
const render=J('world/konam/rendering-lifecycle-contract-v1.json');
const css=J('world/konam/css-ownership-contract-v1.json');
const triage=J('world/konam/open-pr-triage-v1.json');
const m0=J('world/konam/m0-acceptance-matrix-v1.json');
const ownership=J('world/konam/generated-artifact-ownership-v1.json');
const rooms=J('world/konam/rooms-v1.json').rooms;
const k141=J('collections/kona-141-v1.json').items;
const finds=J('museum/game/finds-v1.json').items;

assert(manifest.target?.repository==='joaoccaldas/konam','target repo must be joaoccaldas/konam');
assert((manifest.paths||[]).length>=15,'migration manifest unexpectedly small');
assert((manifest.m0_forbidden||[]).length>=8,'M0 forbidden list unexpectedly weak');

assert((naming.mappings||[]).some(x=>x.class==='NATIVE_IDENTITY'),'naming map lacks native identity classification');
assert((naming.mappings||[]).some(x=>x.class==='PRESERVE_BRAND_CONTENT'),'naming map lacks Canyon preservation rule');
assert((naming.mappings||[]).some(x=>x.class==='RENAME_M1_ORIGIN'),'naming map lacks origin migration rule');

const findIds=new Set(finds.map(x=>x.id));
for(const [old,id] of Object.entries(state.legacy_find_map||{})) assert(findIds.has(id),`state map ${old} -> unknown ${id}`);
for(const row of legacy.mappings||[]) assert(findIds.has(row.canonical_collectible_id),`legacy finds map -> unknown ${row.canonical_collectible_id}`);
assert(Object.keys(state.legacy_find_map||{}).length===5,'expected exactly five legacy physical find mappings');

assert(roomPlan.rooms?.length===28,'room production plan must cover 28 rooms');
assert(uniq(roomPlan.rooms.map(x=>x.room_id)),'room production plan room IDs must be unique');
for(const room of rooms)assert(roomPlan.rooms.some(x=>x.room_id===room.id),`room production plan missing ${room.id}`);

assert(review.items?.length===141,'Founding 141 production review must cover 141 items');
assert(uniq(review.items.map(x=>x.item_id)),'Founding 141 production review IDs must be unique');
for(const item of k141)assert(review.items.some(x=>x.item_id===item.id),`production review missing ${item.id}`);
const prematureBuilds=review.items.filter(x=>x.requires_new_high_fidelity_3d===true);
assert(prematureBuilds.length===0,'no item should be declared new high-fidelity 3D required without detailed reuse/build review');

assert(Number(perf.renderer_budgets?.embedded_dpr_cap_default)<=1.6,'embedded default DPR cap regressed');
assert(Number(perf.renderer_budgets?.phone_world_dpr_target_max)<=1.5,'phone world DPR target regressed');
assert(Number(perf.frame_budgets?.minimum_sustained_fps_phone)>=30,'phone minimum FPS budget below 30');
assert((render.embedded_renderer?.teardown||[]).length>=6,'renderer teardown contract unexpectedly weak');
assert((css.authorities||[]).some(x=>x.path==='brand/tokens.css'),'CSS contract missing token authority');

assert((triage.prs||[]).some(x=>x.number===133&&x.status==='ASSET_ONLY_TRANSFER'),'PR133 asset transfer classification missing');
assert((triage.prs||[]).some(x=>x.number===157&&x.status==='REPLAY_IN_KONAM'),'PR157 replay classification missing');
assert(uniq((triage.prs||[]).map(x=>x.number)),'PR triage contains duplicate numbers');

const gates=m0.gates||[];
assert(gates.length>=20,'M0 acceptance matrix unexpectedly small');
assert(uniq(gates.map(x=>x.id)),'M0 gate IDs must be unique');
for(const id of ['M0-03','M0-06','M0-09','M0-15','M0-17','M0-19','M0-20']) assert(gates.some(x=>x.id===id&&x.blocking),`required blocking gate missing: ${id}`);

assert((ownership.artifacts||[]).some(x=>x.output==='app/hall.js'),'generated ownership missing hall bundle');
assert((ownership.artifacts||[]).some(x=>x.output==='app/kona-core.js'),'generated ownership missing core bundle');

const report={
 ok:problems.length===0,
 checks:{
  manifest_paths:manifest.paths?.length||0,
  naming_mappings:naming.mappings?.length||0,
  legacy_find_mappings:Object.keys(state.legacy_find_map||{}).length,
  room_plan:roomPlan.rooms?.length||0,
  founding_review:review.items?.length||0,
  pr_triage:triage.prs?.length||0,
  m0_gates:gates.length,
  generated_artifacts:ownership.artifacts?.length||0
 },
 problems
};
const out=path.join(ROOT,'konam-quality-evidence');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'migration-readiness.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(problems.length)process.exit(1);
