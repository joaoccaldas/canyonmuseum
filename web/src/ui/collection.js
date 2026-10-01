// ui/collection.js — cards/items view over the canonical collection projection.
import { readGameState } from '../engine/game-state.js';
import { itemCollection, collectionSummary } from '../engine/items.js';
import { collectibleById } from '../engine/progression.js';
import { getPublicProduct } from '../engine/catalog.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const productId=id=>String(id||'').replace(/^product:/,'');

export async function renderCollectionSurface(root) {
  const snapshot=readGameState();
  const items=itemCollection(snapshot);
  const summary=collectionSummary(snapshot);
  const cards=[];
  for (const item of items) {
    let title=item.label, meta=item.kind;
    if (item.kind==='equipment') {
      const p=await getPublicProduct(productId(item.entity_id));
      if (p) { title=[p.brand,p.name||p.label||p.model].filter(Boolean).join(' '); meta=[p.product_type||p.type,item.relationship].filter(Boolean).join(' · '); }
    }
    const collectible=collectibleById(item.entity_id);
    if(collectible){title=collectible.name;meta=collectible.rarity+' · '+collectible.place;}
    const mark={equipment:'◇',bike:'↗',part:'⚙',find:'✦',story:'◷',race:'⚑',card:'▧'}[item.kind]||'◇';
    cards.push('<article class="kona-item-card artifact artifact--label"><i class="kona-item-mark" aria-hidden="true">'+mark+'</i><small>'+esc(meta)+'</small><b>'+esc(title)+'</b><span>'+esc(item.kind==='equipment'?(item.relationship==='owned'?'Owned':item.relationship==='dream'?'Dream setup':'Saved to try'):'Discovered')+'</span></article>');
  }
  root.innerHTML=
    '<section class="kona-hero-card artifact artifact--hero"><small>YOUR COLLECTION</small><h3>'+summary.total+' things with a story.</h3><p>Equipment, discoveries and cards are projections of what you actually own, save or find.</p></section>'+
    '<section class="kona-section artifact artifact--label"><div class="kona-section-head"><h3>Cards & items</h3><small>'+summary.equipment+' equipment · '+summary.finds+' finds</small></div>'+
      '<div class="kona-item-grid">'+(cards.join('')||'<article class="kona-item-card"><b>Nothing collected yet.</b><span>Explore the world or save equipment to start.</span></article>')+'</div></section>';
}
