// ui/me.js — RaceIdentity + Passport projection.
// Personal truth comes from canonical game state; this surface owns no persistence.
import { readGameState, gameProgress } from '../engine/game-state.js';
import { ensureProgression } from '../engine/progression.js';
import { getPublicProduct } from '../engine/catalog.js';
import { sendMagicLink, currentUser, signOut, backupGameState, restoreGameState, cloudAvailable } from '../cloud/supabase-lite.js';
import { renderRaceBadges } from './race-cards.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const legacyId = id => String(id || '').replace(/^product:/,'');
const titleCase = s => String(s || '').replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());

async function equipmentProduct(snapshot, equipmentId) {
  const row = (snapshot?.user_equipment || []).find(x => x.id === equipmentId);
  if (!row?.product_id) return null;
  return await getPublicProduct(legacyId(row.product_id)) || { id:legacyId(row.product_id), label:legacyId(row.product_id) };
}

async function raceIdentityMarkup(snapshot) {
  const identity = snapshot?.race_identity;
  if (!identity?.event_id) {
    return '<section class="kona-hero-card artifact artifact--hero"><small>YOUR KONA</small><h3>Your next chapter starts here.</h3><p>Explore the museum to collect discoveries, earn badges and build your Passport. Your progress stays with you on this device.</p></section>';
  }
  const [bike, shoe] = await Promise.all([equipmentProduct(snapshot, identity.setup?.bike), equipmentProduct(snapshot, identity.setup?.shoe)]);
  const gear = [
    bike ? [bike.brand,bike.name||bike.label||bike.model].filter(Boolean).join(' ') : '',
    shoe ? [shoe.brand,shoe.name||shoe.label||shoe.model].filter(Boolean).join(' ') : ''
  ].filter(Boolean).join(' · ');
  const goal = identity.goal?.label || 'No goal set';
  const intent = identity.intent ? titleCase(identity.intent) : titleCase(identity.mode || 'Kona');
  return '<section class="kona-hero-card artifact artifact--hero kona-raceidentity-card">'+
    '<small>YOUR KONA · 2026</small>'+
    '<h3>'+esc(goal)+'</h3>'+
    '<p>'+esc(intent)+(gear?' · '+esc(gear):'')+'</p>'+
    '<span class="kona-source-note">Your race profile stays on this device unless you choose to back it up or share it.</span>'+
  '</section>';
}

export async function renderPassportSurface(root,{settings}={}) {
  try { ensureProgression(); } catch (_) { /* Passport remains readable without repair */ }
  const snapshot = readGameState();
  const p = gameProgress(snapshot);
  root.innerHTML = await raceIdentityMarkup(snapshot)+
    '<section class="kona-section artifact artifact--label"><div class="kona-section-head"><h3>Passport</h3><small>'+esc(p.levelName||'Visitor')+'</small></div>'+
      '<div class="kona-list"><article><i>XP</i><div><b>'+p.xp+' XP</b><span>'+p.stamps+' discoveries · '+p.badges+' badges · '+p.hidden+' finds</span></div></article>'+
      '<article><i>↗</i><div><b>'+p.streak+' day streak</b><span>Progress follows what you actually explore.</span></div></article>'+
      (p.credits!=null?'<article><i>KC</i><div><b>'+p.credits+' Kona Credits</b><span>Earned as you explore KONA.</span></div></article>':'')+
      '</div></section>'+
    '<section class="kona-section artifact artifact--label"><div class="kona-section-head"><h3>Your collection</h3><small>Every discovery counts</small></div><div class="kona-place-grid">'+
      '<article><small>Bikes</small><b>'+p.bikes+'</b><span>visited</span></article>'+
      '<article><small>Kona years</small><b>'+p.konaYears+'</b><span>discovered</span></article>'+
      '<article><small>Parts</small><b>'+p.parts+'</b><span>inspected</span></article>'+
      '<article><small>Garage</small><b>'+p.garage+'</b><span>saved items</span></article>'+
    '</div></section>'+
    '<section class="kona-section artifact artifact--label"><div class="kona-section-head"><h3>Race badges</h3><small>Past & future</small></div><div data-profile-races></div></section>'+
    '<section class="kona-section artifact artifact--label" id="konaAccount"><div class="kona-section-head"><h3>Sync across devices</h3><small>Optional · beta</small></div><p class="kona-source-note" data-status>Checking account…</p></section>'+
    '<section class="kona-section artifact artifact--label"><button class="kona-primary" type="button" data-settings>Profile, privacy & settings <span>→</span></button></section>';

  await renderRaceBadges(root.querySelector('[data-profile-races]'),{limit:20,empty:true});
  root.querySelector('[data-settings]')?.addEventListener('click',()=>settings?.open?.());
  const account=root.querySelector('#konaAccount'), status=account?.querySelector('[data-status]');
  if(!account||!cloudAvailable()){ if(status) status.textContent='Cloud sync unavailable. Local Passport still works normally.'; return; }

  const user=await currentUser().catch(()=>null);
  if(!user){
    account.insertAdjacentHTML('beforeend','<form data-login><label class="kona-source-note" for="passportEmail">Email for a one-time sign-in link</label><input id="passportEmail" name="email" type="email" autocomplete="email" required placeholder="you@example.com" class="ui-input passport-email"><button class="kona-primary" type="submit">Send sign-in link</button></form>');
    status.textContent='Play without an account, or sign in only for cross-device backup.';
    account.querySelector('[data-login]')?.addEventListener('submit',async e=>{e.preventDefault();const btn=e.currentTarget.querySelector('button');btn.disabled=true;try{await sendMagicLink(new FormData(e.currentTarget).get('email'));status.textContent='Check your email and open the sign-in link on this device.';e.currentTarget.hidden=true;}catch(err){status.textContent=err.message||'Could not send sign-in link.';btn.disabled=false;}});
    return;
  }

  status.textContent='Signed in as '+(user.email||'beta user')+'. Backup and restore are explicit.';
  account.insertAdjacentHTML('beforeend','<div class="kona-list"><article><i>↑</i><div><b>Back up this device</b><span>Save Passport, collection, setup and Garage.</span></div><button type="button" data-backup>Back up</button></article><article><i>↓</i><div><b>Restore from cloud</b><span>Replace this device with your latest backup.</span></div><button type="button" data-restore>Restore</button></article><article><i>↪</i><div><b>Sign out</b><span>Local progress stays on this device.</span></div><button type="button" data-signout>Sign out</button></article></div>');
  account.querySelector('[data-backup]')?.addEventListener('click',async e=>{e.currentTarget.disabled=true;try{await backupGameState();status.textContent='Cloud backup saved.';}catch(err){status.textContent=err.message;}finally{e.currentTarget.disabled=false;}});
  account.querySelector('[data-restore]')?.addEventListener('click',async e=>{e.currentTarget.disabled=true;try{await restoreGameState();status.textContent='Cloud state restored. Reloading…';location.reload();}catch(err){status.textContent=err.message;e.currentTarget.disabled=false;}});
  account.querySelector('[data-signout]')?.addEventListener('click',async()=>{await signOut();await renderMeSurface(root,{settings});});
}

export async function renderMeSurface(root,{settings}={}) { return renderPassportSurface(root,{settings}); }
