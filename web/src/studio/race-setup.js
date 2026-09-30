// studio/race-setup.js — My Kona Setup V0.
// Pure/local-first composition state. References product ids and existing Studio look payloads;
// it never embeds brand-specific logic or executable content.
export const RACE_SETUP_KEY = 'speedmax.raceSetup.v1';
export const RACE_SETUP_EVENT = 'kona-2026';
export const RACE_SETUP_SLOTS = ['bike', 'wheels', 'helmet', 'shoes'];
const SCENE_IDS = new Set(['studio','kona','lava','night','velodrome','film']);

const b64u = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64u = s => decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/'))));

export function emptyRaceSetup() {
  return {
    version: 1,
    event: RACE_SETUP_EVENT,
    bike: null,
    wheels: null,
    helmet: null,
    shoes: null,
    updatedAt: 0,
  };
}

export function normaliseRaceSetup(value, products = []) {
  const out = emptyRaceSetup();
  const o = value && typeof value === 'object' ? value : {};
  const ids = new Set((products || []).map(p => p.id));
  if (o.event === RACE_SETUP_EVENT) out.event = o.event;
  if (o.bike && typeof o.bike === 'object' && typeof o.bike.productId === 'string' && ids.has(o.bike.productId)) {
    const look = typeof o.bike.look === 'string' && o.bike.look.length <= 600 ? o.bike.look : '';
    const scene = SCENE_IDS.has(o.bike.scene) ? o.bike.scene : 'kona';
    out.bike = { productId: o.bike.productId, look, scene };
    out.wheels = { source: 'bike', productId: o.bike.productId };
  }
  // V0 deliberately accepts no external equipment ids yet. Empty slots are structural sockets.
  out.updatedAt = Number.isFinite(+o.updatedAt) ? Math.max(0, +o.updatedAt) : 0;
  return out;
}

export function setupFromBike(product, lookPayload = '', scene = 'kona') {
  if (!product?.id) return emptyRaceSetup();
  return normaliseRaceSetup({
    version: 1,
    event: RACE_SETUP_EVENT,
    bike: { productId: product.id, look: typeof lookPayload === 'string' ? lookPayload : '', scene },
    updatedAt: Date.now(),
  }, [product]);
}

export function readRaceSetup(products, storage = globalThis.localStorage) {
  try { return normaliseRaceSetup(JSON.parse(storage?.getItem?.(RACE_SETUP_KEY) || 'null'), products); }
  catch (_) { return emptyRaceSetup(); }
}

export function writeRaceSetup(setup, products, storage = globalThis.localStorage) {
  const clean = normaliseRaceSetup({ ...setup, updatedAt: Date.now() }, products);
  try { storage?.setItem?.(RACE_SETUP_KEY, JSON.stringify(clean)); return clean; }
  catch (_) { return clean; }
}

export function encodeRaceSetup(setup, products) {
  const clean = normaliseRaceSetup(setup, products);
  if (!clean.bike) return '';
  const payload = {
    v: 1,
    e: clean.event,
    b: { p: clean.bike.productId, s: clean.bike.look || '', c: clean.bike.scene || 'kona' }
  };
  return b64u(JSON.stringify(payload));
}

export function decodeRaceSetup(encoded, products) {
  if (!encoded || typeof encoded !== 'string' || encoded.length > 1200) return null;
  let o; try { o = JSON.parse(unb64u(encoded)); } catch (_) { return null; }
  if (!o || o.v !== 1 || o.e !== RACE_SETUP_EVENT || !o.b || typeof o.b !== 'object') return null;
  const raw = {
    version: 1,
    event: o.e,
    bike: {
      productId: typeof o.b.p === 'string' ? o.b.p : '',
      look: typeof o.b.s === 'string' ? o.b.s : '',
      scene: typeof o.b.c === 'string' ? o.b.c : 'kona',
    },
    updatedAt: 0,
  };
  const clean = normaliseRaceSetup(raw, products);
  return clean.bike ? clean : null;
}

export function completedSlots(setup) {
  const s = setup || emptyRaceSetup();
  return RACE_SETUP_SLOTS.filter(k => !!s[k]).length;
}
