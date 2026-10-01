// ui/avatar-home.js — canonical User Studio surface.
// Both the persistent user menu and the Me tab enter this same game-style studio.
// Avatar building is a projection over engine/avatar.js; mobile and desktop share this exact UI.
import { readGameState } from '../engine/game-state.js';
import { collectionSummary } from '../engine/items.js';
import { getPublicProduct } from '../engine/catalog.js';
import { AVATARS } from '../engine/profile.js';
import {
  AVATAR_ARCHETYPES, AVATAR_ITEMS, AVATAR_SLOTS,
  avatarItem, normaliseAvatarStyle, patchAvatarItem, setAvatarArchetype,
} from '../engine/avatar.js';
import { renderRacePicker } from './race-cards.js';
import { renderPassportSurface } from './me.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const productId=id=>String(id||'').replace(/^product:/,'');

async function equipped(snapshot,equipmentId){
  const row=(snapshot.user_equipment||[]).find(x=>x.id===equipmentId);
  if(!row?.product_id)return null;
  return getPublicProduct(productId(row.product_id));
}
function readImage(file){
  if(!file||!/^image\/(png|jpeg|webp)$/i.test(file.type)||file.size>500000)return Promise.resolve(null);
  return new Promise(resolve=>{
    const r=new FileReader();
    r.onload=()=>resolve({src:String(r.result||''),name:file.name,opacity:1,updatedAt:new Date().toISOString()});
    r.onerror=()=>resolve(null);
    r.readAsDataURL(file);
  });
}

