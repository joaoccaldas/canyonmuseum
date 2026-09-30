export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const fmtDate = iso => { try { return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric'}).format(new Date(iso+'T12:00:00')); } catch (_) { return iso; } };
export const daysUntil = iso => Math.max(0, Math.ceil((new Date(iso+'T12:00:00') - Date.now()) / 86400000));
export const placeRegion = p => p?.region || p?.location?.region || p?.location?.city || '';
export const placeSummary = p => p?.purpose || (Array.isArray(p?.race_week_relevance) ? p.race_week_relevance.slice(0,2).join(' · ') : '') || p?.type || '';
