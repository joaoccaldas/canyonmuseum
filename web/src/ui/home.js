// ui/home.js — calm daily Home. App Shell is the navigation authority.
// Race Self is a personalized feature opened intentionally from here.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate=iso=>{try{return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric'}).format(new Date(iso+'T12:00:00'))}catch(_){return iso}};
const daysUntil=iso=>{const n=Math.ceil((new Date(iso+'T12:00:00')-Date.now())/86400000);return Number.isFinite(n)?Math.max(0,n):null};

export function renderHomeSurface(root,{event={},profile={},openRaceSelf,openGarage,openDiscover}={}){
  const raceDays=event.date?daysUntil(event.date):null;
  const headline=raceDays==null?'What matters today?':raceDays===0?'Today.':raceDays===1?'1 day.':raceDays+' days.';
  const note=raceDays==null?'One useful choice is enough.':'Something worth doing today.';
  const p=profile?.get?.()||{};
  const avatar=p.avatar||'#e8471c';

  root.innerHTML=
    '<section class="kona-hero-card artifact artifact--hero home-daily">'+
      '<small>'+esc(event.name||'KONA · TODAY')+'</small>'+
      '<h3>'+headline+'</h3><p>'+note+'</p>'+
      '<button class="kona-primary" type="button" data-home-garage>Check your setup <span>→</span></button>'+
    '</section>'+
    '<section class="kona-section artifact artifact--label home-race-self">'+
      '<div class="kona-section-head"><h3>Your Race Self</h3><small>PERSONAL SPACE</small></div>'+
      '<button type="button" class="race-self-preview" data-home-race-self>'+
        '<span class="race-self-preview-avatar" style="--avatar:'+esc(avatar)+'" aria-hidden="true">'+
          '<i class="head"></i><i class="body"></i><i class="leg l"></i><i class="leg r"></i>'+
        '</span>'+
        '<span class="race-self-preview-copy"><b>Your setup is taking shape.</b><small>Avatar, gear, races and collections.</small></span>'+
        '<span class="race-self-preview-go">Open →</span>'+
      '</button>'+
    '</section>'+
    '<section class="kona-section artifact artifact--label">'+
      '<div class="kona-section-head"><h3>Discover something</h3><small>'+(event.date?esc(fmtDate(event.date)):'TODAY')+'</small></div>'+
      '<button class="kona-editorial-link" type="button" data-home-discover><span>Machines, people, stories and places.</span><b>Discover →</b></button>'+
    '</section>';

  root.querySelector('[data-home-garage]')?.addEventListener('click',()=>openGarage?.());
  root.querySelector('[data-home-race-self]')?.addEventListener('click',()=>openRaceSelf?.());
  root.querySelector('[data-home-discover]')?.addEventListener('click',()=>openDiscover?.());
}
