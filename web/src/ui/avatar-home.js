// ui/avatar-home.js — personal landing menu / Race Self studio.
// Avatar presentation reads Profile + RaceIdentity + collection. It owns no separate database.
import { readGameState } from '../engine/game-state.js';
import { collectionSummary } from '../engine/items.js';
import { getPublicProduct } from '../engine/catalog.js';
import { AVATARS } from '../engine/profile.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const productId=id=>String(id||'').replace(/^product:/,'');

async function equipped(snapshot, equipmentId) {
  const row=(snapshot.user_equipment||[]).find(x=>x.id===equipmentId);
  if(!row?.product_id) return null;
  return getPublicProduct(productId(row.product_id));
}

export async function renderAvatarHome(root,{profile,openMuseum,openGarage,openPlan,openCollection}={}) {
  const snapshot=readGameState();
  const identity=snapshot.race_identity || {};
  const summary=collectionSummary(snapshot);
  const bike=await equipped(snapshot,identity.setup?.bike);
  const shoe=await equipped(snapshot,identity.setup?.shoe);
  const accent=profile?.get?.().avatar || AVATARS[0];
  const goal=identity.goal?.label || 'Build your Kona';
  const intent=String(identity.intent||identity.mode||'exploring').replace(/[-_]+/g,' ');
  const bikeTitle=bike?[bike.brand,bike.name||bike.label||bike.model].filter(Boolean).join(' '):'Choose a bike';
  const studioHref=bike?'Studio.html?p='+encodeURIComponent(bike.id)+'#setup':'Studio.html#setup';

  root.innerHTML=
    '<section class="race-self-studio artifact artifact--hero">'+
      '<div class="race-self-figure" style="--avatar-accent:'+esc(accent)+'" aria-label="Your stylized Race Self"><i class="race-self-head"></i><i class="race-self-body"></i><i class="race-self-leg a"></i><i class="race-self-leg b"></i></div>'+
      '<div class="race-self-copy"><small>YOUR RACE SELF</small><h3>'+esc(goal)+'</h3><p>'+esc(intent)+' · '+esc(bikeTitle)+(shoe?' · '+esc(shoe.name||shoe.label||shoe.model):'')+'</p>'+
        '<div class="race-self-swatches" aria-label="Avatar accent">'+AVATARS.map(c=>'<button type="button" data-avatar="'+c+'" style="--swatch:'+c+'" aria-label="Avatar accent '+c+'"'+(c===accent?' class="on"':'')+'></button>').join('')+'</div>'+
      '</div>'+
    '</section>'+
    '<section class="kona-section race-self-menu artifact artifact--label"><div class="kona-section-head"><h3>Where next?</h3><small>'+summary.total+' collected</small></div>'+
      '<div class="race-self-actions">'+
        '<button type="button" data-action="museum"><small>WORLD</small><b>Canyon Museum</b><span>Enter 3D when you want it.</span></button>'+
        '<a href="'+studioHref+'"><small>STUDIO</small><b>Customize your bike</b><span>Paint, setup, finish and scene.</span></a>'+
        '<button type="button" data-action="collection"><small>COLLECTION</small><b>Cards & items</b><span>'+summary.total+' things collected so far.</span></button>'+
        '<button type="button" data-action="garage"><small>GARAGE</small><b>Your equipment</b><span>Mine. Dreaming. Try.</span></button>'+
        '<button type="button" data-action="plan"><small>RACE WEEK</small><b>Plan</b><span>Useful details without loading the world.</span></button>'+
      '</div>'+
    '</section>';

  root.querySelectorAll('[data-avatar]').forEach(btn=>btn.addEventListener('click',()=>{
    profile?.set?.({avatar:btn.dataset.avatar});
    root.querySelector('.race-self-figure')?.style.setProperty('--avatar-accent',btn.dataset.avatar);
    root.querySelectorAll('[data-avatar]').forEach(x=>x.classList.toggle('on',x===btn));
  }));
  root.querySelector('[data-action=museum]')?.addEventListener('click',()=>openMuseum?.());
  root.querySelector('[data-action=collection]')?.addEventListener('click',()=>openCollection?.());
  root.querySelector('[data-action=garage]')?.addEventListener('click',()=>openGarage?.());
  root.querySelector('[data-action=plan]')?.addEventListener('click',()=>openPlan?.());
}
