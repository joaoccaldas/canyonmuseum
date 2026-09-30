// Progression V1. Access, XP, collection and Kona Credits stay separate.
// Rewards come from events. UI code does not add XP itself.
// Rarity is fixed on the collectible. Nothing here is random or paid.

export const PROGRESSION_KEY = 'speedmax.progression.v1';

export const TIERS = ['visitor', 'passport', 'athlete'];

export const LEVELS = [
  { level: 1, name: 'Visitor', xp: 0 },
  { level: 2, name: 'Explorer', xp: 40 },
  { level: 3, name: 'Collector', xp: 100 },
  { level: 4, name: 'Racer', xp: 200 },
  { level: 5, name: 'Kona Rookie', xp: 350 },
  { level: 6, name: 'Lava Runner', xp: 550 },
  { level: 7, name: 'Queen K Veteran', xp: 800 },
  { level: 8, name: 'Archivist', xp: 1100 },
  { level: 9, name: 'Legend', xp: 1500 },
  { level: 10, name: 'Kahuna', xp: 2000 },
];

export const EVENTS = {
  FIRST_VISIT: { xp: 25, credits: 0 },
  PRODUCT_VIEWED: { xp: 5, credits: 0 },
  PRODUCT_EXPLODED: { xp: 10, credits: 0 },
  ROOM_ENTERED: { xp: 0, credits: 0 },
  ROOM_COMPLETED: { xp: 25, credits: 40 },
  EQUIPMENT_ADDED: { xp: 15, credits: 0 },
  DREAM_EQUIPMENT_ADDED: { xp: 10, credits: 0 },
  RACE_IDENTITY_CREATED: { xp: 100, credits: 200 },
  SETUP_SHARED: { xp: 0, credits: 0 },
  REFERRAL_ACTIVATED: { xp: 150, credits: 250 },
  CHALLENGE_COMPLETED: { xp: 50, credits: 80 },
  STRAVA_CONNECTED: { xp: 20, credits: 0 },
  PASSPORT_CREATED: { xp: 250, credits: 500 },
  FIND_DISCOVERED: { xp: 0, credits: 0 },
  CURRENCY_SPENT: { xp: 0, credits: 0 },
};

const RARITY = {
  common: { xp: 50, credits: 80 },
  uncommon: { xp: 80, credits: 150 },
  rare: { xp: 200, credits: 400 },
  epic: { xp: 750, credits: 1200 },
  legendary: { xp: 1500, credits: 2500 },
  mythic: { xp: 2000, credits: 4000 },
};

// Nine night-experience finds, plus the five shoreline objects already in the hall.
// Each reward is fixed. Finding one twice does not pay twice.
export const COLLECTIBLES = [
  { id: 'find:lava:raven', name: 'The raven', rarity: 'uncommon', place: 'lava' },
  { id: 'find:lava:gel', name: 'Pumpkin-spice gel', rarity: 'common', place: 'lava' },
  { id: 'find:lava:spoke', name: 'The golden spoke', rarity: 'epic', place: 'lava' },
  { id: 'find:camp13:whistle', name: 'The counselor’s whistle', rarity: 'uncommon', place: 'camp13' },
  { id: 'find:camp13:flashlight', name: 'A flashlight', rarity: 'common', place: 'camp13' },
  { id: 'find:camp13:mini-mask', name: 'Mini goalie mask keyring', rarity: 'rare', place: 'camp13' },
  { id: 'find:tunnel:tuft', name: 'A wool tuft', rarity: 'uncommon', place: 'tunnel' },
  { id: 'find:tunnel:wand', name: 'The smoke wand', rarity: 'rare', place: 'tunnel' },
  { id: 'find:tunnel:stopwatch', name: 'A stopwatch, still running', rarity: 'legendary', place: 'tunnel' },
  { id: 'find:shore:plumeria', name: 'A plumeria', rarity: 'common', place: 'shore' },
  { id: 'find:shore:cowrie', name: 'A cowrie', rarity: 'uncommon', place: 'shore' },
  { id: 'find:shore:lava', name: 'A lava stone', rarity: 'common', place: 'shore' },
  { id: 'find:shore:coral', name: 'Black coral', rarity: 'rare', place: 'shore' },
  { id: 'find:shore:bib', name: 'A race bib', rarity: 'epic', place: 'shore' },
];

export const UNLOCKS = [
  {
    id: 'unlock:arrival-badge',
    requirements: [{ type: 'tier', min: 'passport' }],
    reward: { type: 'badge', id: 'arrival' },
  },
  {
    id: 'unlock:archive-frame',
    requirements: [
      { type: 'level', min: 4 },
      { type: 'collection', prefix: 'find:', count: 5 },
    ],
    reward: { type: 'cosmetic', id: 'frame:archive' },
  },
];

const tierRank = t => Math.max(0, TIERS.indexOf(t));

export function levelFor(xp) {
  const n = Math.max(0, Number(xp) || 0);
  let cur = LEVELS[0];
  for (const row of LEVELS) if (n >= row.xp) cur = row;
  return cur;
}

export function emptyProgression() {
  return {
    schema: 'progression-v1',
    access_tier: 'visitor',
    xp: 0,
    level: 1,
    level_name: 'Visitor',
    streak: 0,
    discoveries: [],
    badges: [],
    unlocks: [],
    seen: [],
    ledger: [],
    credits: 0,
    history: [],
  };
}

export function collectibleById(id) {
  return COLLECTIBLES.find(c => c.id === id) || null;
}

function countPrefix(state, prefix) {
  return state.discoveries.filter(id => id.startsWith(prefix)).length;
}

