// ui/admin-assets.js — admin-only read-only portfolio over canonical asset registries.
// This file owns no asset truth. It joins product, room and decoration data for QA.
import { currentUser, isAdminUser } from '../cloud/supabase-lite.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json=path=>fetch(path,{cache:'no-store',credentials:'same-origin'}).then(r=>r.ok?r.json():Promise.reject(new Error('Could not load '+path)));
const cleanYear=v=>String(v??'').trim();
const firstImage=o=>o?.thumbnail||o?.image||o?.poster||o?.preview||o?.media?.[0]?.src||o?.media?.[0]?.url||'';
const titleOf=o=>o?.name||o?.model||o?.label||o?.id||'Untitled asset';
const typeOf=o=>String(o?.type||o?.kind||'asset').toLowerCase();
const specLine=(k,v)=>v?'<span><i>'+esc(k)+'</i><b>'+esc(v)+'</b></span>':'';

function productSpecs(p){
 const rows=[];
 if(p.family)rows.push(['Family',p.family]);
 if(p.material)rows.push(['Material',p.material]);
 if(p.category)rows.push(['Category',p.category]);
 if(p.glb||p.asset_path)rows.push(['3D','GLB']);
 for(const fact of (p.facts||[]).slice(0,2)) if(fact?.text) rows.push(['Fact',fact.text]);
 for(const stat of (p.stats||[]).slice(0,3)) if(Array.isArray(stat)) rows.push([stat[1]||'Spec',stat[0]]);
 return rows.slice(0,4);
}

function buildInventory(catalog,roomsData,brandData,decorData){
 const floors=new Map((roomsData.floors||[]).map(f=>[f.id,f.name]));
 const rooms=new Map();
 const locations=new Map();
 const roomOrder=[];
 const addLocation=(assetId,room)=>{
   if(!assetId||!room)return;
   if(!locations.has(assetId))locations.set(assetId,[]);
   const list=locations.get(assetId);
   if(!list.some(x=>x.id===room.id))list.push(room);
 };
 for(const area of roomsData.areas||[]){
   const room={id:area.id,name:area.name||area.short||area.id,floor:area.floor||'unassigned',floorName:floors.get(area.floor)||area.floor||'Unassigned',kind:area.kind||'room'};
   rooms.set(room.id,room);roomOrder.push(room.id);
   for(const id of area.exhibits?.products||[])addLocation(id,room);
 }
 const productById=new Map((catalog.products||[]).map(p=>[p.id,{...p}]));
 for(const p of catalog.products||[]){
   for(const w of p.where||[]) addLocation(p.id,rooms.get(w.id)||{id:w.id,name:w.name||w.id,floor:'unassigned',floorName:'Unassigned',kind:'room'});
 }
 for(const r of brandData.rooms||[]){
   const room={id:r.id,name:r.name||r.id,floor:r.floor||'ground',floorName:floors.get(r.floor||'ground')||'Ground floor',kind:r.kind||'brand'};
   rooms.set(room.id,room);if(!roomOrder.includes(room.id))roomOrder.push(room.id);
   for(const p of r.products||[]){
     const existing=productById.get(p.id)||{};
     productById.set(p.id,{...p,...existing,id:p.id,brand:existing.brand||p.brand,name:existing.name||p.model||p.name,type:existing.type||p.type,year:existing.year||p.year,glb:existing.glb||p.glb,stats:existing.stats||p.stats});
     addLocation(p.id,room);
   }
 }
 const assets=[];
 for(const p of productById.values()){
   const loc=(locations.get(p.id)||[]).map(x=>({...x}));
   assets.push({
     id:p.id,kind:'product',type:typeOf(p),brand:p.brand||'Independent',name:titleOf(p),year:cleanYear(p.year||p.years||p.era),
     image:firstImage(p),glb:p.glb||p.asset_path||'',locations:loc,specs:productSpecs(p),source:p
   });
 }
 const propDefs=new Map((decorData.props||[]).map(p=>[p.id,p]));
 const decorPlacements=new Map();
 const addDecor=(room,placement)=>{
   const id=placement?.prop;if(!id)return;
   if(!decorPlacements.has(id))decorPlacements.set(id,[]);
   decorPlacements.get(id).push({room,placement});
 };
 for(const area of roomsData.areas||[]){
   const room=rooms.get(area.id);
   for(const p of area.decorations||[])addDecor(room,p);
 }
 for(const r of brandData.rooms||[]){
   const room=rooms.get(r.id);
   for(const p of r.decorations||[])addDecor(room,p);
 }
 for(const [id,def] of propDefs){
   const placements=decorPlacements.get(id)||[];
   assets.push({
     id,kind:'decoration',type:'decoration',brand:'KONA World',name:def.name||id,year:'',
     image:firstImage(def),glb:def.glb||'',locations:[...new Map(placements.map(x=>[x.room?.id,x.room])).values()].filter(Boolean),
     specs:[['Builder',def.builder],['Height',def.height?def.height+' m':''],['Placements',String(placements.length)]].filter(x=>x[1]),source:def
   });
 }
 for(const inst of decorData.installations||[]){
   assets.push({
     id:'installation:'+inst.id,kind:'installation',type:'installation',brand:'KONA World',name:inst.name||inst.id,year:'',
     image:firstImage(inst),glb:'',locations:[],specs:[['Builder',inst.builder],['Min width',inst.min_width?inst.min_width+' m':''],['Min depth',inst.min_depth?inst.min_depth+' m':'']].filter(x=>x[1]),source:inst
   });
 }
 return {assets,rooms,roomOrder};
}

