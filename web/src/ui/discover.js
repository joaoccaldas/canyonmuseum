import { t } from '../i18n.js';
import { esc, placeRegion, placeSummary } from './surface-utils.js';

const roomRow=(kicker,name,sub,id)=>'<button type="button" data-go="'+esc(id)+'"><article><small>'+esc(kicker)+'</small><b>'+esc(name)+'</b><span>'+esc(sub)+'</span></article></button>';

export function renderDiscoverSurface(root,{named=[],brands=[],themes=[],places=[],locale='en',onEnter,onWalk}={}){
  const rooms=named.map(a=>roomRow(a.floor==='upper'?'Upper floor':'Ground',a.short||a.name,a.sub||'',a.id)).join('')
    +brands.map(r=>roomRow('Brand room',r.name,(r.products?.[0]?.model)||r.kicker||'',r.id)).join('')
    +themes.map(r=>roomRow('Upper floor',r.name,r.sub||'','room-'+r.id)).join('');
  const placeCards=places.slice(0,6).map(p=>'<article><small>'+esc(placeRegion(p))+'</small><b>'+esc(p.name)+'</b><span>'+esc(placeSummary(p))+'</span></article>').join('');
  root.innerHTML=
    '<section class="kona-hero-card artifact artifact--hero"><small>'+esc(t('discover.eyebrow',locale))+'</small><h3>'+esc(t('discover.title',locale))+'</h3>'+
    '<p>'+esc(t('discover.body',locale))+'</p><p class="kona-human-note">'+esc(t('discover.human',locale))+'</p>'+
    '<button class="kona-primary" data-enter>'+esc(t('discover.enter',locale))+' <span>→</span></button></section>'+
    (placeCards?'<section class="kona-section artifact artifact--label"><div class="kona-section-head"><h3>'+esc(t('discover.places',locale))+'</h3><small>Local-first</small></div><div class="kona-place-grid">'+placeCards+'</div></section>':'')+
    (rooms?'<section class="kona-section artifact artifact--label"><div class="kona-section-head"><h3>'+esc(t('discover.rooms',locale))+'</h3><small>Tap to walk</small></div><div class="kona-place-grid">'+rooms+'</div></section>':'');
  root.querySelector('[data-enter]')?.addEventListener('click',()=>onEnter?.());
  root.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>onWalk?.(b.dataset.go)));
}
