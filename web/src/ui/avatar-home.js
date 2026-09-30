// ui/avatar-home.js — personal landing menu / Race Self studio.
// Lightweight 3D stage is progressive enhancement; canonical state remains 2D-first.
import { readGameState } from '../engine/game-state.js';
import { collectionSummary } from '../engine/items.js';
import { getPublicProduct } from '../engine/catalog.js';
import { AVATARS } from '../engine/profile.js';
import { renderRaceBadges, renderRacePicker } from './race-cards.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const productId=id=>String(id||'').replace(/^product:/,'');

async function equipped(snapshot,equipmentId){
  const row=(snapshot.user_equipment||[]).find(x=>x.id===equipmentId);
  if(!row?.product_id)return null;
  return getPublicProduct(productId(row.product_id));
}

export async function renderAvatarHome(root,{profile,settings,openMuseum,openGarage,openPlan,openCollection,openDiscover}={}){
  const snapshot=readGameState();
  const identity=snapshot.race_identity||{};
  const summary=collectionSummary(snapshot);
  const [bike,shoe]=await Promise.all([equipped(snapshot,identity.setup?.bike),equipped(snapshot,identity.setup?.shoe)]);
  const accent=profile?.get?.().avatar||AVATARS[0];
  const goal=identity.goal?.label||'Build your Kona';
  const intent=String(identity.intent||identity.mode||'exploring').replace(/[-_]+/g,' ');
  const bikeTitle=bike?[bike.brand,bike.name||bike.label||bike.model].filter(Boolean).join(' '):'Choose a bike';
  const studioHref=bike?'Studio.html?p='+encodeURIComponent(bike.id)+'#setup':'Studio.html#setup';

  root.innerHTML=
    '<section class="race-self-shell">'+
      '<div class="race-self-stage-wrap">'+
        '<canvas class="race-self-stage" data-race-self-stage aria-label="3D Race Self with selected gear"></canvas>'+
        '<div class="race-self-stage-copy"><small>YOUR RACE SELF</small><h3>'+esc(goal)+'</h3><p>'+esc(intent)+' · '+esc(bikeTitle)+(shoe?' · '+esc(shoe.name||shoe.label||shoe.model):'')+'</p></div>'+
      '</div>'+
      '<div class="race-self-dock">'+
        '<div class="race-self-tabs" role="tablist" aria-label="Race Self menu">'+
          '<button type="button" data-self-tab="self" class="on">Self</button>'+
          '<button type="button" data-self-tab="gear">Gear</button>'+
          '<button type="button" data-self-tab="bike">Bike</button>'+
          '<button type="button" data-self-tab="kit">Kit</button>'+
          '<button type="button" data-self-tab="races">Races</button>'+
          '<button type="button" data-self-tab="cards">Cards</button>'+
          '<button type="button" data-self-tab="garage">Garage</button>'+
          '<button type="button" data-self-tab="world">World</button>'+
          '<button type="button" data-self-tab="settings">Settings</button>'+
        '</div>'+
        '<div class="race-self-pane" data-self-pane>'+
          '<div class="race-self-profile">'+
            '<div><small>ACCENT</small><div class="race-self-swatches">'+AVATARS.map(c=>'<button type="button" data-avatar="'+c+'" style="--swatch:'+c+'" aria-label="Avatar accent '+c+'"'+(c===accent?' class="on"':'')+'></button>').join('')+'</div></div>'+
            '<div><small>COLLECTION</small><b>'+summary.total+' items</b></div>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</section>';

  let stageApi=null;
  const mountStage=()=>window.__mountRaceSelfStage?.(root.querySelector('[data-race-self-stage]'),{accent,bike,shoe}).then?.(api=>{stageApi=api});
  if(window.__mountRaceSelfStage) mountStage();
  else {
    const script=document.createElement('script');
    script.src='app/race-self-stage.js';
    script.onload=mountStage;
    script.onerror=()=>{};
    document.body.append(script);
  }

  const pane=root.querySelector('[data-self-pane]');
  const show=(tab)=>{
    root.querySelectorAll('[data-self-tab]').forEach(x=>x.classList.toggle('on',x.dataset.selfTab===tab));
    if(tab==='self'){
      pane.innerHTML='<div class="race-self-profile"><div><small>ACCENT</small><div class="race-self-swatches">'+AVATARS.map(c=>'<button type="button" data-avatar="'+c+'" style="--swatch:'+c+'" aria-label="Avatar accent '+c+'"'+(c===profile?.get?.().avatar?' class="on"':'')+'></button>').join('')+'</div></div><div><small>COLLECTION</small><b>'+summary.total+' items</b></div></div>';
      wireSwatches();
    } else if(tab==='gear'){
      pane.innerHTML='<div class="race-self-mini-grid"><article><small>BIKE</small><b>'+esc(bikeTitle)+'</b></article><article><small>SHOES</small><b>'+esc(shoe?.name||shoe?.label||shoe?.model||'Choose later')+'</b></article></div>';
    } else if(tab==='bike'){
      location.href=studioHref;
    } else if(tab==='kit'){
      pane.innerHTML='<div class="race-self-mini-grid"><article><small>KIT</small><b>Race kit slots</b><span>Helmet, trisuit, watch, wetsuit and nutrition follow the RaceSetup contract.</span></article></div>';
    } else if(tab==='races'){
      const host=document.createElement('div');
      pane.replaceChildren(host);
      renderRacePicker(host,{onChange:()=>{}});
    } else if(tab==='cards'){
      openCollection?.();
    } else if(tab==='garage'){
      openGarage?.();
    } else if(tab==='world'){
      openMuseum?.();
    } else if(tab==='settings'){
      settings?.open?.();
    }
  };
  const wireSwatches=()=>root.querySelectorAll('[data-avatar]').forEach(btn=>btn.addEventListener('click',()=>{
    profile?.set?.({avatar:btn.dataset.avatar});
    stageApi?.setAccent?.(btn.dataset.avatar);
    root.querySelectorAll('[data-avatar]').forEach(x=>x.classList.toggle('on',x===btn));
  }));
  wireSwatches();
  root.querySelectorAll('[data-self-tab]').forEach(btn=>btn.addEventListener('click',()=>show(btn.dataset.selfTab)));
}
