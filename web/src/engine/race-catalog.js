// engine/race-catalog.js — lazy searchable race edition catalog.
// Immutable race metadata lives in integrations/ironman-races-2016-2026.json.
// Personal state stores only relationships to race ids.
let promise=null;
const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function loadRaceCatalog(){
  if(!promise) promise=fetch('integrations/ironman-races-2016-2026.json',{cache:'force-cache',credentials:'same-origin'})
    .then(r=>r.ok?r.json():Promise.reject(new Error('race catalog unavailable')))
    .catch(()=>({schema:'kona-race-catalog-v1',races:[],coverage:{}}));
  return promise;
}
export function raceSearchText(r){
  return norm([r.name,r.brand,r.distance,r.year,r.slug].filter(Boolean).join(' '));
}
export async function searchRaces(query,{limit=8,yearMin=2016}={}){
  const q=norm(query).trim();
  const data=await loadRaceCatalog();
  if(!q) return (data.races||[]).filter(r=>r.year>=yearMin).sort((a,b)=>(b.year-a.year)||a.name.localeCompare(b.name)).slice(0,limit);
  const tokens=q.split(/\s+/).filter(Boolean);
  return (data.races||[])
    .filter(r=>r.year>=yearMin&&tokens.every(t=>raceSearchText(r).includes(t)))
    .sort((a,b)=>{
      const an=norm(a.name),bn=norm(b.name);
      const ae=an.startsWith(q)?0:1,be=bn.startsWith(q)?0:1;
      return ae-be||(b.year-a.year)||a.name.localeCompare(b.name);
    }).slice(0,limit);
}
export async function getRace(id){
  const data=await loadRaceCatalog();
  return (data.races||[]).find(r=>r.id===id)||null;
}
