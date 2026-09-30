// Cards for results that already survived reviewCandidates. No search lives here.

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

export function assistMarkup(rows) {
  const cards = (rows || []).map(row => {
    const mark = row.ambiguous ? 'Same name as another result' : row.band === 'likely' ? 'Likely you' : 'Possible';
    return `<article class="assist-card"><p>${esc(row.eventName)}</p><p>${esc(row.year || '')} ${esc(row.time || '')}</p><p>${mark}</p><p>${esc(row.source)}</p><button type="button" data-confirm="${esc(row.id)}">That's me</button></article>`;
  }).join('');
  return `<p class="eyebrow">Have you raced before?</p><p>Public results stay suggestions until you confirm one.</p>${cards}<button type="button" id="findRaces">Find my races</button><p class="kona-note" id="assistNote"></p>`;
}
