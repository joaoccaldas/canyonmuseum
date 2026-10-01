// KONA entry. HTML is already on screen. This file does not import Three.js.
// The museum runtime loads only after the visitor chooses to explore.
import { createProfile, QUALITY, AVATARS } from './engine/profile.js';
import { initSettings } from './ui/settings.js';
import { desktopViewPhone, coarse } from './detect.js';
import { consumeAuthCallback } from './cloud/supabase-lite.js';
import { initKonaShell } from './ui/kona-shell.js';
import { initAppShell } from './app-shell.js';
import { applyStoredEvent } from './engine/progression.js';
import { saveQuestIdentity } from './engine/identity.js';
import { readStorage, writeStorage } from './engine/storage.js';
import { BIKES, GOALS, INTENTS, SHOES, decodeShare, emptyQuest, questLabels, questReady, relationshipFor } from './quest.js';
import { shareRaceIdentity } from './growth/share.js';
import { renderRacePicker } from './ui/race-cards.js';

const intro = document.getElementById('intro');
const physicalPhone = coarse || Math.min(screen.width || 1e5, screen.height || 1e5) <= 600;
document.documentElement.classList.toggle('physical-phone', physicalPhone);
document.body.classList.toggle('physical-phone', physicalPhone);
if (desktopViewPhone) {
  const short=Math.min(screen.width,screen.height);
  const landscape=innerWidth>innerHeight;
  const physical=landscape?Math.max(screen.width,screen.height):short;
  const ratio=Math.max(1,innerWidth/Math.max(1,physical));
  document.documentElement.classList.add('phone-fit');
  document.documentElement.style.setProperty('--fit',ratio.toFixed(3));
}
const authReturned = consumeAuthCallback();
const setEntryMode = mode => {
  intro?.classList.toggle('quest-active', mode === 'quest');
  intro?.classList.toggle('app-ready', mode === 'app');
  document.body.classList.remove('entry-landing','entry-quest','entry-app');
  document.body.classList.add('entry-' + mode);
  document.body.dataset.entryMode = mode;
};
const profile = createProfile();
window.__konaProfile = profile;
const settingsUI = initSettings({
  profile, QUALITY, AVATARS,
  activeQuality:()=>profile.get().quality,
  onQuality:id=>window.__konaWorldSettings?.onQuality?.(id) ?? true,
  onSound:on=>window.__konaWorldSettings?.onSound?.(on),
  onMotion:()=>window.__konaWorldSettings?.onMotion?.() ?? true,
  sync:{available:false},
});
window.__konaSettingsUI = settingsUI;

const loads = new Map();
function loadStyle(href, media='all') {
  const key='css:'+href+'@'+media;
  if (loads.has(key)) return loads.get(key);
  const pending = new Promise((resolve,reject)=>{
    const link=document.createElement('link');
    link.rel='stylesheet'; link.href=href; link.media=media;
    link.onload=()=>resolve(); link.onerror=()=>reject(new Error(href));
    document.head.append(link);
  });
  loads.set(key,pending);
  return pending;
}
function loadScript(src) {
  if (loads.has(src)) return loads.get(src);
  const pending = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(src));
    document.body.append(s);
  });
  loads.set(src, pending);
  return pending;
}

const entryDataReady = fetch('app/entry-data.json',{cache:'no-store',credentials:'same-origin'})
  .then(r=>r.ok?r.json():Promise.reject(new Error('entry data')))
  .catch(()=>({event:{date:'2026-10-10'}}));
let worldShellReady = null;
const ensureWorldShell = () => {
  if (document.getElementById('hall')) return Promise.resolve();
  if (worldShellReady) return worldShellReady;
  worldShellReady = Promise.all([
    loadStyle('web/styles/world-shared.css'),
    loadStyle('web/styles/hall-web.css','(min-width:761px) and (pointer:fine)'),
    loadStyle('web/styles/hall-mobile.css','(max-width:760px), (pointer:coarse)'),
  ]).then(()=>fetch('app/world-shell.html',{cache:'no-store',credentials:'same-origin'}))
    .then(r=>r.ok?r.text():Promise.reject(new Error('world shell unavailable')))
    .then(html=>{
      const t=document.createElement('template'); t.innerHTML=html.trim();
      const anchor=document.getElementById('appSheet');
      document.body.insertBefore(t.content,anchor||document.body.firstChild);
    });
  return worldShellReady;
};
let museumDataReady = null;
const ensureMuseumData = () => museumDataReady || (museumDataReady = loadScript('app/museum-data.js'));

