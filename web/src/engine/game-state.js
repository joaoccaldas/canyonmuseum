// engine/game-state.js — canonical serialization boundary for the KONA app.
//
// Domain modules own validation and behavior. storage.js owns physical browser keys.
// This facade creates one backward-compatible snapshot for cloud sync and restore.
import { readStorage, writeStorage } from './storage.js';

export const GAME_STATE_SCHEMA_VERSION = 1;

const parse = (raw, fallback) => {
  try { const v = JSON.parse(raw); return v && typeof v === 'object' ? v : fallback; }
  catch (_) { return fallback; }
};
const clone = v => JSON.parse(JSON.stringify(v));

const readJson = (name, fallback, storage) => parse(readStorage(name, storage), fallback);
const writeJson = (name, value, storage) => writeStorage(name, value == null ? null : JSON.stringify(value), storage);

export function readGameState(storage = globalThis.localStorage) {
  const profile = readJson('profile', null, storage);
  const passport = readJson('passport', { v:1, profile:null, stamps:{}, badges:{}, xp:0, streak:0, best:0, last:null }, storage);
  const finds = readJson('finds', {}, storage);
  const raceSetup = readJson('raceSetup', null, storage);
  const garage = readJson('garage', [], storage);
  return {
    schema_version: GAME_STATE_SCHEMA_VERSION,
    exported_at: new Date().toISOString(),
    profile: profile ? clone(profile) : null,
    progression: clone(passport),
    finds: clone(finds),
    race_setup: raceSetup ? clone(raceSetup) : null,
    garage: Array.isArray(garage) ? clone(garage) : [],
    progression_engine: readJson('progression', null, storage),
    race_identity: readJson('raceIdentity', null, storage),
    user_equipment: readJson('userEquipment', [], storage),
    kona_self: readJson('konaSelf', null, storage),
    entry_intent: readJson('entryIntent', null, storage),
    race_history: readJson('raceHistory', [], storage),
  };
}

export function writeGameState(snapshot, storage = globalThis.localStorage) {
  if (!snapshot || snapshot.schema_version !== GAME_STATE_SCHEMA_VERSION) throw new Error('Unsupported game state');
  try {
    writeJson('profile', snapshot.profile, storage);
    writeJson('passport', snapshot.progression, storage);
    writeJson('finds', snapshot.finds || {}, storage);
    writeJson('raceSetup', snapshot.race_setup, storage);
    writeJson('garage', Array.isArray(snapshot.garage) ? snapshot.garage : [], storage);
    if ('progression_engine' in snapshot) writeJson('progression', snapshot.progression_engine, storage);
    if ('race_identity' in snapshot) writeJson('raceIdentity', snapshot.race_identity, storage);
    if ('user_equipment' in snapshot) writeJson('userEquipment', Array.isArray(snapshot.user_equipment) ? snapshot.user_equipment : [], storage);
    if ('kona_self' in snapshot) writeJson('konaSelf', snapshot.kona_self, storage);
    if ('entry_intent' in snapshot) writeJson('entryIntent', snapshot.entry_intent, storage);
    if ('race_history' in snapshot) writeJson('raceHistory', Array.isArray(snapshot.race_history) ? snapshot.race_history : [], storage);
  } catch (_) {
    throw new Error('Unable to persist game state');
  }
  return readGameState(storage);
}

export function gameProgress(snapshot = readGameState()) {
  const engine = snapshot?.progression_engine;
  if (engine?.schema === 'progression-v1') {
    const discoveries = Array.isArray(engine.discoveries) ? engine.discoveries : [];
    const count = prefix => discoveries.filter(k => k.startsWith(prefix)).length;
    return {
      xp: Math.max(0, Number(engine.xp) || 0),
      streak: Math.max(0, Number(engine.streak) || 0),
      best: Math.max(0, Number(engine.streak) || 0),
      stamps: discoveries.length,
      badges: Array.isArray(engine.badges) ? engine.badges.length : 0,
      bikes: count('bike:'),
      konaYears: count('kona:'),
      hidden: count('find:'),
      parts: count('part:'),
      garage: Array.isArray(snapshot?.user_equipment) && snapshot.user_equipment.length
        ? snapshot.user_equipment.length
        : Array.isArray(snapshot?.garage) ? snapshot.garage.length : 0,
      level: engine.level || 1,
      levelName: engine.level_name || 'Visitor',
      credits: Math.max(0, Number(engine.credits) || 0),
      accessTier: engine.access_tier || 'visitor',
    };
  }
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
    garage: Array.isArray(snapshot?.user_equipment) && snapshot.user_equipment.length
      ? snapshot.user_equipment.length
      : Array.isArray(snapshot?.garage) ? snapshot.garage.length : 0,
  };
}
