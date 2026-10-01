// ui/visual-primitives.js — tiny shared visual marks for 2D product surfaces.
// No Three.js. These previews exist to hint at Race Self / equipment without loading 3D.
import art from '../../../museum/entry-art.json' with { type: 'json' };
import wyld from '../../../museum/wyld_room.json' with { type: 'json' };
import { randomFamily, RANDOM_FAMILIES } from '../brand/runtime.js';
import { avatarItem, normaliseAvatarStyle } from '../engine/avatar.js';

export function avatarPreviewMarkup(styleInput,{className='visual-avatar'}={}){
  const s=normaliseAvatarStyle(styleInput);
  const [skin,hair,top,bottoms,shoes]=['skin','hair','top','bottoms','shoes'].map(slot=>avatarItem(s,slot).color);
  return '<div class="visual-avatar '+className+'" style="--skin:'+skin+';--hair:'+hair+';--top:'+top+';--bottoms:'+bottoms+';--shoes:'+shoes+'">'+
    '<i class="va-hair"></i><i class="va-head"></i><i class="va-body"></i><i class="va-arm l"></i><i class="va-arm r"></i><i class="va-leg l"></i><i class="va-leg r"></i><i class="va-shoe l"></i><i class="va-shoe r"></i>'+
  '</div>';
}

export function bikeMarkSvg(className='visual-bike-mark'){
  return '<svg class="visual-bike-mark '+className+'" viewBox="0 0 180 92" aria-hidden="true"><circle cx="38" cy="66" r="23"/><circle cx="142" cy="66" r="23"/><path d="M38 66 72 31l28 35H64l36-35 42 35M72 31h38m-10 0 14-14m-10 0h24"/></svg>';
}

export function renderEntryProductStage(host,{profile}={}){
  if(!host) return;
  const editions=art.liveries.map(id=>wyld.variants.find(v=>v.id===id));
  let index=RANDOM_FAMILIES.indexOf(randomFamily())%editions.length;
  host.innerHTML=
    '<div class="entry-stage-orbit" aria-hidden="true"></div>'+
    '<div class="entry-stage-object entry-stage-bike"><img width="1400" height="880" fetchpriority="high" decoding="async" alt="Canyon Speedmax time trial bike in a custom WYLD finish"></div>'+
    '<div class="entry-stage-object entry-stage-avatar"><img src="assets/entry/triathlete.webp" width="356" height="837" alt="Block triathlete in a trisuit and running shoes"></div>'+
    '<button class="entry-livery" type="button" aria-label="Try another bike finish"><span aria-hidden="true">↻</span> Change finish</button>'+
    '<div class="entry-stage-caption"><small>YOUR NEXT OBSESSION</small><b>Canyon. Unrestrained.</b><span class="entry-edition" aria-live="polite"></span></div>';
  const bike=host.querySelector('.entry-stage-bike img'),label=host.querySelector('.entry-edition');
  const show=()=>{const edition=editions[index];bike.src='assets/entry/canyon-'+edition.id+'.webp';label.textContent=edition.name;};
  show();
  host.querySelector('.entry-livery').addEventListener('click',()=>{index=(index+1)%editions.length;show();});
  const move=e=>{
    if(e.pointerType!=='mouse'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const r=host.getBoundingClientRect(),x=(e.clientX-r.left)/Math.max(1,r.width)-.5,y=(e.clientY-r.top)/Math.max(1,r.height)-.5;
    host.style.setProperty('--stage-rx',(y*-3).toFixed(2)+'deg');host.style.setProperty('--stage-ry',(x*5).toFixed(2)+'deg');
  };
  host.addEventListener('pointermove',move,{passive:true});
  host.addEventListener('pointerleave',()=>{host.style.removeProperty('--stage-rx');host.style.removeProperty('--stage-ry')},{passive:true});
}
