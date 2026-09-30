// engine/game-state.js — canonical serialization boundary for the Kona app.
//
// Existing domain modules remain the runtime owners of validation and behavior. This facade makes
// profile, Passport/progression, finds, RaceSetup and Garage one versioned object for cloud sync,
// privacy export and future migration without breaking the proven museum.
export const GAME_STATE_SCHEMA_VERSION = 1;

export const STATE_KEYS = Object.freeze({
  profile: 'speedmax.profile.v1',
  passport: 'speedmax.passport.v1',
  finds: 'speedmax.finds.v1',
  raceSetup: 'speedmax.raceSetup.v1',
  garage: 'speedmax.garage.v1',
});

const parse = (raw, fallback) => {
  try { const v = JSON.parse(raw); return v && typeof v === 'object' ? v : fallback; }
  catch (_) { return fallback; }
};
const clone = v => JSON.parse(JSON.stringify(v));

export function readGameState(storage = globalThis.localStorage) {
  const get = k => {
    try { return storage?.getItem?.(k) ?? null; } catch (_) { return null; }
  };
  const profile = parse(get(STATE_KEYS.profile), null);
  const passport = parse(get(STATE_KEYS.passport), { v:1, profile:null, stamps:{}, badges:{}, xp:0, streak:0, best:0, last:null });
  const finds = parse(get(STATE_KEYS.finds), {});
  const raceSetup = parse(get(STATE_KEYS.raceSetup), null);
  const garage = parse(get(STATE_KEYS.garage), []);
  return {
    schema_version: GAME_STATE_SCHEMA_VERSION,
    exported_at: new Date().toISOString(),
    profile: profile ? clone(profile) : null,
    progression: clone(passport),
    finds: clone(finds),
    race_setup: raceSetup ? clone(raceSetup) : null,
    garage: Array.isArray(garage) ? clone(garage) : [],
  };
}

export function writeGameState(snapshot, storage = globalThis.localStorage) {
  if (!snapshot || snapshot.schema_version !== GAME_STATE_SCHEMA_VERSION) throw new Error('Unsupported game state');
  const put = (key, value) => {
    try {
      if (value == null) storage?.removeItem?.(key);
      else storage?.setItem?.(key, JSON.stringify(value));
    } catch (e) { throw new Error('Unable to persist game state'); }
  };
  put(STATE_KEYS.profile, snapshot.profile);
  put(STATE_KEYS.passport, snapshot.progression);
  put(STATE_KEYS.finds, snapshot.finds || {});
  put(STATE_KEYS.raceSetup, snapshot.race_setup);
  put(STATE_KEYS.garage, Array.isArray(snapshot.garage) ? snapshot.garage : []);
  return readGameState(storage);
}

export function gameProgress(snapshot = readGameState()) {
  const p = snapshot?.progression || {};
  const stamps = p.stamps && typeof p.stamps === 'object' ? p.stamps : {};
  const badges = p.badges && typeof p.badges === 'object' ? p.badges : {};
  const count = prefix => Object.keys(stamps).filter(k => k.startsWith(prefix)).length;
  return {
    xp: Math.max(0, Number(p.xp) || 0),
    streak: Math.max(0, Number(p.streak) || 0),
    best: Math.max(0, Number(p.best) || 0),
    stamps: Object.keys(stamps).length,
    badges: Object.keys(badges).length,
    bikes: count('bike:'),
    konaYears: count('kona:'),
    hidden: count('find:'),
    parts: count('part:'),
    garage: Array.isArray(snapshot?.garage) ? snapshot.garage.length : 0,
  };
}
