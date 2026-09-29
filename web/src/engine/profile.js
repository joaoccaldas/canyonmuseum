// engine/profile.js — the visitor's profile and settings.
//
// On-device by default: one JSON record in localStorage, no server, no tracking. Sync across devices
// is optional and plugs in as another store with the same two methods (load/save); see
// docs/APP.md § Accounts. Everything the app remembers about a visitor lives here, so "export" and
// "delete everything" are one call each.
const KEY = 'speedmax.profile.v1';
const LEGACY = ['speedmax.passport.v1', 'speedmax.finds.v1', 'speedmax.coach.v1', 'speedmax.atlas.hint'];

// Render presets. `lite` trims geometry at build time (a reload applies it); DPR and shadows apply live.
export const QUALITY = {
  auto: { label: 'Auto', note: 'Chosen for this device' },
  high: { label: 'High', note: 'Full detail, sharpest image', lite: false, dpr: 2, flowDpr: 1.65, shadows: true },
  balanced: { label: 'Balanced', note: 'Smooth on laptops', dpr: 1.5, flowDpr: 1.2, shadows: true },
  low: { label: 'Low', note: 'Phones and older computers; saves battery and data', lite: true, dpr: 1, flowDpr: .85, shadows: false },
};
export const AVATARS = ['#e8471c', '#138a8f', '#1d4fd6', '#c9a13b', '#ff3d8e', '#12181d', '#5fd8d3', '#8a3316'];

export const defaults = () => ({
  v: 1, name: '', avatar: AVATARS[0], quality: 'auto', sound: false, motion: 'auto', units: 'metric',
  favourites: [], createdAt: new Date().toISOString(), sync: null,
});

/** Validate/normalise a stored profile; unknown fields are dropped, bad values fall back to defaults. Pure. */
export function normalise(p) {
  const d = defaults(), o = p && typeof p === 'object' ? p : {};
  return {
    v: 1,
    name: typeof o.name === 'string' ? o.name.trim().slice(0, 40) : d.name,
    avatar: AVATARS.includes(o.avatar) ? o.avatar : d.avatar,
    quality: o.quality in QUALITY ? o.quality : d.quality,
    sound: !!o.sound,
    motion: ['auto', 'full', 'reduced'].includes(o.motion) ? o.motion : d.motion,
    units: ['metric', 'imperial'].includes(o.units) ? o.units : d.units,
    favourites: Array.isArray(o.favourites) ? [...new Set(o.favourites.filter(x => typeof x === 'string'))].slice(0, 500) : [],
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : d.createdAt,
    sync: o.sync && typeof o.sync === 'object' ? { provider: String(o.sync.provider || ''), email: String(o.sync.email || '') } : null,
  };
}

/** The render settings a profile asks for on this device. Pure. */
export function renderSettings(quality, device) {
  const q = QUALITY[quality] || QUALITY.auto;
  const lite = q.lite ?? device.lite;
  const cap = q.dpr ?? (device.lite ? 1.45 : 2), flowCap = q.flowDpr ?? (device.lite ? 1.12 : 1.65);
  return { lite, dpr: Math.min(device.dpr, cap), flowDpr: Math.min(device.dpr, flowCap), shadows: q.shadows ?? !lite };
}

export const localStore = {
  load() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { return null; } },
  save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); return true; } catch (_) { return false; } },
  clear() { try { localStorage.removeItem(KEY); for (const k of LEGACY) localStorage.removeItem(k); } catch (_) { } },
};

export function createProfile(store = localStore) {
  let p = normalise(store.load());
  const exists = !!store.load();
  const subs = new Set();
  const emit = () => subs.forEach(f => f(p));
  return {
    get: () => p,
    get exists() { return exists || !!p.name; },
    set(patch) { p = normalise({ ...p, ...patch }); store.save(p); emit(); return p; },
    toggleFavourite(id) { const f = new Set(p.favourites); f.has(id) ? f.delete(id) : f.add(id); return this.set({ favourites: [...f] }); },
    subscribe(f) { subs.add(f); return () => subs.delete(f); },
    export() {                                                        // everything the app stores about you, as one file
      const extra = {}; try { for (const k of LEGACY) extra[k] = localStorage.getItem(k); } catch (_) { }
      return JSON.stringify({ profile: p, stored: extra, exported: new Date().toISOString() }, null, 1);
    },
    erase() { store.clear(); p = normalise(null); emit(); },
  };
}