function daysUntil(iso) {
  const n = Math.ceil((new Date(iso + 'T12:00:00') - Date.now()) / 86400000);
  return Number.isFinite(n) ? Math.max(0, n) : null;
}

function paintCount() {
  const el = document.getElementById('konaCount');
  const event = window.__ENTRY_EVENT || {};
  if (!el || !event.date) return;
  const days = daysUntil(event.date);
  el.textContent = days === 0 ? 'Race day in Kona' : days === 1 ? 'Kona in 1 day' : `Kona in ${days} days`;
}

let opening = null;
function openMuseum(room) {
  document.body.classList.add('museum-open');
  const btn = document.getElementById('enterBtn');
  if (btn && !window.__museum) btn.innerHTML = 'Opening the coast…';
  if (!opening) {
    opening = ensureWorldShell()
      .then(() => ensureMuseumData())
      .then(() => loadScript('app/hall.js'))
      .then(() => window.__museum?.enter?.())
      .catch(err => { opening = null; console.warn('museum', err); });
  }
  if (typeof room === 'string') {
    opening.then(() => setTimeout(() => window.__museumGo?.(room), 600));
  }
  return opening;
}

initAppShell();
const shell = initKonaShell({ profile, settings: settingsUI, enter: openMuseum });
window.__konaShell = shell;

function enterApp(first = 'home') {
  setEntryMode('app');
  intro?.setAttribute('hidden','');
  if (first === 'garage') shell.garage?.();
  else if (first === 'collection') shell.collection?.();
  else if (first === 'discover') shell.explore?.();
  else if (first === 'plan') shell.plan?.();
  else if (first === 'me') shell.me?.();
  else shell.now?.();
}