function card(a){
 const loc=a.locations||[];
 const img=a.image?'<img src="'+esc(a.image)+'" alt="" loading="lazy" decoding="async">':'';
 const fallback='<div class="asset-thumb-fallback"><small>'+esc(a.type)+'</small><b>'+esc(a.brand)+'</b><em>'+(a.glb?'3D asset':'thumbnail pending')+'</em></div>';
 return '<article class="asset-card" data-asset-card data-type="'+esc(a.type)+'" data-brand="'+esc(a.brand)+'" data-year="'+esc(a.year)+'">'+
   '<div class="asset-thumb">'+img+fallback+'</div>'+
   '<div class="asset-card-body">'+
    '<div class="asset-meta"><span>'+esc(a.brand)+'</span><span>'+esc(a.year||a.kind)+'</span></div>'+
    '<h5>'+esc(a.name)+'</h5>'+
    '<p>'+esc(a.id)+'</p>'+
    '<div class="asset-locations">'+(loc.length?loc.map(x=>'<span>'+esc((x.floorName?x.floorName+' · ':'')+x.name)+'</span>').join(''):'<span>Reusable / unassigned</span>')+'</div>'+
    '<div class="asset-specs">'+(a.specs||[]).map(([k,v])=>specLine(k,v)).join('')+'</div>'+
   '</div>'+
 '</article>';
}

