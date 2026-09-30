// KONA entry. HTML is already on screen. This file does not import Three.js.
// The museum runtime loads only after the visitor chooses to explore.
import { createProfile } from './engine/profile.js';
import { initKonaShell } from './ui/kona-shell.js';
import { initAppShell } from './app-shell.js';
import { applyStoredEvent } from './engine/progression.js';
import { saveQuestIdentity } from './engine/identity.js';
import { readStorage } from './engine/storage.js';
import { BIKES, GOALS, INTENTS, SHOES, decodeShare, emptyQuest, questLabels, questReady, relationshipFor } from './quest.js';
import { shareRaceIdentity } from './growth/share.js';

const INTENT_KEY = 'speedmax.entryIntent.v1';
const profile = createProfile();
const settingsBridge = { open() {} };
window.__konaSettingsBridge = settingsBridge;

const loads = new Map();
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

const dataReady = loadScript('app/museum-data.js');

function daysUntil(iso) {
  const n = Math.ceil((new Date(iso + 'T12:00:00') - Date.now()) / 86400000);
  return Number.isFinite(n) ? Math.max(0, n) : null;
}

function paintCount() {
  const el = document.getElementById('konaCount');
  const event = window.__EVENT?.current_facts?.event || window.__ISLAND?.race_2026 || {};
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
    opening = dataReady
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

document.getElementById('entryInstall')?.addEventListener('click', () => document.getElementById('installBtn')?.click());
const shell = initKonaShell({ profile, settings: settingsBridge, enter: openMuseum });
window.__konaShell = shell;

function paintIntent() {
  let cur = '';
  try { cur = localStorage.getItem(INTENT_KEY) || ''; } catch (_) {}
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

const QUEST_KEY = 'speedmax.konaSelf.v1';
function readQuest() {
  try { return { ...emptyQuest(), ...JSON.parse(localStorage.getItem(QUEST_KEY) || '{}') }; }
  catch (_) { return emptyQuest(); }
}
function writeQuest(draft) {
  try { localStorage.setItem(QUEST_KEY, JSON.stringify(draft)); } catch (_) {}
  try { if (draft.intent) localStorage.setItem(INTENT_KEY, draft.intent); } catch (_) {}
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
  const host = questHost();
  const draft = readQuest();
  if (!host) return;
  const choices = (items, key) => items.map(item => {
    const id = item.id || item;
    const label = item.label || item;
    const on = draft[key] === id ? ' on' : '';
    return `<button type="button" class="quest-choice${on}" data-set="${key}" data-value="${id}">${label}</button>`;
  }).join('');
  const screens = {
    intent: `<p class="eyebrow">Why are you here?</p><div class="kona-intents">${choices(INTENTS, 'intent')}</div>`,
    bike: `<p class="eyebrow">Choose your bike</p><div class="kona-intents">${choices(BIKES, 'bikeId')}</div><button type="button" class="quest-choice" data-set="bikeId" data-value="">Choose later</button>`,
    shoe: `<p class="eyebrow">Choose your shoes</p><div class="kona-intents">${choices(SHOES, 'shoeId')}</div><button type="button" class="quest-choice" data-set="shoeId" data-value="">Choose later</button><p class="kona-note">The Alphafly here is an independent study, not a catalog shoe yet.</p>`,
    goal: `<p class="eyebrow">What would make Kona a win?</p><div class="kona-intents">${choices(GOALS, 'goal')}</div>`,
    reveal: '',
  };
  if (step === 'reveal' && questReady(draft)) {
    saveQuestIdentity(draft);
    const granted = applyStoredEvent({ type: 'RACE_IDENTITY_CREATED', subject: 'kona-2026' });
    const labels = questLabels(draft);
    const bike = labels.bike;
    const shoe = labels.shoe;
    const xp = granted.history?.at?.(-1)?.xp ?? 0;
    const credits = granted.history?.at?.(-1)?.credits ?? 0;
    host.innerHTML = `<p class="eyebrow">This is your Kona</p><h2>${bike}</h2><p>${shoe}</p><p>${draft.goal}</p><p class="kona-count">+${xp} XP · +${credits} Kona Credits</p><button type="button" class="btn primary" id="shareSelf">Share my Kona</button><button type="button" class="btn primary" id="saveSelf">Save your Kona</button><p class="kona-note" id="saveNote"></p>`;
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
    host.innerHTML = `<p class="eyebrow">Save your Kona</p><form id="saveForm"><input name="email" type="email" required placeholder="you@example.com" autocomplete="email"><button class="btn primary" type="submit">Send magic link</button></form><p class="kona-note" id="saveNote">No password. The passport reward waits until the link is confirmed.</p>`;
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
  host.innerHTML = screens[step] || screens.intent;
  host.querySelectorAll('[data-set]').forEach(button => button.addEventListener('click', () => {
    const next = readQuest();
    next[button.dataset.set] = button.dataset.value || null;
    writeQuest(next);
    const order = ['intent', 'bike', 'shoe', 'goal', 'reveal'];
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
    buildButton.addEventListener('click', () => shell.now?.());
  }
  if (note) note.textContent = 'Your RaceIdentity stays private on this device unless you choose to save or share it.';
} else {
  buildButton?.addEventListener('click', () => paintQuest('intent'));
}
paintIntent();
dataReady.then(paintCount).catch(() => {});

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
