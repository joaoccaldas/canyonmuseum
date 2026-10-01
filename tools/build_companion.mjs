#!/usr/bin/env node
// tools/build_companion.mjs — generate the public companion defaults from canonical source registries.
// Live feed items come from the bounded Supabase companion Edge Function; this file never scrapes the web.
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const J=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const places=J('museum/places/kona-v1.json');
const defaults=J('integrations/companion/default-sources.json');
const travel=J('integrations/companion/travel-links.json');
const publicPlaces=(places.places||[]).map(p=>({
  id:p.id,name:p.name,type:p.type,categories:p.categories||[],
  address:p.location?.address||'',website:p.website||'',
  source:p.source||null,notes:p.race_week_relevance||[],
  commercial:p.partner?.commercial===true
}));
const out={schema_version:1,generated_by:'tools/build_companion.mjs',feed_sources:defaults.sources||[],travel_links:travel.links||[],places:publicPlaces};
fs.mkdirSync(path.join(root,'app'),{recursive:true});
fs.writeFileSync(path.join(root,'app/companion-defaults.json'),JSON.stringify(out,null,1)+'\n');
console.log('companion defaults',out.feed_sources.length,'sources ·',out.travel_links.length,'travel links ·',out.places.length,'places');
