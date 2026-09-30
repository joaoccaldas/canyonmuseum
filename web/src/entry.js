// KONA entry. HTML is already on screen. This file does not import Three.js.
// The museum runtime loads only after the visitor chooses to explore.
import { createProfile } from './engine/profile.js';
import { initKonaShell } from './ui/kona-shell.js';
import { initAppShell } from './app-shell.js';
import { applyStoredEvent } from './engine/progression.js';
import { saveQuestIdentity } from './engine/identity.js';
import { confirmCandidate, rememberHistory, reviewCandidates } from './engine/identity-assist.js';
import { assistMarkup } from './ui/race-assist.js';
import { BIKES, GOALS, INTENTS, SHOES, emptyQuest, questReady, relationshipFor } from './quest.js';

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
    const bike = BIKES.find(b => b.id === draft.bikeId)?.label || 'Bike later';
    const shoe = SHOES.find(s => s.id === draft.shoeId)?.label || 'Shoes later';
    const xp = granted.history?.at?.(-1)?.xp ?? 0;
    const credits = granted.history?.at?.(-1)?.credits ?? 0;
    host.innerHTML = `<p class="eyebrow">This is your Kona</p><h2>${bike}</h2><p>${shoe}</p><p>${draft.goal}</p><p class="kona-count">+${xp} XP · +${credits} Kona Credits</p><button type="button" class="btn primary" id="shareSelf">Share my Kona</button><button type="button" class="btn primary" id="saveSelf">Save your Kona</button><p class="kona-note" id="saveNote"></p>`;
    host.querySelector('#shareSelf')?.addEventListener('click', async () => {
      const text = `${bike}. ${shoe}. ${draft.goal}.`;
      try {
        if (navigator.share) await navigator.share({ title: 'My Kona', text });
        else await navigator.clipboard.writeText(text);
      } catch (_) {}
      applyStoredEvent({ type: 'SETUP_SHARED', subject: 'kona-self' });
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

document.getElementById('buildSelf')?.addEventListener('click', () => paintQuest('intent'));
paintIntent();
dataReady.then(paintCount).catch(() => {});

function paintAssist(rows) {
  const host = questHost();
  if (!host || host.childElementCount) return;
  host.innerHTML = assistMarkup(rows);
  host.querySelector('#findRaces')?.addEventListener('click', () => {
    const note = host.querySelector('#assistNote');
    if (note) note.textContent = 'Public race search is not connected. No results were added.';
  });
  host.querySelectorAll('[data-confirm]').forEach(button => button.addEventListener('click', () => {
    const row = rows.find(item => item.id === button.dataset.confirm);
    const decided = confirmCandidate(row, 'thats-me');
    if (!decided.ok) return;
    rememberHistory(decided.history);
    button.textContent = 'Saved';
  }));
}

async function offerAssist() {
  try {
    const { currentUser } = await import('./cloud/supabase-lite.js');
    if (!await currentUser()) return;
    paintAssist(reviewCandidates({}, []));
  } catch (_) { /* still useful without an account */ }
}

const q = new URLSearchParams(location.search);
if (q.get('room') || q.get('map')) openMuseum();
offerAssist();