export async function renderAdminAssets(root){
 const user=await currentUser().catch(()=>null);
 if(!isAdminUser(user)){
   root.innerHTML='<section class="asset-portfolio"><div class="asset-hero"><small>ADMIN</small><h3>Not for this account.</h3><p>The Asset Portfolio is only visible to KONA administrators.</p></div></section>';
   return;
 }
 root.innerHTML='<section class="asset-portfolio"><div class="asset-hero"><small>KONA · ADMIN</small><h3>Asset Portfolio.</h3><p>Everything currently wired into the museum and brand rooms, joined from the canonical registries. One place to spot duplicates, missing thumbnails and forgotten objects.</p><div class="asset-hand">Nothing hiding in a mystery folder.</div></div><p class="kona-source-note" data-asset-status>Reading the world…</p></section>';
 const host=root.querySelector('.asset-portfolio'),status=root.querySelector('[data-asset-status]');
 try{
   const [catalog,rooms,brandRooms,decorations]=await Promise.all([
     json('museum/catalog/products.json'),json('museum/world/rooms.json'),json('museum/world/brand_rooms.json'),json('museum/world/decorations.json')
   ]);
   const model=buildInventory(catalog,rooms,brandRooms,decorations);
   const brands=[...new Set(model.assets.map(a=>a.brand))].sort();
   const types=[...new Set(model.assets.map(a=>a.type))].sort();
   const years=[...new Set(model.assets.map(a=>a.year).filter(Boolean))].sort((a,b)=>String(b).localeCompare(String(a)));
   const missing=model.assets.filter(a=>!a.image).length;
   status.remove();
   host.insertAdjacentHTML('beforeend',
     '<div class="asset-summary"><span>'+model.assets.length+' assets</span><span>'+catalog.products.length+' catalog products</span><span>'+decorations.props.length+' decoration props</span><span>'+missing+' thumbnails to create</span></div>'+
     '<section class="asset-toolbar"><small>FILTER THE WORLD</small><div class="asset-filter-grid">'+
       '<label class="ui-field wide"><span>Search</span><input class="ui-input" data-asset-q type="search" placeholder="Bike, Nike, 2027, palm…"></label>'+
       '<label class="ui-field"><span>Type</span><select class="ui-select" data-asset-type><option value="">All types</option>'+types.map(v=>'<option>'+esc(v)+'</option>').join('')+'</select></label>'+
       '<label class="ui-field"><span>Brand</span><select class="ui-select" data-asset-brand><option value="">All brands</option>'+brands.map(v=>'<option>'+esc(v)+'</option>').join('')+'</select></label>'+
       '<label class="ui-field"><span>Year</span><select class="ui-select" data-asset-year><option value="">All years</option>'+years.map(v=>'<option>'+esc(v)+'</option>').join('')+'</select></label>'+
       '<label class="ui-field"><span>Group</span><select class="ui-select" data-asset-group><option value="room">Room / floor</option><option value="brand">Brand</option><option value="type">Type</option></select></label>'+
     '</div></section>'+
     '<div data-asset-results></div>'
   );
   const results=host.querySelector('[data-asset-results]');
   const controls={
     q:host.querySelector('[data-asset-q]'),type:host.querySelector('[data-asset-type]'),brand:host.querySelector('[data-asset-brand]'),
     year:host.querySelector('[data-asset-year]'),group:host.querySelector('[data-asset-group]')
   };
   const render=()=>{
     const q=controls.q.value.trim().toLowerCase(),type=controls.type.value,brand=controls.brand.value,year=controls.year.value,group=controls.group.value;
     const rows=model.assets.filter(a=>{
       const hay=[a.id,a.name,a.brand,a.type,a.year,...a.locations.map(x=>x.name),...a.specs.flat()].join(' ').toLowerCase();
       return (!q||hay.includes(q))&&(!type||a.type===type)&&(!brand||a.brand===brand)&&(!year||a.year===year);
     });
     const groups=new Map();
     for(const a of rows){
       let keys=[];
       if(group==='brand')keys=[a.brand];
       else if(group==='type')keys=[a.type];
       else keys=a.locations.length?a.locations.map(x=>(x.floorName||'Unassigned')+' · '+x.name):['Reusable / unassigned'];
       for(const k of [...new Set(keys)]){if(!groups.has(k))groups.set(k,[]);groups.get(k).push(a);}
     }
     const sorted=[...groups.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
     results.innerHTML=sorted.length?sorted.map(([label,items])=>
       '<section class="asset-room"><div class="asset-room-title"><div><small>'+esc(group==='room'?'ROOM / FLOOR':group.toUpperCase())+'</small><h4>'+esc(label)+'</h4></div><b>'+items.length+' item'+(items.length===1?'':'s')+'</b></div><div class="asset-grid">'+items.sort((a,b)=>(String(b.year).localeCompare(String(a.year))||a.brand.localeCompare(b.brand)||a.name.localeCompare(b.name))).map(card).join('')+'</div></section>'
     ).join(''):'<p class="asset-empty">Nothing here. Which is useful information too.</p>';
   };
   Object.values(controls).forEach(el=>el.addEventListener(el.tagName==='INPUT'?'input':'change',render));
   render();
 }catch(error){
   status.textContent='Asset Portfolio could not read one of the canonical registries: '+error.message;
   status.setAttribute('role','alert');
 }
}
