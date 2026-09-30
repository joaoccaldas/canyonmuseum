// ui/avatar-home.js — game-style personal hub.
// Canonical state stays in RaceIdentity/UserEquipment/RaceHistory/Progression.
// This surface is a launcher + personal 3D projection, not a second state store.
import { readGameState } from '../engine/game-state.js';
import { collectionSummary } from '../engine/items.js';
import { getPublicProduct } from '../engine/catalog.js';
import { AVATARS } from '../engine/profile.js';
import { renderRacePicker } from './race-cards.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const productId=id=>String(id||'').replace(/^product:/,'');

async function equipped(snapshot,equipmentId){
  const row=(snapshot.user_equipment||[]).find(x=>x.id===equipmentId);
  if(!row?.product_id)return null;
  return getPublicProduct(productId(row.product_id));
}

const tile=(id,icon,title,note,{href='',accent='ocean'}={})=>
  href
    ? '<a class="hub-tile '+accent+'" href="'+href+'" data-hub="'+id+'"><i>'+icon+'</i><b>'+title+'</b><span>'+note+'</span></a>'
    : '<button type="button" class="hub-tile '+accent+'" data-hub="'+id+'"><i>'+icon+'</i><b>'+title+'</b><span>'+note+'</span></button>';

export async function renderAvatarHome(root,{profile,settings,openMuseum,openGarage,openPlan,openCollection,openDiscover}={}){
  const snapshot=readGameState();
  const identity=snapshot.race_identity||{};
  const summary=collectionSummary(snapshot);
  const [bike,shoe]=await Promise.all([equipped(snapshot,identity.setup?.bike),equipped(snapshot,identity.setup?.shoe)]);
  const p=profile?.get?.()||{};
  const accent=p.avatar||AVATARS[0];
  const goal=identity.goal?.label||'Build your Kona';
  const intent=String(identity.intent||identity.mode||'exploring').replace(/[-_]+/g,' ');
  const bikeTitle=bike?[bike.brand,bike.name||bike.label||bike.model].filter(Boolean).join(' '):'Choose a bike';
  const shoeTitle=shoe?.name||shoe?.label||shoe?.model||'Choose shoes';
  const studioHref=bike?'Studio.html?p='+encodeURIComponent(bike.id)+'#setup':'Studio.html#setup';
  const raceCount=(snapshot.race_history||[]).length;
  const itemCount=summary.total||0;

  root.innerHTML=
    '<section class="player-hub">'+
      '<header class="hub-topbar">'+
        '<div class="hub-player"><i style="--avatar:'+esc(accent)+'"></i><div><small>RACE SELF</small><b>'+esc(p.name||'Player')+'</b></div></div>'+
        '<div class="hub-stats"><span><small>ITEMS</small><b>'+itemCount+'</b></span><span><small>RACES</small><b>'+raceCount+'</b></span></div>'+
        '<button type="button" class="hub-settings" data-hub="settings" aria-label="Settings">⚙</button>'+
      '</header>'+
      '<div class="hub-stage-wrap">'+
        '<canvas class="hub-stage" data-race-self-stage aria-label="Interactive 3D Race Self hub"></canvas>'+
        '<div class="hub-stage-copy"><small>'+esc(intent)+'</small><h2>'+esc(goal)+'</h2><p>'+esc(bikeTitle)+' · '+esc(shoeTitle)+'</p></div>'+
      '</div>'+
      '<section class="hub-launcher" aria-label="KONA hub">'+
        tile('world','◎','3D World','Enter the Canyon Museum',{accent:'ocean'})+
        tile('bike','△','Bike Studio','Customize bike and setup',{href:studioHref,accent:'lava'})+
        tile('garage','▣','Garage','Your bikes and gear',{accent:'lime'})+
        tile('collection','✦','Collection','Items, cards and finds',{accent:'lilac'})+
        tile('races','◉','Races','Past and future badges',{accent:'hibiscus'})+
        tile('discover','⌁','Discover','Machines, people, stories',{accent:'ocean'})+
        tile('games','▶','Games','Experiences and challenges',{href:'Experiences.html',accent:'lava'})+
        tile('self','●','Self','Avatar and kit',{accent:'lime'})+
      '</section>'+
      '<section class="hub-drawer" data-hub-drawer hidden><div class="hub-drawer-head"><div><small data-hub-kicker>SELF</small><h3 data-hub-title>Your Race Self</h3></div><button type="button" data-hub-close aria-label="Close">×</button></div><div data-hub-body></div></section>'+
    '</section>';

  let stageApi=null;
  const mountStage=()=>{
    const result=window.__mountRaceSelfStage?.(root.querySelector('[data-race-self-stage]'),{accent,bike,shoe});
    if(result?.then) result.then(api=>{stageApi=api});
  };
  if(window.__mountRaceSelfStage) mountStage();
  else {
    const script=document.createElement('script');
    script.src='app/race-self-stage.js';
    script.onload=mountStage;
    script.onerror=()=>{};
    document.body.append(script);
  }

  const drawer=root.querySelector('[data-hub-drawer]');
  const drawerBody=root.querySelector('[data-hub-body]');
  const drawerTitle=root.querySelector('[data-hub-title]');
  const drawerKicker=root.querySelector('[data-hub-kicker]');
  const closeDrawer=()=>{drawer.hidden=true;drawerBody.replaceChildren();};
  root.querySelector('[data-hub-close]')?.addEventListener('click',closeDrawer);

  const showSelf=()=>{
    drawerKicker.textContent='SELF';drawerTitle.textContent='Avatar & kit';
    drawerBody.innerHTML=
      '<div class="hub-self-grid">'+
        '<section><small>ACCENT</small><div class="hub-swatches">'+AVATARS.map(c=>'<button type="button" data-avatar="'+c+'" style="--swatch:'+c+'" aria-label="Avatar accent '+c+'"'+(c===profile?.get?.().avatar?' class="on"':'')+'></button>').join('')+'</div></section>'+
        '<section><small>GEAR</small><b>'+esc(bikeTitle)+'</b><span>'+esc(shoeTitle)+'</span></section>'+
      '</div>';
    drawer.hidden=false;
    drawerBody.querySelectorAll('[data-avatar]').forEach(btn=>btn.addEventListener('click',()=>{
      profile?.set?.({avatar:btn.dataset.avatar});
      stageApi?.setAccent?.(btn.dataset.avatar);
      drawerBody.querySelectorAll('[data-avatar]').forEach(x=>x.classList.toggle('on',x===btn));
      const marker=root.querySelector('.hub-player i'); if(marker) marker.style.setProperty('--avatar',btn.dataset.avatar);
    }));
  };
  const showRaces=()=>{
    drawerKicker.textContent='RACES';drawerTitle.textContent='Your race cards';
    const host=document.createElement('div');drawerBody.replaceChildren(host);renderRacePicker(host,{onChange:()=>{}});drawer.hidden=false;
  };

  root.querySelectorAll('[data-hub]').forEach(el=>el.addEventListener('click',e=>{
    if(el.tagName==='A') return;
    const id=el.dataset.hub;
    if(id==='world') openMuseum?.();
    else if(id==='garage') openGarage?.();
    else if(id==='collection') openCollection?.();
    else if(id==='races') showRaces();
    else if(id==='discover') openDiscover?.();
    else if(id==='self') showSelf();
    else if(id==='settings') settings?.open?.();
  }));
}
