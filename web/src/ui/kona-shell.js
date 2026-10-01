// ui/kona-shell.js — mobile-first app shell over the existing 3D museum.
// Navigation/utility only. The 3D renderer remains the existing proven museum runtime.
import { applyBrandMode } from '../brand/runtime.js';
import { readStorage, writeStorage } from '../engine/storage.js';
import { renderGarageSurface } from './garage.js';
import { renderHomeSurface } from './home.js';
import { renderAvatarHome } from './avatar-home.js';
import { renderCollectionSurface } from './collection.js';
import { renderDiscoverSurface } from './discover.js';
import { renderPlanSurface } from './plan.js';
import { renderMeSurface } from './me.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = name => {
  const d={
    now:'M3 11.5 12 4l9 7.5v8.5a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    explore:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm3.7 5.3-2.1 5.3-5.3 2.1 2.1-5.3z',
    setup:'M4 7.2 12 3l8 4.2v9.6L12 21l-8-4.2zm8-1.9-5.2 2.7L12 10.7 17.2 8zm-6 4.4v5.9l5 2.6v-5.9zm12 0-5 2.6v5.9l5-2.6z',
    plan:'M6 2v3m12-3v3M4 8h16M5 4h14a1 1 0 0 1 1 1v15H4V5a1 1 0 0 1 1-1z',
    me:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0'
  }[name];
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+d+'"/></svg>';
};

