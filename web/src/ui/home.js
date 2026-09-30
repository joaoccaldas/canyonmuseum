// ui/home.js — the calm 2D front page. No museum globals or 3D required.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate=iso=>{try{return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric'}).format(new Date(iso+'T12:00:00'))}catch(_){return iso}};
const daysUntil=iso=>{const n=Math.ceil((new Date(iso+'T12:00:00')-Date.now())/86400000);return Number.isFinite(n)?Math.max(0,n):null};

export function renderHomeSurface(root,{event={},openGarage,openDiscover}={}){
  const raceDays=event.date?daysUntil(event.date):null;
  const headline=raceDays==null?'Your race story starts here.':raceDays===0?'Today.':raceDays===1?'1 day.':raceDays+' days.';
  const note=raceDays==null?'One useful choice is enough.':'Plenty of time to panic later.';
  root.innerHTML=
    '<section class="kona-hero-card artifact artifact--hero">'+
      '<small>'+esc(event.name||'KONA · RACE WEEK')+'</small>'+
      '<h3>'+headline+'</h3><p>'+note+'</p>'+
      '<button class="kona-primary" type="button" data-home-garage>Make tomorrow easier <span>→</span></button>'+
    '</section>'+
    '<section class="kona-section artifact artifact--label">'+
      '<div class="kona-section-head"><h3>One thing worth looking at</h3><small>'+(event.date?esc(fmtDate(event.date)):'TODAY')+'</small></div>'+
      '<button class="kona-editorial-link" type="button" data-home-discover><span>Machines, people, stories and places.</span><b>Discover →</b></button>'+
    '</section>';
  root.querySelector('[data-home-garage]')?.addEventListener('click',()=>openGarage?.());
  root.querySelector('[data-home-discover]')?.addEventListener('click',()=>openDiscover?.());
}