function paintIntent() {
  let cur = '';
  try { cur = readStorage('entryIntent') || ''; } catch (_) {}
  document.querySelectorAll('[data-intent]').forEach(b => {
    const on = b.dataset.intent === cur;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

document.querySelectorAll('#intro [data-go]').forEach(b => b.addEventListener('click', () => {
  const id = b.dataset.go;
  if (id === 'explore') openMuseum();
  else shell[id]?.();
}));

function readQuest() {
  try { return { ...emptyQuest(), ...JSON.parse(readStorage('konaSelf') || '{}') }; }
  catch (_) { return emptyQuest(); }
}
function writeQuest(draft) {
  try { writeStorage('konaSelf', JSON.stringify(draft)); } catch (_) {}
  try { if (draft.intent) writeStorage('entryIntent', draft.intent); } catch (_) {}
}

function questHost() {
  const inner = document.querySelector('#intro .intro-inner');
  if (!inner) return null;
  let host = document.getElementById('konaQuest');
  if (!host) {
    host = document.createElement('div');
    host.id = 'konaQuest';
    inner.append(host);
  }
  return host;
}

function paintQuest(step) {
  setEntryMode('quest');
  const host = questHost();
  const draft = readQuest();
  if (!host) return;
  const choices = (items, key) => items.map(item => {
    const id = item.id || item;
    const label = item.label || item;
    const on = draft[key] === id ? ' on' : '';
    return `<button type="button" class="quest-choice${on}" data-set="${key}" data-value="${id}">${label}</button>`;
  }).join('');
  const stepNo={intent:1,races:2,bike:3,shoe:4,goal:5};
  const progress=stepNo[step] ? `<div class="quest-progress" aria-label="Step ${stepNo[step]} of 5"><span>${stepNo[step]} / 5</span><i style="--p:${stepNo[step]}"></i></div>` : '';
  const backFor={races:'intent',bike:'races',shoe:'bike',goal:'shoe'};
  const questNav = step === 'intent'
    ? '<div class="quest-nav"><button type="button" class="btn text" data-quest-cancel>Back</button><button type="button" class="btn text" data-quest-skip>Skip for now</button></div>'
    : '<div class="quest-nav"><button type="button" class="btn text" data-quest-back>Back</button><button type="button" class="btn text" data-quest-skip>Skip for now</button></div>';
  const screens = {
    intent: `<p class="eyebrow">Why are you here?</p><div class="kona-intents">${choices(INTENTS, 'intent')}</div>`,
    races: `<p class="eyebrow">Your races</p><p class="kona-note">Search any IRONMAN or IRONMAN 70.3 edition from the last 10 years. These become badges in your Race Self, Garage and Studio.</p><div data-race-picker></div><button type="button" class="btn primary race-picker-continue" data-race-continue>Continue</button>`,
    bike: `<p class="eyebrow">Choose your bike</p><div class="kona-intents">${choices(BIKES, 'bikeId')}</div><button type="button" class="quest-choice" data-set="bikeId" data-value="">Choose later</button>`,
    shoe: `<p class="eyebrow">Choose your shoes</p><div class="kona-intents">${choices(SHOES, 'shoeId')}</div><button type="button" class="quest-choice" data-set="shoeId" data-value="">Choose later</button><p class="kona-note">The Alphafly here is an independent study, not a catalog shoe yet.</p>`,
    goal: `<p class="eyebrow">What would make Kona a win?</p><div class="kona-intents">${choices(GOALS, 'goal')}</div>`,
    reveal: '',
  };
  if (step === 'reveal' && questReady(draft)) {
    // Identity and entry are the primary transaction. Progression is a bonus and
    // must never strand a user on onboarding if reward state is unavailable/corrupt.
    saveQuestIdentity(draft);
    const labels = questLabels(draft);
    const bike = labels.bike;
    const shoe = labels.shoe;
    let xp = 0, credits = 0;
    try {
      const progression = applyStoredEvent({ type: 'RACE_IDENTITY_CREATED', subject: 'kona-2026' });
      const reward = progression?.history?.at?.(-1);
      if (reward?.type === 'RACE_IDENTITY_CREATED') {
        xp = Number(reward.xp) || 0;
        credits = Number(reward.credits) || 0;
      }
    } catch (err) {
      console.warn('progression reward unavailable; RaceIdentity remains valid', err);
    }
    host.innerHTML = `<p class="eyebrow">This is your Kona</p>
      <section class="race-id-card" aria-label="Your 2026 Kona RaceIdentity">
        <div class="race-id-mast"><span>KONA</span><b>2026</b></div>
        <p class="race-id-human">Well. This could get interesting.</p>
        <div class="race-id-goal">${draft.goal}</div>
        <dl class="race-id-meta">
          <div><dt>Bike</dt><dd>${bike}</dd></div>
          <div><dt>Shoes</dt><dd>${shoe}</dd></div>
        </dl>
        <div class="race-id-stamp">RACE SELF</div>
      </section>
      <p class="race-id-reward">+${xp} XP · +${credits} KONA CREDITS</p>
      <button type="button" class="btn primary" id="enterKona">Enter KONA</button>
      <button type="button" class="btn secondary" id="shareSelf">Share my Kona</button>
      <button type="button" class="btn text" id="saveSelf">Save across devices</button>
      <p class="kona-note" id="saveNote">Your Kona is already safe on this device.</p>`;
    host.querySelector('#enterKona')?.addEventListener('click', () => enterApp('home'));
    host.querySelector('#shareSelf')?.addEventListener('click', async () => {
      const note = host.querySelector('#saveNote');
      const result = await shareRaceIdentity(draft);
      if (note && result.method === 'clipboard') note.textContent = 'Link copied. Your friend can open this setup and build their own.';
      if (note && result.reason === 'cancelled') note.textContent = 'Share cancelled. Nothing was posted.';
    });
    host.querySelector('#saveSelf')?.addEventListener('click', () => paintQuest('save'));
    return;
  }
  if (step === 'save') {
    host.innerHTML = `<p class="eyebrow">Sign in or save</p><form id="saveForm"><input name="email" type="email" required placeholder="you@example.com" autocomplete="email"><button class="btn primary" type="submit">Send magic link</button></form><button class="btn text" type="button" id="continueLocal">Continue without account</button><button class="btn text" type="button" id="backFromSave">Back</button><p class="kona-note" id="saveNote">No password. Your local experience works without signing in.</p>`;
    host.querySelector('#continueLocal')?.addEventListener('click', enterApp);
    host.querySelector('#backFromSave')?.addEventListener('click',()=>{ const q=readQuest(); paintQuest(questReady(q)?'reveal':'intent'); });
    host.querySelector('#saveForm')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = new FormData(event.currentTarget).get('email');
      const note = host.querySelector('#saveNote');
      try {
        const { sendMagicLink } = await import('./cloud/supabase-lite.js');
        await sendMagicLink(email);
        if (note) note.textContent = 'Check your email. Your Kona is already on this device.';
      } catch (err) {
        if (note) note.textContent = 'The link could not be sent. Your Kona is still saved on this device.';
      }
    });
    return;
  }
  host.hidden = false;
  host.innerHTML = progress + (screens[step] || screens.intent) + questNav;
  if (step === 'races') {
    renderRacePicker(host.querySelector('[data-race-picker]'));
    host.querySelector('[data-race-continue]')?.addEventListener('click',()=>paintQuest('bike'));
  }
  host.querySelector('[data-quest-back]')?.addEventListener('click',()=>paintQuest(backFor[step]||'intent'));
  host.querySelector('[data-quest-cancel]')?.addEventListener('click',()=>{ setEntryMode('landing'); host.hidden=true; });
  host.querySelector('[data-quest-skip]')?.addEventListener('click',enterApp);
  host.querySelectorAll('[data-set]').forEach(button => button.addEventListener('click', () => {
    const next = readQuest();
    next[button.dataset.set] = button.dataset.value || null;
    writeQuest(next);
    const order = ['intent', 'races', 'bike', 'shoe', 'goal', 'reveal'];
    const i = order.indexOf(step);
    paintQuest(order[i + 1] || 'reveal');
  }));
}

function existingRaceIdentity() {
  try {
    const raw = readStorage('raceIdentity');
    const value = raw ? JSON.parse(raw) : null;
    return value?.entity_type === 'race-identity' && value?.event_id ? value : null;
  } catch (_) { return null; }
}

document.getElementById('entrySignIn')?.addEventListener('click', () => paintQuest('save'));

setEntryMode('landing');
const existingIdentity = existingRaceIdentity();
const buildButton = document.getElementById('buildSelf');
if (existingIdentity) {
  const lede = document.querySelector('#intro .lede');
  const note = document.querySelector('#intro .kona-note');
  if (lede) lede.textContent = existingIdentity.goal?.label
    ? `Your Kona is saved. Next: ${existingIdentity.goal.label}.`
    : 'Your Kona is saved. Pick up where you left off.';
  if (buildButton) {
    buildButton.textContent = 'Continue your Kona';
    buildButton.addEventListener('click', enterApp);
  }
  if (note) note.textContent = 'Your RaceIdentity stays private on this device unless you choose to save or share it.';
} else {
  buildButton?.addEventListener('click', () => paintQuest('intent'));
}
paintIntent();
entryDataReady.then(data=>{ window.__ENTRY_DATA=data||{}; window.__ENTRY_EVENT=data?.event||{}; paintCount(); }).catch(()=>{});

function paintShared(draft){
  const host=questHost(); if(!host) return;
  const labels=questLabels(draft);
  host.innerHTML=`<p class="eyebrow">A Kona setup</p><h2>${labels.bike}</h2><p>${labels.shoe}</p><p>${labels.goal}</p><p class="kona-note">Someone shared this setup with you. Build yours to make it your own.</p><button class="btn primary" id="buildShared" type="button">Build yours</button>`;
  host.querySelector('#buildShared')?.addEventListener('click',()=>paintQuest('intent'));
}
const q = new URLSearchParams(location.search);
const shared=decodeShare(q.get('kona'));
if(shared) paintShared(shared);
else if (q.get('room') || q.get('map')) openMuseum();
else if (authReturned) enterApp('home');
else if (['home','garage','collection','discover','plan','me'].includes(q.get('view'))) enterApp(q.get('view'));
