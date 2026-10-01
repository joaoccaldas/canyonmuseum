// ui/avatar-home.js — immersive Race Self surface.
// Race Self is personal depth inside the app, never a second navigation authority.
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

export async function renderAvatarHome(root,{profile,settings,onBack}={}){
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
  const studioHref='Studio.html?from=race-self'+(bike?'&p='+encodeURIComponent(bike.id):'');
  const raceCount=(snapshot.race_history||[]).length;

  root.innerHTML=
    '<section class="race-self-experience">'+
      '<div class="race-self-stage-wrap">'+
        '<canvas class="race-self-stage" data-race-self-stage aria-label="Interactive 3D Race Self"></canvas>'+
        '<button type="button" class="race-self-back" data-race-self-back aria-label="Back to Home">←</button>'+
        '<div class="race-self-identity"><small>YOUR RACE SELF</small><h2>'+esc(goal)+'</h2><p>'+esc(intent)+' · '+esc(bikeTitle)+' · '+esc(shoeTitle)+'</p></div>'+
      '</div>'+
      '<nav class="race-self-controls" aria-label="Race Self controls">'+
        '<button type="button" data-race-self-action="customize"><i>●</i><span><b>Avatar</b><small>Voxel figure</small></span></button>'+
        '<a href="'+studioHref+'"><i>△</i><span><b>Bike</b><small>Choose in 3D</small></span></a>'+
        '<button type="button" data-race-self-action="races"><i>◉</i><span><b>Races</b><small>'+raceCount+' badges</small></span></button>'+
        '<button type="button" data-race-self-action="gear"><i>＋</i><span><b>More gear</b><small>Coming soon</small></span></button>'+
        '<button type="button" data-race-self-action="settings"><i>⚙</i><span><b>Settings</b><small>'+(summary.total||0)+' collected</small></span></button>'+
      '</nav>'+
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

  root.querySelector('[data-race-self-back]')?.addEventListener('click',()=>onBack?.());

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
    drawerKicker.textContent='VOXEL SELF';drawerTitle.textContent='Build your figure';
    drawerBody.innerHTML='<div class="hub-self-grid avatar-builder">'+
      optionRow('skin',AVATAR_OPTIONS.skin)+
      optionRow('hair',AVATAR_OPTIONS.hair)+
      optionRow('top',AVATAR_OPTIONS.top)+
      optionRow('bottoms',AVATAR_OPTIONS.bottoms)+
      optionRow('shoes',AVATAR_OPTIONS.shoes)+
      optionRow('accessory',AVATAR_OPTIONS.accessory)+
      '<section><small>ACCENT</small><div class="hub-swatches">'+AVATARS.map(c=>'<button type="button" data-avatar="'+c+'" style="--swatch:'+c+'" aria-label="Avatar accent '+c+'"'+(c===profile?.get?.().avatar?' class="on"':'')+'></button>').join('')+'</div></section>'+
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
      profile.set({avatar:nextAccent,avatarStyle});
      stageApi?.setAvatarStyle?.(avatarStyle);
      drawerBody.querySelectorAll('[data-avatar]').forEach(x=>x.classList.toggle('on',x===btn));
    }));
  };

  const showRaces=()=>{
    drawerKicker.textContent='RACES';drawerTitle.textContent='Your race cards';
    const host=document.createElement('div');
    drawerBody.replaceChildren(host);
    renderRacePicker(host,{onChange:()=>{}});
    drawer.hidden=false;
  };

  root.querySelector('[data-race-self-action="customize"]')?.addEventListener('click',showSelf);
  root.querySelector('[data-race-self-action="races"]')?.addEventListener('click',showRaces);
  root.querySelector('[data-race-self-action="gear"]')?.addEventListener('click',()=>{
    drawerKicker.textContent='GEAR LAB';drawerTitle.textContent='The rest of your race kit';
    drawerBody.innerHTML='<div class="gear-coming-grid"><article><b>Helmet</b><span>Coming soon</span></article><article><b>Shoes</b><span>Coming soon</span></article><article><b>Race kit</b><span>Coming soon</span></article><article><b>Wetsuit</b><span>Coming soon</span></article></div><p class="gear-coming-note">These will use the same 3D choose-and-equip flow as the bike, not a separate gear system.</p>';
    drawer.hidden=false;
  });
  root.querySelector('[data-race-self-action="settings"]')?.addEventListener('click',()=>settings?.open?.());
}
