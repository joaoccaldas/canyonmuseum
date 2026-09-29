// museum/passport.js — the local-first Museum Passport: which bikes you have discovered, how often you
// came, where you stood last. One localStorage record; the profile's export/delete covers it.
const PASSPORT_KEY = 'speedmax.passport.v1';
export function readPassport() {
  try {
    const raw = JSON.parse(localStorage.getItem(PASSPORT_KEY) || 'null');
    if (raw?.v === 1 && Array.isArray(raw.discoveries)) return raw;
  } catch (_) { }
  return { v: 1, discoveries: [], visits: 0, pose: null };
}
export function writePassport(passport) {
  try { localStorage.setItem(PASSPORT_KEY, JSON.stringify(passport)); } catch (_) { }
}