export async function renderAvatarHome(root,{profile,settings,onBack,openGarage}={}){
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
  const studioHref=bike?'Studio.html?p='+encodeURIComponent(bike.id):'Studio.html';
  const raceCount=(snapshot.race_history||[]).length;

  root.innerHTML=
    '<section class="race-self-experience">'+
      '<div class="race-self-stage-wrap">'+
        '<canvas class="race-self-stage" data-race-self-stage aria-label="Interactive 3D User Studio"></canvas>'+
        '<button type="button" class="race-self-back" data-race-self-back aria-label="Back to Home">←</button>'+
        '<div class="race-self-identity"><small>YOUR USER STUDIO</small><h2>'+esc(goal)+'</h2><p>'+esc(intent)+' · '+esc(bikeTitle)+' · '+esc(shoeTitle)+'</p></div>'+
      '</div>'+
      '<nav class="race-self-controls" aria-label="User Studio menu">'+
        '<button type="button" data-race-self-action="customize"><i>●</i><span><b>Avatar</b><small>Build character</small></span></button>'+
        '<a href="'+studioHref+'"><i>△</i><span><b>Bike</b><small>Choose in 3D</small></span></a>'+        '<button type="button" data-race-self-action="gear"><i>◇</i><span><b>Gear</b><small>Your equipment</small></span></button>'+
        '<button type="button" data-race-self-action="races"><i>◉</i><span><b>Races</b><small>'+raceCount+' badges</small></span></button>'+        '<button type="button" data-race-self-action="passport"><i>★</i><span><b>Passport</b><small>XP & badges</small></span></button>'+
        '<button type="button" data-race-self-action="settings"><i>⚙</i><span><b>Settings</b><small>'+(summary.total||0)+' collected</small></span></button>'+
      '</nav>'+
      '<section class="hub-drawer" data-hub-drawer hidden><div class="hub-drawer-head"><div><small data-hub-kicker>USER STUDIO</small><h3 data-hub-title>Your athlete</h3></div><button type="button" data-hub-close aria-label="Close">×</button></div><div data-hub-body></div></section>'+
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

  const commitStyle=next=>{
    avatarStyle=normaliseAvatarStyle(next);
    profile?.set?.({avatarStyle});
    stageApi?.setAvatarStyle?.(avatarStyle);
  };

  const showSelf=()=>{
    avatarStyle=normaliseAvatarStyle(profile?.get?.().avatarStyle);
    const archetypes=AVATAR_ARCHETYPES.map(a=>
      '<button type="button" class="avatar-archetype '+(avatarStyle.archetype===a.id?'on':'')+'" data-avatar-archetype="'+a.id+'">'+
      '<b>'+esc(a.label)+'</b><span>'+esc(a.note)+'</span></button>'
    ).join('');
    const rows=AVATAR_SLOTS.map(slot=>{
      const selected=avatarItem(avatarStyle,slot);
      const options=(AVATAR_ITEMS[slot]||[]).map(item=>
        '<button type="button" data-avatar-item="'+slot+':'+item.id+'" class="'+(selected.id===item.id?'on':'')+'" style="--slot-color:'+(item.color||'#777')+'"><i></i><span>'+esc(item.label)+'</span></button>'
      ).join('');
      const overlay=avatarStyle.items[slot]?.overlay;
      return '<section class="avatar-slot" data-avatar-slot-card="'+slot+'">'+
        '<div class="avatar-slot-title"><small>'+slot.toUpperCase()+'</small><span>'+esc(selected.label||selected.id)+'</span></div>'+
        '<div class="avatar-options">'+options+'</div>'+
        '<div class="avatar-item-tools">'+
          '<label><span>Custom color</span><input type="color" data-avatar-color="'+slot+'" value="'+esc(selected.color||'#777777')+'"></label>'+
          '<label class="avatar-upload"><span>'+(overlay?'Replace image':'Add image')+'</span><input type="file" accept="image/png,image/jpeg,image/webp" data-avatar-overlay="'+slot+'"></label>'+
          (overlay?'<button type="button" data-avatar-overlay-remove="'+slot+'">Remove image</button>':'')+
        '</div>'+
      '</section>';
    }).join('');

    drawerKicker.textContent='AVATAR STUDIO';drawerTitle.textContent='Build your character';
    drawerBody.innerHTML=
      '<div class="avatar-builder">'+
        '<section class="avatar-archetypes"><small>CHARACTER</small><div class="avatar-archetype-grid">'+archetypes+'</div></section>'+
        rows+
        '<section class="avatar-accent"><small>ACCENT</small><div class="hub-swatches">'+AVATARS.map(c=>'<button type="button" data-avatar="'+c+'" style="--swatch:'+c+'" aria-label="Avatar accent '+c+'"'+(c===profile?.get?.().avatar?' class="on"':'')+'></button>').join('')+'</div></section>'+
        '<p class="avatar-builder-note">PNG, JPEG or WebP overlays are stored with your local avatar profile. Maximum 500 KB per image.</p>'+
      '</div>';
    drawer.hidden=false;

    drawerBody.querySelectorAll('[data-avatar-archetype]').forEach(btn=>btn.addEventListener('click',()=>{
      commitStyle(setAvatarArchetype(avatarStyle,btn.dataset.avatarArchetype));
      showSelf();
    }));
    drawerBody.querySelectorAll('[data-avatar-item]').forEach(btn=>btn.addEventListener('click',()=>{
      const [slot,id]=btn.dataset.avatarItem.split(':');
      commitStyle(patchAvatarItem(avatarStyle,slot,{id}));
      showSelf();
    }));
    drawerBody.querySelectorAll('[data-avatar-color]').forEach(input=>input.addEventListener('input',()=>{
      commitStyle(patchAvatarItem(avatarStyle,input.dataset.avatarColor,{color:input.value}));
    }));
    drawerBody.querySelectorAll('[data-avatar-overlay]').forEach(input=>input.addEventListener('change',async()=>{
      const overlay=await readImage(input.files?.[0]);
      if(!overlay)return;
      commitStyle(patchAvatarItem(avatarStyle,input.dataset.avatarOverlay,{overlay}));
      showSelf();
    }));
    drawerBody.querySelectorAll('[data-avatar-overlay-remove]').forEach(btn=>btn.addEventListener('click',()=>{
      commitStyle(patchAvatarItem(avatarStyle,btn.dataset.avatarOverlayRemove,{overlay:null}));
      showSelf();
    }));
    drawerBody.querySelectorAll('[data-avatar]').forEach(btn=>btn.addEventListener('click',()=>{
      const nextAccent=btn.dataset.avatar;
      avatarStyle=normaliseAvatarStyle({...avatarStyle,accent:nextAccent});
      profile?.set?.({avatar:nextAccent,avatarStyle});
      stageApi?.setAvatarStyle?.(avatarStyle);
      drawerBody.querySelectorAll('[data-avatar]').forEach(x=>x.classList.toggle('on',x===btn));
    }));
  };

  const showRaces=()=>{
    drawerKicker.textContent='USER STUDIO · RACES';drawerTitle.textContent='Your race cards';
    const host=document.createElement('div');
    drawerBody.replaceChildren(host);
    renderRacePicker(host,{onChange:()=>{}});
    drawer.hidden=false;
  };

  const showPassport=async()=>{
    drawerKicker.textContent='USER STUDIO · PASSPORT';drawerTitle.textContent='Your progress';
    drawerBody.replaceChildren();
    await renderPassportSurface(drawerBody,{settings});
    drawer.hidden=false;
  };

  root.querySelector('[data-race-self-action="customize"]')?.addEventListener('click',showSelf);
  root.querySelector('[data-race-self-action="gear"]')?.addEventListener('click',()=>openGarage?.());
  root.querySelector('[data-race-self-action="races"]')?.addEventListener('click',showRaces);
  root.querySelector('[data-race-self-action="passport"]')?.addEventListener('click',showPassport);
  root.querySelector('[data-race-self-action="settings"]')?.addEventListener('click',()=>settings?.open?.());
}