export function canUnlock(state, unlock) {
  if (!state || !unlock || state.unlocks.includes(unlock.id)) return false;
  return unlock.requirements.every(req => {
    if (req.type === 'level') return state.level >= req.min;
    if (req.type === 'tier') return tierRank(state.access_tier) >= tierRank(req.min);
    if (req.type === 'collection') return countPrefix(state, req.prefix || req.id || '') >= req.count;
    return false;
  });
}

function withLevel(state) {
  const lv = levelFor(state.xp);
  state.level = lv.level;
  state.level_name = lv.name;
  state.credits = state.ledger.reduce((n, row) => n + row.delta, 0);
  return state;
}

export function applyEvent(state, event) {
  const base = state ? structuredClone(state) : emptyProgression();
  if (!event?.type || !EVENTS[event.type]) return { state: base, granted: null, error: 'unknown-event' };
  const id = String(event.id || `${event.type}:${event.subject || ''}`).slice(0, 80);
  if (!id || base.seen.includes(id)) return { state: base, granted: null, duplicate: true };

  let xp = EVENTS[event.type].xp;
  let credits = EVENTS[event.type].credits;
  let discovery = null;
  if (event.type === 'FIND_DISCOVERED') {
    const item = collectibleById(event.subject);
    if (!item) return { state: base, granted: null, error: 'unknown-collectible' };
    const pay = RARITY[item.rarity] || RARITY.common;
    xp = pay.xp;
    credits = pay.credits;
    discovery = item.id;
  }
  if (event.type === 'CURRENCY_SPENT') {
    const cost = Math.abs(Number(event.amount) || 0);
    if (!cost || base.credits < cost) return { state: base, granted: null, error: 'insufficient-credits' };
    credits = -cost;
    xp = 0;
  }
  if (event.type === 'PASSPORT_CREATED') base.access_tier = 'passport';
  if (event.type === 'EQUIPMENT_ADDED' && event.relationship === 'dream') {
    xp = EVENTS.DREAM_EQUIPMENT_ADDED.xp;
  }

  base.seen.push(id);
  base.xp += xp;
  if (credits) base.ledger.push({ id, delta: credits, reason: event.type });
  if (discovery && !base.discoveries.includes(discovery)) base.discoveries.push(discovery);
  if (event.discovery && !base.discoveries.includes(event.discovery)) base.discoveries.push(String(event.discovery));
  withLevel(base);
  const opened = [];
  for (const unlock of UNLOCKS) {
    if (canUnlock(base, unlock)) {
      base.unlocks.push(unlock.id);
      if (unlock.reward?.type === 'badge' && !base.badges.includes(unlock.reward.id)) base.badges.push(unlock.reward.id);
      opened.push(unlock.id);
    }
  }
  base.history.push({ id, type: event.type, xp, credits });
  if (base.history.length > 200) base.history.splice(0, base.history.length - 200);
  return { state: base, granted: { id, xp, credits, unlocks: opened } };
}

export function migratePassport({ passport = null, finds = [] } = {}) {
  const state = emptyProgression();
  if (passport && typeof passport === 'object') {
    if (typeof passport.xp === 'number') state.xp = Math.max(0, passport.xp);
    if (typeof passport.streak === 'number') state.streak = Math.max(0, passport.streak);
    if (passport.profile) state.access_tier = 'passport';
    if (Array.isArray(passport.discoveries)) {
      for (const key of passport.discoveries) {
        const id = `bike:${key}`;
        if (!state.discoveries.includes(id)) state.discoveries.push(id);
        state.seen.push(`migrate:${id}`);
      }
    }
    if (passport.stamps && typeof passport.stamps === 'object') {
      for (const key of Object.keys(passport.stamps)) {
        if (!state.discoveries.includes(key)) state.discoveries.push(key);
        state.seen.push(`FIND_DISCOVERED:${key}`);
        state.seen.push(`migrate:${key}`);
      }
    }
    if (passport.badges && typeof passport.badges === 'object') {
      for (const key of Object.keys(passport.badges)) if (!state.badges.includes(key)) state.badges.push(key);
    }
  }
  const ids = Array.isArray(finds) ? finds : Object.keys(finds || {});
  for (const id of ids) {
    const subject = collectibleById(id) ? id : `find:shore:${id}`;
    if (!collectibleById(subject)) continue;
    if (!state.discoveries.includes(subject)) state.discoveries.push(subject);
    state.seen.push(`FIND_DISCOVERED:${subject}`);
  }
  return withLevel(state);
}

export function readProgression(storage = globalThis.localStorage) {
  try {
    const raw = JSON.parse(storage?.getItem?.(PROGRESSION_KEY) || 'null');
    if (raw?.schema === 'progression-v1') return withLevel(raw);
  } catch (_) { /* keep going into migration */ }
  return null;
}

export function writeProgression(state, storage = globalThis.localStorage) {
  try { storage?.setItem?.(PROGRESSION_KEY, JSON.stringify(state)); } catch (_) { /* private mode */ }
  return state;
}

export function ensureProgression(storage = globalThis.localStorage) {
  const existing = readProgression(storage);
  if (existing) return existing;
  let passport = null;
  let finds = [];
  try { passport = JSON.parse(storage?.getItem?.('speedmax.passport.v1') || 'null'); } catch (_) {}
  try { finds = JSON.parse(storage?.getItem?.('speedmax.finds.v1') || '[]'); } catch (_) {}
  return writeProgression(migratePassport({ passport, finds }), storage);
}

export function applyStoredEvent(event, storage = globalThis.localStorage) {
  const { state } = applyEvent(ensureProgression(storage), event);
  return writeProgression(state, storage);
}
