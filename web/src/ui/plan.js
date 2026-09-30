// ui/plan.js — lightweight 2D race-week planning surface.
// Uses app/entry-data.json only. It must not require museum globals or Three.js.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const fmtDate = iso => {
  const d = new Date(String(iso || '') + 'T12:00:00');
  return Number.isNaN(d.valueOf())
    ? String(iso || '')
    : new Intl.DateTimeFormat('en',{month:'short',day:'numeric'}).format(d);
};

export function renderPlanSurface(root,{data={}}={}) {
  const week = Array.isArray(data.race_week) ? data.race_week : [];
  const places = Array.isArray(data.places) ? data.places : [];
  const event = data.event || {};

  const days = week.map(x =>
    '<article><time>'+esc(fmtDate(x.date))+'</time><div><b>'+esc(x.kind === 'expo' ? 'IRONMAN Expo' : x.kind || 'Race week')+'</b><span>'+esc(x.start)+'–'+esc(x.end)+' · '+esc(x.venue)+'</span></div></article>'
  ).join('');

  const cards = places.map(p =>
    '<article><small>'+esc(p.region)+'</small><b>'+esc(p.name)+'</b><span>'+esc(p.purpose)+'</span>'+(p.visit_with_care?'<em>Visit with care</em>':'')+'</article>'
  ).join('');

  const eventLine = [event.date ? fmtDate(event.date) : '', event.venue || event.location || ''].filter(Boolean).join(' · ');

  root.innerHTML =
    '<section class="kona-section first artifact artifact--label"><div class="kona-section-head"><h3>Race week</h3><small>2026 verified</small></div>'+
      (eventLine?'<p class="kona-source-note">'+esc(eventLine)+'</p>':'')+
      '<div class="kona-timeline">'+(days || '<article><div><b>Race-week details are being verified.</b><span>No museum load required.</span></div></article>')+'</div></section>'+
    '<section class="kona-section artifact artifact--label"><div class="kona-section-head"><h3>Places worth your time</h3><small>Local-first planning</small></div><div class="kona-place-grid">'+
      (cards || '<article><b>Place notes are being prepared.</b><span>Only lightweight verified data appears here.</span></article>')+
    '</div></section>'+
    '<p class="kona-source-note">Operational race information is shown only from current 2026 official sources. Older athlete guides and course maps remain reference-only.</p>';
}
