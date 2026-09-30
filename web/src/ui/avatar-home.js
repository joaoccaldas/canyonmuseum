// ui/avatar-home.js — game-style personal hub.
// Canonical state stays in RaceIdentity/UserEquipment/RaceHistory/Progression.
// This surface is a launcher + personal 3D projection, not a second state store.
import { readGameState } from '../engine/game-state.js';
import { collectionSummary } from '../engine/items.js';
import { getPublicProduct } from '../engine/catalog.js';
import { AVATARS } from '../engine/profile.js';
import { AVATAR_OPTIONS, AVATAR_COLORS, normaliseAvatarStyle } from '../engine/avatar.js';
import { renderRacePicker } from './race-cards.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const productId=id=>String(id||'').replace(/^product:/,'');

async function equipped(snapshot,equipmentId){
  const row=(snapshot.user_equipment||[]).find(x=>x.id===equipmentId);
  if(!row?.product_id)return null;
  return getPublicProduct(productId(row.product_id));
}

const tile=(id,title,note,{href='',accent='ocean',image='',featured=false,badge=''}={})=>{
  const cls='hub-tile '+accent+(featured?' featured':'');
  const media=image?'<span class="hub-tile-media"><img src="'+image+'" alt="" loading="lazy" decoding="async"></span>':'';
  const copy='<span class="hub-tile-copy">'+(badge?'<small>'+badge+'</small>':'')+'<b>'+title+'</b><em>'+note+'</em></span>';
  return href
    ? '<a class="'+cls+'" href="'+href+'" data-hub="'+id+'">'+media+copy+'</a>'
    : '<button type="button" class="'+cls+'" data-hub="'+id+'">'+media+copy+'</button>';
};

export async function renderAvatarHome(root,{profile,settings,openMuseum,openGarage,openPlan,openCollection,openDiscover}={}){
  const snapshot=readGameState();
  const identity=snapshot.race_identity||{};
  const summary=collectionSummary(snapshot);
  const [bike,shoe]=await Promise.all([equipped(snapshot,identity.setup?.bike),equipped(snapshot,identity.setup?.shoe)]);
  const p=profile?.get?.()||{};
  const accent=p.avatar||AVATARS[0];
  let avatarStyle=normaliseAvatarStyle({...p.avatarStyle,accent});
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
        tile('world','3D World','Enter the island',{accent:'ocean',image:'assets/share/museum.jpg',featured:true,badge:'EXPLORE'})+
        tile('bike','Bike Studio','Build your machine',{href:studioHref,accent:'lava',image:'assets/kona-years/cfr-2019.jpg',featured:true,badge:'CREATE'})+
        tile('garage','Garage','Bikes & gear',{accent:'lime',image:'assets/share/collection.jpg',badge:'YOURS'})+
        tile('collection','Collection','Cards & finds',{accent:'lilac',image:'assets/kona-years/queen-k.jpg',badge:itemCount+' ITEMS'})+
        tile('races','Races','Badges & history',{accent:'hibiscus',image:'assets/kona-years/lange-2024.jpg',badge:raceCount+' RACES'})+
        tile('discover','Discover','Kona & stories',{accent:'ocean',image:'assets/kona-years/kailua-bay.jpg',badge:'NEW'})+
        tile('games','Games','Challenges & experiences',{href:'Experiences.html',accent:'lava',image:'assets/kona-years/matthews-2025.jpg',badge:'PLAY'})+
        tile('self','Customize','Avatar & kit',{accent:'lime',image:'assets/kona-years/queen-k.jpg',badge:'SELF'})+
      '</section>'+
      '<section class="hub-drawer" data-hub-drawer hidden><div class="hub-drawer-head"><div><small data-hub-kicker>SELF</small><h3 data-hub-title>Your Race Self</h3></div><button type="button" data-hub-close aria-label="Close">×</button></div><div data-hub-body></div></section>'+
    '</section>';

  let stageApi=null;
  const mountStage=()=>{
    const result=window.__mountRaceSelfStage?.(root.querySelector('[data-race-self-stage]'),{accent,avatarStyle,bike,shoe});
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
    const style=normaliseAvatarStyle(profile?.get?.().avatarStyle);
    const optionRow=(slot,values)=>'<section class="avatar-slot"><small>'+slot.toUpperCase()+'</small><div class="avatar-options">'+values.map(v=>{
      const color=AVATAR_COLORS[slot]?.[v]||'#777';
      return '<button type="button" data-avatar-slot="'+slot+'" data-avatar-value="'+v+'" class="'+(style[slot]===v?'on':'')+'" style="--slot-color:'+color+'"><i></i><span>'+v.replace(/-/g,' ')+'</span></button>';
    }).join('')+'</div></section>';
    drawerKicker.textContent='SELF';drawerTitle.textContent='Customize your avatar';
    drawerBody.innerHTML=
      '<div class="hub-self-grid avatar-builder">'+
        optionRow('skin',AVATAR_OPTIONS.skin)+
        optionRow('hair',AVATAR_OPTIONS.hair)+
        optionRow('top',AVATAR_OPTIONS.top)+
        optionRow('bottoms',AVATAR_OPTIONS.bottoms)+
        optionRow('shoes',AVATAR_OPTIONS.shoes)+
        optionRow('accessory',AVATAR_OPTIONS.accessory)+
        '<section><small>ACCENT</small><div class="hub-swatches">'+AVATARS.map(c=>'<button type="button" data-avatar="'+c+'" style="--swatch:'+c+'" aria-label="Avatar accent '+c+'"'+(c===profile?.get?.().avatar?' class="on"':'')+'></button>').join('')+'</div></section>'+
        '<section><small>GEAR</small><b>'+esc(bikeTitle)+'</b><span>'+esc(shoeTitle)+'</span></section>'+
      '</div>';
    drawer.hidden=false;
    drawerBody.querySelectorAll('[data-avatar-slot]').forEach(btn=>btn.addEventListener('click',()=>{
      avatarStyle=normaliseAvatarStyle({...profile.get().avatarStyle,[btn.dataset.avatarSlot]:btn.dataset.avatarValue,accent:profile.get().avatar});
      profile.set({avatarStyle});
      drawerBody.querySelectorAll('[data-avatar-slot="'+btn.dataset.avatarSlot+'"]').forEach(x=>x.classList.toggle('on',x===btn));
      stageApi?.setAvatarStyle?.(avatarStyle);
    }));
    drawerBody.querySelectorAll('[data-avatar]').forEach(btn=>btn.addEventListener('click',()=>{
      const nextAccent=btn.dataset.avatar;
      avatarStyle=normaliseAvatarStyle({...profile.get().avatarStyle,accent:nextAccent});
      profile?.set?.({avatar:nextAccent,avatarStyle});
      stageApi?.setAvatarStyle?.(avatarStyle);
      drawerBody.querySelectorAll('[data-avatar]').forEach(x=>x.classList.toggle('on',x===btn));
      const marker=root.querySelector('.hub-player i'); if(marker) marker.style.setProperty('--avatar',nextAccent);
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
