// Go-live product/room wiring contract.
// Fails CI when a bike exists but is orphaned, a product points at a missing model,
// a room points outside its bounds, or generated product metadata drifts.
// Run from repo root: node tools/validate-product-wiring.mjs
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const J=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const exists=f=>fs.existsSync(path.join(root,f));
const products=J('museum/catalog/products.json');
const rooms=J('museum/world/rooms.json');
const brandrooms=J('museum/world/brand_rooms.json');
const wingsIndex=J('museum/world/wings/index.json');
const wings=wingsIndex.wings.map(f=>J('museum/world/wings/'+f));

const failures=[];
const warnings=[];
const fail=m=>failures.push(m);
const warn=m=>warnings.push(m);

if(products.count!==products.products.length) fail(`catalog count ${products.count} != products.length ${products.products.length}`);
if(products.in_museum!==products.products.filter(p=>p.museum).length) fail('catalog in_museum summary is stale');
if(products.studio_only!==products.products.filter(p=>!p.museum).length) fail('catalog studio_only summary is stale');

const ids=new Set();
for(const [i,p] of products.products.entries()){
  const at=`products[${i}]`;
  for(const k of ['id','brand','name','type','origin','glb']) if(!p[k]) fail(`${at} missing ${k}`);
  if(p.id){
    if(ids.has(p.id)) fail(`duplicate product id: ${p.id}`);
    ids.add(p.id);
  }
  if(p.type==='bike' && p.category!=='triathlon' && p.category!=='track') warn(`${p.id} bike has unusual category ${p.category}`);
  if(p.glb && !/\.glb$/i.test(p.glb)) fail(`${p.id} glb is not .glb: ${p.glb}`);
  if(p.glb && !exists(p.glb)) fail(`${p.id} missing asset: ${p.glb}`);
  if(!Array.isArray(p.sources) || p.sources.length===0) fail(`${p.id} has no provenance source`);
}

const knownRooms=new Set((rooms.areas||[]).map(r=>r.id));
for(const w of wings) for(const r of (w.rooms||[])) knownRooms.add(`atlas-${w.id}-${r.id}`);
for(const r of (brandrooms.rooms||[])) knownRooms.add(r.id);
for(const p of products.products){
  for(const where of (p.where||[])) if(!knownRooms.has(where.id)) fail(`${p.id} points to unknown room ${where.id}`);
  if(p.museum && !(p.where||[]).length) fail(`${p.id} says museum=true but has no where[] placement`);
  if(!p.museum && (p.where||[]).length) fail(`${p.id} says museum=false but has where[] placement`);
}

const roomIds=new Set();
const roomProductIds=new Set();
for(const [i,r] of (brandrooms.rooms||[]).entries()){
  const at=`brandrooms.rooms[${i}]`;
  for(const k of ['id','name','bounds','theme']) if(r[k]==null) fail(`${at} missing ${k}`);
  if(roomIds.has(r.id)) fail(`duplicate brand room id: ${r.id}`); roomIds.add(r.id);
  const b=r.bounds||{};
  if([b.x0,b.x1,b.z0,b.z1].some(v=>typeof v!=='number')) fail(`${r.id} has invalid bounds`);
  if(typeof b.x0==='number'&&typeof b.x1==='number'&&b.x1<=b.x0) fail(`${r.id} bounds.x1 must exceed x0`);
  if(typeof b.z0==='number'&&typeof b.z1==='number'&&b.z0<=b.z1) fail(`${r.id} bounds.z0 must be nearer than z1`);
  for(const p of (r.products||[])){
    if(!p.id) fail(`${r.id} product missing id`);
    if(p.id && roomProductIds.has(p.id)) fail(`room product appears twice: ${p.id}`);
    roomProductIds.add(p.id);
    if(!p.glb || !exists(p.glb)) fail(`${r.id}/${p.id} missing GLB ${p.glb||''}`);
    if(!p.source) warn(`${r.id}/${p.id} has no source URL`);
    if(p.brand && !p.legal) warn(`${r.id}/${p.id} has no independent-study/legal copy`);
    const s=p.station;
    if(s && typeof s.x==='number' && typeof s.z==='number' && typeof b.x0==='number'){
      const xmin=Math.min(b.x0,b.x1), xmax=Math.max(b.x0,b.x1), zmin=Math.min(b.z0,b.z1), zmax=Math.max(b.z0,b.z1);
      if(s.x<xmin||s.x>xmax||s.z<zmin||s.z>zmax) fail(`${r.id}/${p.id} station lies outside room bounds`);
    }
  }
}
// sibling overlap
for(let i=0;i<(brandrooms.rooms||[]).length;i++) for(let j=i+1;j<brandrooms.rooms.length;j++){
  const a=brandrooms.rooms[i], b=brandrooms.rooms[j], A=a.bounds, B=b.bounds;
  if(!A||!B) continue;
  const overlap=Math.min(A.x0,A.x1)<Math.max(B.x0,B.x1)&&Math.max(A.x0,A.x1)>Math.min(B.x0,B.x1)&&Math.min(A.z0,A.z1)<Math.max(B.z0,B.z1)&&Math.max(A.z0,A.z1)>Math.min(B.z0,B.z1);
  if(overlap) fail(`brand room bounds overlap: ${a.id} / ${b.id}`);
}

// Any locally-created multibrand web bike must become a canonical product before release.
// Lite variants are representations of the same product and need not be separately catalogued.
const referenced=new Set(products.products.map(p=>p.glb).filter(Boolean));
for(const r of (brandrooms.rooms||[])) for(const p of (r.products||[])) if(p.glb) referenced.add(p.glb);
const multi=path.join(root,'assets/multibrand');
if(fs.existsSync(multi)){
  const dirs=fs.readdirSync(multi,{withFileTypes:true}).filter(x=>x.isDirectory());
  for(const d of dirs){
    const candidates=[`assets/multibrand/${d.name}/bike.glb`,`assets/multibrand/${d.name}/speedmax_web.glb`].filter(exists);
    for(const f of candidates) if(!referenced.has(f)) fail(`orphan multibrand bike: ${f} is not in canonical catalog or a room`);
  }
}

for(const w of warnings) console.log('WARN '+w);
for(const f of failures) console.error('FAIL '+f);
console.log(`product wiring: ${products.products.length} products · ${brandrooms.rooms?.length||0} data rooms · ${warnings.length} warnings · ${failures.length} failures`);
process.exit(failures.length?1:0);
