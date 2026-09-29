// engine/progression.js — pure retention logic shared by Museum and Studio.
// Reads the existing Passport state but never writes it. Product rewards should be deterministic,
// local-first and explainable: exploration unlocks capacity and presentation, never paywalled content.
export const PASSPORT_KEY = 'speedmax.passport.v1';

export function normalisePassport(value) {
  const o = value && typeof value === 'object' ? value : {};
  const stamps = o.stamps && typeof o.stamps === 'object' && !Array.isArray(o.stamps) ? o.stamps : {};
  const badges = o.badges && typeof o.badges === 'object' && !Array.isArray(o.badges) ? o.badges : {};
  return {
    v: 1,
    stamps,
    badges,
    xp: Math.max(0, Number(o.xp) || 0),
    streak: Math.max(0, Number(o.streak) || 0),
    best: Math.max(0, Number(o.best) || 0),
    last: typeof o.last === 'string' ? o.last.slice(0, 10) : null,
  };
}

export function readPassportState(storage = globalThis.localStorage) {
  try { return normalisePassport(JSON.parse(storage?.getItem?.(PASSPORT_KEY) || 'null')); }
  catch (_) { return normalisePassport(null); }
}

export const stampCount = state => Object.keys(normalisePassport(state).stamps).length;
export const badgeCount = state => Object.keys(normalisePassport(state).badges).length;

/** Three slots are free. Exploration unlocks up to nine without taking existing features away. */
export function garageCapacity(state) {
  const s = normalisePassport(state);
  return Math.min(9, 3 + Math.floor(stampCount(s) / 12) + Math.min(2, badgeCount(s)) + (s.best >= 7 ? 1 : 0));
}

/** Stable local daily pick. UTC date is intentional so shared screenshots point at the same exhibit. */
export function dailyProduct(products, date = new Date()) {
  if (!Array.isArray(products) || !products.length) return null;
  const day = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 864e5;
  const idx = ((Math.trunc(day) % products.length) + products.length) % products.length;
  return products[idx];
}

export function nextGarageUnlock(state) {
  const s = normalisePassport(state), cap = garageCapacity(s);
  if (cap >= 9) return null;
  const stamps = stampCount(s), badges = badgeCount(s);
  const nextStamp = (Math.floor(stamps / 12) + 1) * 12;
  if (badges < 2 && stamps >= nextStamp - 5) return { kind: 'badge-or-stamps', remaining: nextStamp - stamps };
  return { kind: 'stamps', remaining: Math.max(1, nextStamp - stamps) };
}
