import { t } from '../i18n.js';
import { esc, fmtDate, placeRegion, placeSummary } from './surface-utils.js';

export function renderPlanSurface(root,{week=[],places=[],locale='en'}={}){
  const days=week.map(x=>'<article><time>'+esc(fmtDate(x.date))+'</time><div><b>IRONMAN Expo</b><span>'+esc(x.start)+'–'+esc(x.end)+' · '+esc(x.venue)+'</span></div></article>').join('');
  const cards=places.map(p=>'<article><small>'+esc(placeRegion(p))+'</small><b>'+esc(p.name)+'</b><span>'+esc(placeSummary(p))+'</span>'+(p.visit_with_care?'<em>Visit with care</em>':'')+'</article>').join('');
  root.innerHTML=
    '<section class="kona-section first artifact artifact--label"><div class="kona-section-head"><h3>'+esc(t('plan.week',locale))+'</h3><small>2026 verified</small></div><div class="kona-timeline">'+days+'</div></section>'+
    '<section class="kona-section artifact artifact--label"><div class="kona-section-head"><h3>'+esc(t('plan.places',locale))+'</h3><small>Local-first planning</small></div><div class="kona-place-grid">'+cards+'</div></section>'+
    '<p class="kona-source-note">Operational race information is shown only from current 2026 official sources. Older athlete guides and course maps remain reference-only.</p>';
}
