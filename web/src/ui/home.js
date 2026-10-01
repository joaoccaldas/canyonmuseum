// ui/home.js — calm 2D Home. App-shell navigation authority lives here; Race Self is optional depth.
import { readGameState } from '../engine/game-state.js';
import { collectionSummary } from '../engine/items.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate=iso=>{try{return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric'}).format(new Date(iso+'T12:00:00'))}catch(_){return iso}};
const daysUntil=iso=>{const n=Math.ceil((new Date(iso+'T12:00:00')-Date.now())/86400000);return Number.isFinite(n)?Math.max(0,n):null};

export function renderHomeSurface(root,{event={},profile,openGarage,openDiscover,openRaceSelf,openPlan}={}){
  const snapshot=readGameState();
  const collection=collectionSummary(snapshot);
  const identity=snapshot.race_identity||{};
  const raceDays=event.date?daysUntil(event.date):null;
  const headline=raceDays==null?'Something worth doing today.':raceDays===0?'Today.':raceDays===1?'1 day.':raceDays+' days.';
  const note=raceDays==null?'Your Kona can stay small today.':'Plenty of time to panic later.';
  const p=profile?.get?.()||{};
  const accent=p.avatar||'#e8471c';
  const goal=identity.goal?.label||'Your Race Self is waiting.';
  const setupCount=Object.values(identity.setup||{}).filter(Boolean).length;

  root.innerHTML=
    '<section class="kona-home-hero artifact artifact--hero">'+
      '<small>'+esc(event.name||'KONA · TODAY')+'</small>'+
      '<h3>'+headline+'</h3><p>'+note+'</p>'+
      '<button class="kona-primary" type="button" data-home-plan>What matters next <span>→</span></button>'+
    '</section>'+
    '<section class="race-self-preview artifact artifact--photo">'+
      '<div class="race-self-preview-avatar" style="--avatar:'+esc(accent)+'" aria-hidden="true"><i class="head"></i><i class="body"></i><i class="leg a"></i><i class="leg b"></i></div>'+
      '<div class="race-self-preview-copy"><small>YOUR RACE SELF</small><h3>'+esc(goal)+'</h3><p>'+setupCount+' setup slots · '+(collection.total||0)+' collected</p><button type="button" data-home-raceself>Open Race Self <span>→</span></button></div>'+
    '</section>'+
    '<section class="kona-home-grid">'+
      '<button class="kona-home-card artifact artifact--label" type="button" data-home-garage><small>YOUR SETUP</small><b>Garage</b><span>Bike, shoes and things you actually care about.</span></button>'+
      '<button class="kona-home-card artifact artifact--label" type="button" data-home-discover><small>DISCOVER</small><b>Something unexpected</b><span>Machines, people, stories and places.</span></button>'+
    '</section>';

  root.querySelector('[data-home-plan]')?.addEventListener('click',()=>openPlan?.());
  root.querySelector('[data-home-raceself]')?.addEventListener('click',()=>openRaceSelf?.());
  root.querySelector('[data-home-garage]')?.addEventListener('click',()=>openGarage?.());
  root.querySelector('[data-home-discover]')?.addEventListener('click',()=>openDiscover?.());
}
