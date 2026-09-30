import { t } from '../i18n.js';
import { daysUntil, esc, fmtDate, placeRegion, placeSummary } from './surface-utils.js';

export function renderHomeSurface(root,{event={},week=[],places=[],locale='en',onEnter,onGarage}={}){
  const raceDays=event.date ? daysUntil(event.date) : null;
  const nextExpo=week.find(x=>new Date(x.date+'T23:59:00')>=new Date()) || week[0];
  const expo=nextExpo ? '<article><i>Expo</i><div><b>'+esc(fmtDate(nextExpo.date))+' · '+esc(nextExpo.start)+'–'+esc(nextExpo.end)+'</b><span>'+esc(nextExpo.venue)+'</span></div></article>' : '';
  const placeCards=places.slice(0,4).map(p=>'<article><small>'+esc(placeRegion(p))+'</small><b>'+esc(p.name)+'</b><span>'+esc(placeSummary(p))+'</span></article>').join('');
  root.innerHTML=
    '<section class="kona-hero-card artifact artifact--hero"><small>KONA · '+esc(event.location||'Kailua-Kona, Hawaiʻi')+'</small>'+
    '<h3>'+(raceDays==null?esc(t('home.await',locale)):raceDays===0?esc(t('home.raceday',locale)):raceDays+' '+esc(t('home.days',locale)))+'</h3>'+
    '<p>'+(event.date?esc(fmtDate(event.date)):'2026')+' · '+esc(event.venue||'Kailua Pier')+'</p><p class="kona-human-note">'+esc(t('home.human',locale))+'</p>'+
    '<button class="kona-primary" data-enter>'+esc(t('home.explore',locale))+' <span>→</span></button></section>'+
    '<section class="kona-section artifact artifact--label"><div class="kona-section-head"><h3>'+esc(t('home.next',locale))+'</h3><small>Official 2026 sources</small></div><div class="kona-list">'+expo+
    '<article><i>Setup</i><div><b>Build your Kona setup</b><span>Bike today. Wheels, helmet and shoes plug into the same setup.</span></div><button type="button" data-garage>Open Garage →</button></article>'+
    '<article><i>Explore</i><div><b>Walk the collection</b><span>Bikes, engineering, Kona stories and hidden rooms.</span></div></article></div></section>'+
    '<section class="kona-section artifact artifact--label"><div class="kona-section-head"><h3>'+esc(t('home.start',locale))+'</h3><small>Useful, not noisy</small></div><div class="kona-place-grid">'+placeCards+'</div></section>';
  root.querySelector('[data-enter]')?.addEventListener('click',()=>onEnter?.());
  root.querySelector('[data-garage]')?.addEventListener('click',()=>onGarage?.());
}
