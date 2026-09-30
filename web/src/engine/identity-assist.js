// Public race results become history only after the person confirms them.
// This module does not search, fetch, or read an email address.

export const RACE_HISTORY_KEY = 'speedmax.raceHistory.v1';

export const CONFIDENCE = Object.freeze({
  name: 0.35,
  country: 0.15,
  birthYear: 0.2,
  knownRace: 0.2,
  bib: 0.1,
});

const norm = value => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

export function scoreMatch(hints = {}, candidate = {}) {
  let score = 0;
  const reasons = [];
  const add = (key, same) => {
    if (!same) return;
    score += CONFIDENCE[key];
    reasons.push(key);
  };
  add('name', hints.name && norm(hints.name) === norm(candidate.athleteName));
  add('country', hints.country && norm(hints.country) === norm(candidate.country));
  add('birthYear', hints.birthYear && Number(hints.birthYear) === Number(candidate.birthYear));
  add('knownRace', hints.knownRace && norm(hints.knownRace) === norm(candidate.eventName));
  add('bib', hints.bib && String(hints.bib) === String(candidate.bib));
  return { score: Math.round(score * 100) / 100, reasons };
}

export function bandFor(score) {
  if (score >= 0.9) return 'likely';
  if (score >= 0.7) return 'possible';
  return 'hidden';
}

export function reviewCandidates(hints, candidates) {
  const visible = [];
  for (const candidate of candidates || []) {
    if (!candidate?.id || !candidate?.source) continue;
    const { score, reasons } = scoreMatch(hints, candidate);
    const band = bandFor(score);
    if (band === 'hidden') continue;
    visible.push({
      id: String(candidate.id),
      source: String(candidate.source),
      athleteName: candidate.athleteName || '',
      country: candidate.country || null,
      birthYear: Number.isInteger(candidate.birthYear) ? candidate.birthYear : null,
      eventName: candidate.eventName || '',
      year: Number.isInteger(candidate.year) ? candidate.year : null,
      time: candidate.time || null,
      confidence: score,
      reasons,
      band,
      confirmed: false,
    });
  }
  return visible
    .map(row => ({
      ...row,
      ambiguous: visible.some(other => other.id !== row.id && norm(other.athleteName) === norm(row.athleteName) && norm(row.athleteName)),
    }))
    .sort((a, b) => b.confidence - a.confidence || a.id.localeCompare(b.id));
}

export function confirmCandidate(row, choice, now = new Date().toISOString()) {
  if (!row?.source || !row?.id || row.confidence == null) return { ok: false, error: 'missing-provenance' };
  if (bandFor(row.confidence) === 'hidden') return { ok: false, error: 'hidden' };
  if (choice !== 'thats-me') return { ok: false, error: 'needs-confirmation' };
  return {
    ok: true,
    history: {
      schema_version: 1,
      id: `race-history:${row.source}:${row.id}`,
      entity_type: 'race-history',
      source: row.source,
      source_id: row.id,
      confidence: row.confidence,
      band: row.ambiguous ? 'ambiguous' : row.band,
      ambiguous: !!row.ambiguous,
      confirmed: true,
      confirmed_at: now,
      athlete_name: row.athleteName,
      event_name: row.eventName,
      year: row.year,
      time: row.time,
      visibility: 'private',
    },
  };
}

export function readRaceHistory(storage = globalThis.localStorage) {
  try {
    const raw = JSON.parse(storage?.getItem?.(RACE_HISTORY_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch (_) { return []; }
}

export function rememberHistory(record, storage = globalThis.localStorage) {
  if (!record?.confirmed || !record.source || !record.source_id) return readRaceHistory(storage);
  const rows = readRaceHistory(storage);
  if (rows.some(row => row.source === record.source && row.source_id === record.source_id)) return rows;
  const next = rows.concat(record);
  try { storage?.setItem?.(RACE_HISTORY_KEY, JSON.stringify(next)); } catch (_) { return rows; }
  return next;
}
