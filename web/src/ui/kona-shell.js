// ui/kona-shell.js — mobile-first app shell over the existing 3D museum.
// Navigation/utility only. The 3D renderer remains the existing proven museum runtime.
import { applyBrandMode } from '../brand/runtime.js';
import { renderGarageSurface } from './garage.js';
import { renderHomeSurface } from './home.js';
import { renderAvatarHome } from './avatar-home.js';
import { renderCollectionSurface } from './collection.js';
import { renderDiscoverSurface } from './discover.js';
import { renderPlanSurface } from './plan.js';

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
    '<button type="button" class="kona-user-menu" data-user-studio aria-label="Open User Studio"><i></i><span>Me</span></button>'+
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
  const setActive=id=>shell.querySelectorAll('[data-tab]').forEach(x=>(x.classList.toggle('on',x.dataset.tab===id),x.setAttribute('aria-current',x.dataset.tab===id?'page':'false')));
  let disposeStudio=null, studioRequest=0;
  const leaveRaceSelf=()=>{studioRequest++;disposeStudio?.();disposeStudio=null;document.body.classList.remove('race-self-open');};
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
  }

  async function raceSelf(){
    leaveRaceSelf();
    const request=studioRequest;
    title.textContent='User Studio'; eyebrow.textContent='KONA · YOUR ATHLETE';
    panel.hidden=false;document.body.classList.add('kona-panel-open','race-self-open');setActive('me');
    const cleanup=await renderAvatarHome(body,{
      profile,
      settings,
      onBack:now,
      openGarage:garage,
      openDiscover:explore,
      openPlan:plan,
      isCurrent:()=>request===studioRequest,
      openMuseum:()=>{ close(); enter?.(); },
      openCollection:collection,
    });
    if(request===studioRequest) disposeStudio=cleanup; else cleanup?.();
  }

  async function collection(){
    leaveRaceSelf();
    title.textContent='Collection'; eyebrow.textContent='KONA · CARDS & ITEMS';
    panel.hidden=false;document.body.classList.add('kona-panel-open');setActive('');
    await renderCollectionSurface(body);
  }

  async function garage(){
    leaveRaceSelf();
    title.textContent='Garage'; eyebrow.textContent='KONA · YOUR EQUIPMENT';
    panel.hidden=false;document.body.classList.add('kona-panel-open');setActive('garage');
    await renderGarageSurface(body);
  }

  function plan(){
    leaveRaceSelf();
    title.textContent='Plan'; eyebrow.textContent='KONA · SOURCE-GROUNDED';
    renderPlanSurface(body,{data:window.__ENTRY_DATA || { event:facts().event }});
    panel.hidden=false;document.body.classList.add('kona-panel-open');setActive('plan');
  }

  async function me(){
    await raceSelf();
    setActive('me');
  }

  function walkTo(id){
    close();
    const go=window.__museumGo;
    if(go){ go(id); return; }
    enter?.(id);
  }
  async function explore(){
    leaveRaceSelf();
    title.textContent='Discover'; eyebrow.textContent='KONA · INTERESTING THINGS';
    panel.hidden=false;document.body.classList.add('kona-panel-open');setActive('discover');
    await renderDiscoverSurface(body,{enter:()=>{close();enter?.();}});
  }

  shell.querySelector('[data-tab=home]').onclick=raceSelf;
  shell.querySelector('[data-tab=discover]').onclick=explore;
  shell.querySelector('[data-tab=garage]').onclick=garage;
  shell.querySelector('[data-tab=plan]').onclick=plan;
  shell.querySelector('[data-tab=me]').onclick=me;
  shell.querySelector('[data-user-studio]').onclick=me;
  addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.defaultPrevented&&!panel.hidden&&document.body.classList.contains('museum-open'))close();});

  const userMenu=shell.querySelector('[data-user-studio]');
  const syncUserMenu=p=>{
    applyBrandMode(p?.appearance||'auto');
    if(userMenu){
      userMenu.style.setProperty('--user-accent',p?.avatar||'#e8471c');
      userMenu.querySelector('span').textContent=(p?.name||'Me').trim().split(/\s+/)[0].slice(0,12)||'Me';
    }
  };
  syncUserMenu(profile?.get?.()); profile?.subscribe?.(syncUserMenu);
  return { now, raceSelf, garage, plan, me, explore, collection, close };
}
