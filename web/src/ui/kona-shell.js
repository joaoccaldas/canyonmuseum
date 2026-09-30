// ui/kona-shell.js — mobile-first app shell over the existing 3D museum.
// Navigation/utility only. The 3D renderer remains the existing proven museum runtime.

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
  const event = window.__EVENT?.current_facts?.event || window.__ISLAND?.race_2026 || {};
  const week = window.__EVENT?.current_facts?.race_week || [];
  const places = window.__ISLAND?.places || [];
  const shell=document.createElement('div'); shell.id='konaShell';
  shell.innerHTML=
    '<div id="konaPanel" class="kona-panel" hidden>'+
      '<div class="kona-panel-head"><div><small id="konaPanelEyebrow">KONA · BETA</small><h2 id="konaPanelTitle">Now</h2></div><button id="konaPanelClose" type="button" aria-label="Close">×</button></div>'+
      '<div id="konaPanelBody" class="kona-panel-body"></div>'+
    '</div>'+
    '<nav class="kona-bottom-nav" aria-label="Main navigation">'+
      '<button type="button" data-tab="now">'+icon('now')+'<span>Now</span></button>'+
      '<button type="button" data-tab="explore">'+icon('explore')+'<span>Explore</span></button>'+
      '<a href="Studio.html#setup" data-tab="setup">'+icon('setup')+'<span>Setup</span></a>'+
      '<button type="button" data-tab="plan">'+icon('plan')+'<span>Plan</span></button>'+
      '<button type="button" data-tab="me">'+icon('me')+'<span>Me</span></button>'+
    '</nav>';
  document.body.append(shell);

  const panel=shell.querySelector('#konaPanel'), body=shell.querySelector('#konaPanelBody'), title=shell.querySelector('#konaPanelTitle'), eyebrow=shell.querySelector('#konaPanelEyebrow');
  const setActive=id=>shell.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('on',x.dataset.tab===id));
  const close=()=>{panel.hidden=true;document.body.classList.remove('kona-panel-open');setActive('explore');};
  shell.querySelector('#konaPanelClose').onclick=close;

  const raceDays=event.date ? daysUntil(event.date) : null;
  const nextExpo=week.find(x=>new Date(x.date+'T23:59:00')>=new Date()) || week[0];

  function now(){
    title.textContent='Now'; eyebrow.textContent='KONA · RACE WEEK';
    const expo=nextExpo ? '<article><i>Expo</i><div><b>'+esc(fmtDate(nextExpo.date))+' · '+esc(nextExpo.start)+'–'+esc(nextExpo.end)+'</b><span>'+esc(nextExpo.venue)+'</span></div></article>' : '';
    const placeCards=places.slice(0,4).map(p=>'<article><small>'+esc(p.region)+'</small><b>'+esc(p.name)+'</b><span>'+esc(p.purpose)+'</span></article>').join('');
    body.innerHTML=
      '<section class="kona-hero-card"><small>IRONMAN WORLD CHAMPIONSHIP · '+esc(event.location||'Kailua-Kona, Hawaiʻi')+'</small>'+
      '<h3>'+(raceDays==null?'Kona awaits':raceDays===0?'Race day':raceDays+' days to race day')+'</h3>'+
      '<p>'+(event.date?esc(fmtDate(event.date)):'2026')+' · '+esc(event.venue||'Kailua Pier')+'</p>'+
      '<button class="kona-primary" data-enter>Enter the museum <span>→</span></button></section>'+
      '<section class="kona-section"><div class="kona-section-head"><h3>What matters next</h3><small>Official 2026 sources</small></div><div class="kona-list">'+expo+
      '<article><i>Setup</i><div><b>Build your Kona setup</b><span>Bike today. Wheels, helmet and shoes plug into the same setup.</span></div><a href="Studio.html#setup">Open →</a></article>'+
      '<article><i>Explore</i><div><b>Walk the collection</b><span>Bikes, engineering, Kona stories and hidden rooms.</span></div></article></div></section>'+
      '<section class="kona-section"><div class="kona-section-head"><h3>Start with Kona</h3><small>Useful, not noisy</small></div><div class="kona-place-grid">'+placeCards+'</div></section>';
    body.querySelector('[data-enter]')?.addEventListener('click',()=>{close();enter?.();});
    panel.hidden=false;document.body.classList.add('kona-panel-open');setActive('now');
  }

  function plan(){
    title.textContent='Plan'; eyebrow.textContent='KONA · SOURCE-GROUNDED';
    const days=week.map(x=>'<article><time>'+esc(fmtDate(x.date))+'</time><div><b>IRONMAN Expo</b><span>'+esc(x.start)+'–'+esc(x.end)+' · '+esc(x.venue)+'</span></div></article>').join('');
    const cards=places.map(p=>'<article><small>'+esc(p.region)+'</small><b>'+esc(p.name)+'</b><span>'+esc(p.purpose)+'</span>'+(p.visit_with_care?'<em>Visit with care</em>':'')+'</article>').join('');
    body.innerHTML=
      '<section class="kona-section first"><div class="kona-section-head"><h3>Race week</h3><small>2026 verified</small></div><div class="kona-timeline">'+days+'</div></section>'+
      '<section class="kona-section"><div class="kona-section-head"><h3>Places worth your time</h3><small>Local-first planning</small></div><div class="kona-place-grid">'+cards+'</div></section>'+
      '<p class="kona-source-note">Operational race information is shown only from current 2026 official sources. Older athlete guides and course maps remain reference-only.</p>';
    panel.hidden=false;document.body.classList.add('kona-panel-open');setActive('plan');
  }

  shell.querySelector('[data-tab=now]').onclick=now;
  shell.querySelector('[data-tab=explore]').onclick=()=>{close();enter?.();};
  shell.querySelector('[data-tab=plan]').onclick=plan;
  shell.querySelector('[data-tab=me]').onclick=()=>{close();settings?.open?.();setActive('me');};
  addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)close();});
  setActive('explore');

  const applyTheme=p=>{ const v=p?.appearance||'auto'; if(v==='auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme=v; };
  applyTheme(profile?.get?.()); profile?.subscribe?.(applyTheme);
  return { now, plan, close };
}
