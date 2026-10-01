// ui/home.js — calm daily/personal Home. No Three.js or world runtime.
// Home is the shell's navigation surface. Race Self is a deep experience entered explicitly.
import { readGameState } from '../engine/game-state.js';
import { collectionSummary } from '../engine/items.js';
import { AVATAR_COLORS, normaliseAvatarStyle } from '../engine/avatar.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate=iso=>{try{return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric'}).format(new Date(iso+'T12:00:00'))}catch(_){return iso}};
const daysUntil=iso=>{const n=Math.ceil((new Date(iso+'T12:00:00')-Date.now())/86400000);return Number.isFinite(n)?Math.max(0,n):null};

function avatarPreview(){
  return '<div class="home-avatar" data-home-avatar>'+
    '<i class="ha-hair"></i><i class="ha-head"></i><i class="ha-body"></i><i class="ha-arm l"></i><i class="ha-arm r"></i><i class="ha-leg l"></i><i class="ha-leg r"></i><i class="ha-shoe l"></i><i class="ha-shoe r"></i>'+
  '</div>';
}

export function renderHomeSurface(root,{event={},profile,openRaceSelf,openGarage,openDiscover,openPlan}={}){
  const snapshot=readGameState();
  const identity=snapshot.race_identity||{};
  const collection=collectionSummary(snapshot);
  const raceDays=event.date?daysUntil(event.date):null;
  const headline=raceDays==null?'Today.':raceDays===0?'Race day.':raceDays===1?'1 day.':raceDays+' days.';
  const note=raceDays==null?'Something worth doing today.':raceDays>30?'Plenty of time. One useful choice is enough.':'Something worth doing today.';
  const style=profile?.get?.().avatarStyle;
  const goal=identity.goal?.label||identity.goal||'Build the version of you that shows up.';
  const races=Array.isArray(snapshot.race_history)?snapshot.race_history.length:0;

  root.innerHTML=
    '<section class="kona-hero-card artifact artifact--hero home-today">'+
      '<small>'+esc(event.name||'KONA · TODAY')+'</small>'+
      '<h3>'+esc(headline)+'</h3><p>'+esc(note)+'</p>'+
      '<button class="kona-primary" type="button" data-home-plan>What matters next <span>→</span></button>'+
    '</section>'+
    '<section class="home-race-self artifact artifact--label">'+
      '<div class="home-race-self-visual">'+avatarPreview()+'</div>'+
      '<div class="home-race-self-copy"><small>YOUR RACE SELF</small><h3>'+esc(goal)+'</h3>'+
        '<p>'+collection.total+' collected · '+races+' race'+(races===1?'':'s')+'</p>'+
        '<div class="home-race-self-actions"><button type="button" class="kona-primary" data-home-self>Open Race Self <span>→</span></button><button type="button" class="kona-link-btn" data-home-garage>Your setup</button></div>'+
      '</div>'+
    '</section>'+
    '<section class="home-postcard artifact artifact--photo">'+
      '<div class="home-postcard-photo" aria-hidden="true"><img src="assets/kona-years/queen-k.jpg" alt="" loading="lazy" decoding="async"></div>'+
      '<div class="home-postcard-copy"><small>KAILUA-KONA · HAWAIʻI</small><h3>Not just a race.</h3><p>Roads, lava, people, machines and strange little details worth finding.</p><button type="button" class="kona-link-btn" data-home-discover>Discover something →</button></div>'+
    '</section>';

  const avatar=root.querySelector('[data-home-avatar]');
  if(avatar){
    const s=normaliseAvatarStyle(style);
    avatar.style.setProperty('--skin',AVATAR_COLORS.skin[s.skin]);
    avatar.style.setProperty('--hair',AVATAR_COLORS.hair[s.hair]);
    avatar.style.setProperty('--top',AVATAR_COLORS.top[s.top]);
    avatar.style.setProperty('--bottoms',AVATAR_COLORS.bottoms[s.bottoms]);
    avatar.style.setProperty('--shoes',AVATAR_COLORS.shoes[s.shoes]);
  }
  root.querySelector('[data-home-self]')?.addEventListener('click',()=>openRaceSelf?.());
  root.querySelector('[data-home-garage]')?.addEventListener('click',()=>openGarage?.());
  root.querySelector('[data-home-discover]')?.addEventListener('click',()=>openDiscover?.());
  root.querySelector('[data-home-plan]')?.addEventListener('click',()=>openPlan?.());
}