export function initKonaShell({ profile, settings, enter }) {
  const facts = () => ({
    event: window.__ENTRY_EVENT || window.__ENTRY_DATA?.event || {},
  });
  const shell=document.createElement('div'); shell.id='konaShell';
  shell.innerHTML=
    '<div id="konaPanel" class="kona-panel" hidden>'+
      '<div class="kona-panel-head"><div><small id="konaPanelEyebrow">KONA · BETA</small><h2 id="konaPanelTitle">Now</h2></div><button id="konaPanelClose" type="button" aria-label="Close">×</button></div>'+
      '<div id="konaPanelBody" class="kona-panel-body"></div>'+
    '</div>'+
    '<nav class="kona-bottom-nav" aria-label="Main navigation">'+
      '<button type="button" data-tab="home">'+icon('now')+'<span>Home</span></button>'+
      '<button type="button" data-tab="discover">'+icon('explore')+'<span>Discover</span></button>'+
      '<button type="button" data-tab="garage">'+icon('setup')+'<span>Garage</span></button>'+
      '<button type="button" data-tab="plan">'+icon('plan')+'<span>Plan</span></button>'+
      '<button type="button" data-tab="me">'+icon('me')+'<span>Me</span></button>'+
    '</nav>';
  document.body.append(shell);

  const panel=shell.querySelector('#konaPanel'), body=shell.querySelector('#konaPanelBody'), title=shell.querySelector('#konaPanelTitle'), eyebrow=shell.querySelector('#konaPanelEyebrow');
  const setActive=id=>shell.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('on',x.dataset.tab===id));
  const leaveRaceSelf=()=>document.body.classList.remove('race-self-open');
  let tourStarted=false, dismissTour=null;
  function maybeStartTour(){
    if(tourStarted) return;
    try { if(readStorage('onboarding')==='done') return; } catch (_) {}
    tourStarted=true;
    const steps=[
      {target:'[data-home-self]',kicker:'1 · MAKE IT YOURS',title:'Start with your Race Self',copy:'Build the voxel version of you, then connect the bike and gear you actually care about.'},
      {target:'[data-tab=discover]',kicker:'2 · LEARN KONA',title:'Discover the island',copy:'Use Discover for places, stories and race-week details. The immersive 3D world stays optional until you want it.'},
      {target:'[data-tab=garage]',kicker:'3 · BUILD THE SETUP',title:'Your gear lives here',copy:'Choose your bike in 3D now. Helmet, shoes, kit and more are being added next.'},
      {target:'[data-tab=plan]',kicker:'4 · MAKE IT USEFUL',title:'Turn curiosity into a plan',copy:'Plan keeps the practical race-week layer close when you need it.'}
    ];
    const card=document.createElement('aside'); card.className='kona-tour'; card.setAttribute('role','dialog'); card.setAttribute('aria-label','KONA quick tour');
    document.body.append(card);
    let i=0, active=null;
    const finish=()=>{active?.classList.remove('tour-target');card.remove();dismissTour=null;try{writeStorage('onboarding','done')}catch(_){}};
    dismissTour=finish;
    const paint=()=>{
      active?.classList.remove('tour-target');
      const step=steps[i]; active=document.querySelector(step.target); active?.classList.add('tour-target');
      card.innerHTML='<small>'+step.kicker+'</small><h3>'+step.title+'</h3><p>'+step.copy+'</p><div><button type="button" data-tour-skip>Skip</button><button type="button" data-tour-next>'+(i===steps.length-1?'Start exploring':'Next')+' <span>→</span></button></div>';
      card.querySelector('[data-tour-skip]').onclick=finish;
      card.querySelector('[data-tour-next]').onclick=()=>{ if(i===steps.length-1) finish(); else {i+=1;paint();} };
      active?.scrollIntoView?.({block:'center',behavior:'smooth'});
    };
    paint();
  }
  const close=()=>{leaveRaceSelf();panel.hidden=true;document.body.classList.remove('kona-panel-open');setActive(document.body.classList.contains('walking')?'explore':'');};
  shell.querySelector('#konaPanelClose').onclick=close;

  function now(){
    leaveRaceSelf();
    title.textContent='Home'; eyebrow.textContent='KONA · TODAY';
    panel.hidden=false;document.body.classList.add('kona-panel-open');setActive('home');
    renderHomeSurface(body,{
      event:facts().event,
      profile,
      openRaceSelf:raceSelf,
      openGarage:garage,
      openDiscover:explore,
      openPlan:plan,
    });
    requestAnimationFrame(()=>requestAnimationFrame(maybeStartTour));
  }

  async function raceSelf(){
    dismissTour?.();
    title.textContent='Race Self'; eyebrow.textContent='KONA · YOUR SELF';
    panel.hidden=false;document.body.classList.add('kona-panel-open','race-self-open');setActive('home');
    await renderAvatarHome(body,{
      profile,
      settings,
      onBack:now,
      openMuseum:()=>{ close(); enter?.(); },
      openCollection:collection,
    });
  }

  async function collection(){
    leaveRaceSelf();
    title.textContent='Collection'; eyebrow.textContent='KONA · CARDS & ITEMS';
    panel.hidden=false;document.body.classList.add('kona-panel-open');setActive('');
    await renderCollectionSurface(body);
  }

  async function garage(){
    dismissTour?.();
    leaveRaceSelf();
    title.textContent='Garage'; eyebrow.textContent='KONA · YOUR EQUIPMENT';
    panel.hidden=false;document.body.classList.add('kona-panel-open');setActive('garage');
    await renderGarageSurface(body);
  }

  function plan(){
    dismissTour?.();
    leaveRaceSelf();
    title.textContent='Plan'; eyebrow.textContent='KONA · SOURCE-GROUNDED';
    renderPlanSurface(body,{data:window.__ENTRY_DATA || { event:facts().event }});
    panel.hidden=false;document.body.classList.add('kona-panel-open');setActive('plan');
  }

  async function me(){
    dismissTour?.();
    leaveRaceSelf();
    title.textContent='Me'; eyebrow.textContent='KONA · PASSPORT';
    panel.hidden=false;document.body.classList.add('kona-panel-open');setActive('me');
    await renderMeSurface(body,{settings});
  }

  function walkTo(id){
    close();
    const go=window.__museumGo;
    if(go){ go(id); return; }
    enter?.(id);
  }
  async function explore(){
    dismissTour?.();
    leaveRaceSelf();
    title.textContent='Discover'; eyebrow.textContent='KONA · INTERESTING THINGS';
    panel.hidden=false;document.body.classList.add('kona-panel-open');setActive('discover');
    await renderDiscoverSurface(body,{enter:()=>{close();enter?.();}});
  }

  shell.querySelector('[data-tab=home]').onclick=now;
  shell.querySelector('[data-tab=discover]').onclick=explore;
  shell.querySelector('[data-tab=garage]').onclick=garage;
  shell.querySelector('[data-tab=plan]').onclick=plan;
  shell.querySelector('[data-tab=me]').onclick=me;
  addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)close();});

  const applyTheme=p=>applyBrandMode(p?.appearance||'auto');
  applyTheme(profile?.get?.()); profile?.subscribe?.(applyTheme);
  return { now, raceSelf, garage, plan, me, explore, collection, close };
}
