// ui/kona-shell.js — mobile-first app shell over the existing 3D museum.
// Navigation/utility only. The 3D renderer remains the existing proven museum runtime.
import { readGameState, gameProgress } from '../engine/game-state.js';
import { ensureProgression } from '../engine/progression.js';
import { consumeAuthCallback, sendMagicLink, currentUser, signOut, backupGameState, restoreGameState, cloudAvailable } from '../cloud/supabase-lite.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate = iso => { try { return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric'}).format(new Date(iso+'T12:00:00')); } catch (_) { return iso; } };
const daysUntil = iso => Math.max(0, Math.ceil((new Date(iso+'T12:00:00') - Date.now()) / 86400000));
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
  consumeAuthCallback();
  const facts = () => ({
    event: window.__EVENT?.current_facts?.event || window.__ISLAND?.race_2026 || {},
    week: window.__EVENT?.current_facts?.race_week || [],
    places: window.__ISLAND?.places || [],
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
      '<a href="Studio.html#setup" data-tab="garage">'+icon('setup')+'<span>Garage</span></a>'+
      '<button type="button" data-tab="plan">'+icon('plan')+'<span>Plan</span></button>'+
      '<button type="button" data-tab="me">'+icon('me')+'<span>Me</span></button>'+
    '</nav>';
  document.body.append(shell);

  const panel=shell.querySelector('#konaPanel'), body=shell.querySelector('#konaPanelBody'), title=shell.querySelector('#konaPanelTitle'), eyebrow=shell.querySelector('#konaPanelEyebrow');
  const setActive=id=>shell.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('on',x.dataset.tab===id));
  const close=()=>{panel.hidden=true;document.body.classList.remove('kona-panel-open');setActive(document.body.classList.contains('walking')?'explore':'');};
  shell.querySelector('#konaPanelClose').onclick=close;

  function now(){
    const { event, week, places } = facts();
    const raceDays=event.date ? daysUntil(event.date) : null;
    const nextExpo=week.find(x=>new Date(x.date+'T23:59:00')>=new Date()) || week[0];
    title.textContent='Now'; eyebrow.textContent='KONA · RACE WEEK';
    const expo=nextExpo ? '<article><i>Expo</i><div><b>'+esc(fmtDate(nextExpo.date))+' · '+esc(nextExpo.start)+'–'+esc(nextExpo.end)+'</b><span>'+esc(nextExpo.venue)+'</span></div></article>' : '';
    const placeCards=places.slice(0,4).map(p=>'<article><small>'+esc(p.region)+'</small><b>'+esc(p.name)+'</b><span>'+esc(p.purpose)+'</span></article>').join('');
    body.innerHTML=
      '<section class="kona-hero-card"><small>YOUR KONA · '+esc(event.location||'Kailua-Kona, Hawaiʻi')+'</small>'+
      '<h3>'+(raceDays==null?'Kona awaits':raceDays===0?'Race day':raceDays+' days to race day')+'</h3>'+
      '<p>'+(event.date?esc(fmtDate(event.date)):'2026')+' · '+esc(event.venue||'Kailua Pier')+'</p>'+
      '<button class="kona-primary" data-setup>Continue your setup <span>→</span></button></section>'+
      '<section class="kona-section"><div class="kona-section-head"><h3>Next</h3><small>One useful thing</small></div><div class="kona-list">'+expo+
      '<article><i>Setup</i><div><b>Complete your race setup</b><span>Bike, run gear and goal stay together.</span></div><a href="Studio.html#setup">Open →</a></article></div></section>'+
      '<section class="kona-section"><div class="kona-section-head"><h3>Discover Kona</h3><small>Places worth knowing</small></div><div class="kona-place-grid">'+placeCards+'</div><button class="kona-primary kona-secondary-action" data-enter>Discover more <span>→</span></button></section>';
    body.querySelector('[data-setup]')?.addEventListener('click',()=>{ location.href='Studio.html#setup'; });
    body.querySelector('[data-enter]')?.addEventListener('click',()=>{ explore(); });
    panel.hidden=false;document.body.classList.add('kona-panel-open');setActive('home');
  }

  function plan(){
    const { week, places } = facts();
    title.textContent='Plan'; eyebrow.textContent='KONA · SOURCE-GROUNDED';
    const days=week.map(x=>'<article><time>'+esc(fmtDate(x.date))+'</time><div><b>IRONMAN Expo</b><span>'+esc(x.start)+'–'+esc(x.end)+' · '+esc(x.venue)+'</span></div></article>').join('');
    const cards=places.map(p=>'<article><small>'+esc(p.region)+'</small><b>'+esc(p.name)+'</b><span>'+esc(p.purpose)+'</span>'+(p.visit_with_care?'<em>Visit with care</em>':'')+'</article>').join('');
    body.innerHTML=
      '<section class="kona-section first"><div class="kona-section-head"><h3>Race week</h3><small>2026 verified</small></div><div class="kona-timeline">'+days+'</div></section>'+
      '<section class="kona-section"><div class="kona-section-head"><h3>Places worth your time</h3><small>Local-first planning</small></div><div class="kona-place-grid">'+cards+'</div></section>'+
      '<p class="kona-source-note">Operational race information is shown only from current 2026 official sources. Older athlete guides and course maps remain reference-only.</p>';
    panel.hidden=false;document.body.classList.add('kona-panel-open');setActive('plan');
  }

  async function me(){
    title.textContent='Me'; eyebrow.textContent='KONA · PASSPORT';
    try { ensureProgression(); } catch (_) { /* local passport still reads */ }
    const p=gameProgress(readGameState());
    const tier=p.accessTier==='passport'?'Passport':p.accessTier==='athlete'?'Athlete profile':'Visitor';
    body.innerHTML='<section class="kona-hero-card"><small>'+esc(tier).toUpperCase()+' · '+(esc(p.levelName)||'VISITOR')+'</small><h3>'+p.xp+' XP · '+p.streak+' day streak</h3><p>'+p.stamps+' discoveries · '+p.badges+' badges · '+p.hidden+' finds'+(p.credits!=null?' · '+p.credits+' Kona Credits':'')+'</p><a class="kona-primary" href="Studio.html#setup">Open My Kona Setup <span>→</span></a></section>'+
      '<section class="kona-section"><div class="kona-section-head"><h3>Your collection</h3><small>Exploration unlocks more</small></div><div class="kona-place-grid"><article><small>Bikes</small><b>'+p.bikes+'</b><span>visited</span></article><article><small>Kona years</small><b>'+p.konaYears+'</b><span>discovered</span></article><article><small>Parts</small><b>'+p.parts+'</b><span>inspected</span></article><article><small>Garage</small><b>'+p.garage+'</b><span>saved builds</span></article></div></section>'+
      '<section class="kona-section" id="konaAccount"><div class="kona-section-head"><h3>Sync across devices</h3><small>Optional · beta</small></div><p class="kona-source-note" data-status>Checking account…</p></section>'+
      '<section class="kona-section"><button class="kona-primary" type="button" data-settings>Profile, privacy & settings <span>→</span></button></section>';
    body.querySelector('[data-settings]')?.addEventListener('click',()=>settings?.open?.());
    panel.hidden=false;document.body.classList.add('kona-panel-open');setActive('me');
    const account=body.querySelector('#konaAccount'), status=account?.querySelector('[data-status]');
    if(!account||!cloudAvailable()){ if(status) status.textContent='Cloud sync unavailable. Local Passport still works normally.'; return; }
    const user=await currentUser().catch(()=>null);
    if(!user){
      account.insertAdjacentHTML('beforeend','<form data-login><label class="kona-source-note">Email for a one-time sign-in link</label><input name="email" type="email" autocomplete="email" required placeholder="you@example.com" style="width:100%;min-height:48px;padding:12px 14px;margin:8px 0;border:1px solid currentColor;border-radius:12px;background:transparent;color:inherit;font:inherit"><button class="kona-primary" type="submit">Send sign-in link</button></form>');
      status.textContent='Play without an account, or sign in only for cross-device backup.';
      account.querySelector('[data-login]')?.addEventListener('submit',async e=>{e.preventDefault();const btn=e.currentTarget.querySelector('button');btn.disabled=true;try{await sendMagicLink(new FormData(e.currentTarget).get('email'));status.textContent='Check your email and open the sign-in link on this device.';e.currentTarget.hidden=true;}catch(err){status.textContent=err.message||'Could not send sign-in link.';btn.disabled=false;}});
      return;
    }
    status.textContent='Signed in as '+(user.email||'beta user')+'. Backup and restore are explicit.';
    account.insertAdjacentHTML('beforeend','<div class="kona-list"><article><i>↑</i><div><b>Back up this device</b><span>Save Passport, collection, setup and Garage.</span></div><button type="button" data-backup>Back up</button></article><article><i>↓</i><div><b>Restore from cloud</b><span>Replace this device with your latest backup.</span></div><button type="button" data-restore>Restore</button></article><article><i>↪</i><div><b>Sign out</b><span>Local progress stays on this device.</span></div><button type="button" data-signout>Sign out</button></article></div>');
    account.querySelector('[data-backup]')?.addEventListener('click',async e=>{e.currentTarget.disabled=true;try{await backupGameState();status.textContent='Cloud backup saved.';}catch(err){status.textContent=err.message;}finally{e.currentTarget.disabled=false;}});
    account.querySelector('[data-restore]')?.addEventListener('click',async e=>{e.currentTarget.disabled=true;try{await restoreGameState();status.textContent='Cloud state restored. Reloading…';location.reload();}catch(err){status.textContent=err.message;e.currentTarget.disabled=false;}});
    account.querySelector('[data-signout]')?.addEventListener('click',async()=>{await signOut();me();});
  }

  function walkTo(id){
    close();
    const go=window.__museumGo;
    if(go){ go(id); return; }
    enter?.(id);
  }
  function explore(){
    title.textContent='Explore'; eyebrow.textContent='KONA · THE MUSEUM';
    const named=(window.__ROOMS?.areas||[]).filter(a=>['hall','sanctuary','hween','kona','wyld','pier'].includes(a.id));
    const brands=window.__BRANDROOMS?.rooms||[];
    const themes=window.__gallery?.rooms||[];
    const row=(kicker,name,sub,id)=>'<button type="button" data-go="'+esc(id)+'"><article><small>'+esc(kicker)+'</small><b>'+esc(name)+'</b><span>'+esc(sub)+'</span></article></button>';
    const rooms=named.map(a=>row(a.floor==='upper'?'Upper floor':'Ground', a.short||a.name, a.sub||'', a.id)).join('')
      +brands.map(r=>row('Brand room', r.name, (r.products?.[0]?.model)||r.kicker||'', r.id)).join('')
      +themes.map(r=>row('Upper floor', r.name, r.sub||'', 'room-'+r.id)).join('');
    body.innerHTML=
      '<section class="kona-hero-card"><small>WALK THE COAST</small><h3>Every room, one museum</h3><p>Kona hall, themed rooms, and the studies that have a place of their own.</p><button class="kona-primary" data-enter>Enter where you stand <span>→</span></button></section>'+
      '<section class="kona-section"><div class="kona-section-head"><h3>Rooms</h3><small>Tap to walk</small></div><div class="kona-place-grid">'+rooms+'</div></section>';
    body.querySelector('[data-enter]')?.addEventListener('click',()=>{close();enter?.();});
    body.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>walkTo(b.dataset.go)));
    panel.hidden=false;document.body.classList.add('kona-panel-open');setActive('discover');
  }

  shell.querySelector('[data-tab=home]').onclick=now;
  shell.querySelector('[data-tab=discover]').onclick=explore;
  shell.querySelector('[data-tab=plan]').onclick=plan;
  shell.querySelector('[data-tab=me]').onclick=me;
  addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)close();});

  const applyTheme=p=>{ const v=p?.appearance||'auto'; if(v==='auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme=v; };
  applyTheme(profile?.get?.()); profile?.subscribe?.(applyTheme);
  return { now, plan, me, explore, close };
}
