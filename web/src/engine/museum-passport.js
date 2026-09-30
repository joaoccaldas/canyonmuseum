// Museum Passport compatibility boundary.
// Keeps the historical v1 payload while centralizing persistence so landing.js no longer owns raw keys.

export const PASSPORT_SCHEMA_VERSION = 1;

export function emptyMuseumPassport() {
  return { v: PASSPORT_SCHEMA_VERSION, discoveries: [], visits: 0, pose: null };
}

export function parseMuseumPassport(raw) {
  try {
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (value?.v !== PASSPORT_SCHEMA_VERSION || !Array.isArray(value.discoveries)) return emptyMuseumPassport();
    return {
      v: PASSPORT_SCHEMA_VERSION,
      discoveries: [...new Set(value.discoveries.filter(x => typeof x === 'string'))],
      visits: Math.max(0, Number(value.visits) || 0),
      pose: value.pose && typeof value.pose === 'object' ? value.pose : null,
    };
  } catch (_) {
    return emptyMuseumPassport();
  }
}

export function readMuseumPassport({ read } = {}) {
  if (typeof read !== 'function') return emptyMuseumPassport();
  return parseMuseumPassport(read());
}

export function writeMuseumPassport(passport, { write } = {}) {
  const clean = parseMuseumPassport(passport);
  if (typeof write === 'function') write(JSON.stringify(clean));
  return clean;
}

export function discoverMuseumItem(passport, key) {
  const clean = parseMuseumPassport(passport);
  if (!key || clean.discoveries.includes(key)) return { passport: clean, added: false };
  clean.discoveries.push(String(key));
  return { passport: clean, added: true };
}
