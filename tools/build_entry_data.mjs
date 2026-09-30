import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const event=JSON.parse(fs.readFileSync(path.join(root,'integrations/sources/kona-2026.ironman.json'),'utf8'));
const places=JSON.parse(fs.readFileSync(path.join(root,'museum/places/kona-v1.json'),'utf8'));
const compactPlaces=(places.places||[]).map(p=>({
 id:p.id,name:p.name,type:p.type,
 region:p.location?.city||p.location?.region||'Kona',
 purpose:(p.race_week_relevance||[]).slice(0,2).join(' · '),
 categories:(p.categories||[]).slice(0,4),
 website:p.website||null,
 verified_at:p.source?.verified_at||null,
 partner_status:p.partner?.status||'none',
}));
const data={
 schema:'entry-data-v2',
 generated_from:['integrations/sources/kona-2026.ironman.json','museum/places/kona-v1.json'],
 event:event.current_facts?.event||{},
 race_week:event.current_facts?.race_week||[],
 places:compactPlaces,
 discover:[
  {id:'discover:machines',kind:'collection',title:'Machines',body:'Race bikes, engineering and the objects that changed the sport.',action:'Browse artifacts'},
  {id:'discover:places',kind:'places',title:'Kona',body:'Race-week places with sourced practical context.',action:'Explore places'},
  {id:'discover:world',kind:'world',title:'3D world',body:'Enter the museum only when you want the immersive experience.',action:'Enter 3D'},
 ],
};
fs.writeFileSync(path.join(root,'app/entry-data.json'),JSON.stringify(data,null,2)+'\n');
console.log(`entry data  ${Buffer.byteLength(JSON.stringify(data))} bytes · ${data.race_week.length} race-week rows · ${data.places.length} places`);
