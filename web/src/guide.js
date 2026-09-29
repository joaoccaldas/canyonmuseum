// Guide.html — the museum as a web app: Home · Bikes · Kona stats · News · Help.
// Mobile: bottom tab bar. Desktop: sidebar. Everything is data the museum already holds
// (catalog, specs, Kona results, prices checked on Canyon), plus the daily headlines file.
import { createPassport, levelOf } from './passport.js';

const G = window.__GUIDE;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const passport = createPassport();
const loc = (() => { const r = (navigator.language || '').toLowerCase().split('-')[1]; return r && G.locales.includes(`en-${r}`) ? `en-${r}` : 'en-de'; })();
const localize = u => u.replace(/canyon\.com\/[a-z]{2}-[a-z]{2}\//, `canyon.com/${loc}/`);
const search = q => `https://www.canyon.com/${loc}/search?q=${encodeURIComponent(q)}`;
const ord = n => n + (['th', 'st', 'nd', 'rd'][n % 10 > 3 || [11, 12, 13].includes(n % 100) ? 0 : n % 10]);
const secs = t => { const [h, m, s] = t.split(':').map(Number); return h * 3600 + m * 60 + s; };
const hms = s => `${Math.floor(s / 3600)}:${String(Math.floor(s % 3600 / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// ------------------------------------------------------------------ routing
const TABS = [['home', 'Home', '⌂'], ['bikes', 'Bikes', '🚲'], ['stats', 'Kona stats', '📈'], ['news', 'News', '📰'], ['help', 'Help', '?']];
$('#tabs').innerHTML = TABS.map(([id, name, icon]) => `<a href="#${id}" data-tab="${id}"><i aria-hidden="true">${icon}</i><span>${name}</span></a>`).join('');
function go() {
  const [tab, arg] = (location.hash.slice(1) || 'home').split('/');
  document.querySelectorAll('#tabs a').forEach(a => a.setAttribute('aria-current', a.dataset.tab === tab ? 'page' : 'false'));
  const view = { home, bikes: arg ? () => bike(arg) : bikes, stats, news, help }[tab] || home;
  $('#main').innerHTML = ''; view(); $('#main').focus({ preventScroll: true }); scrollTo(0, 0);
  passport.stamp('guide:open', 'Museum Guide', 5);
}
addEventListener('hashchange', go);
$('#ppBtn').onclick = () => passport.open();

// ------------------------------------------------------------------ Home
function home() {
  const s = passport.state, lv = levelOf(s.xp);
  $('#main').innerHTML = `
  <section class="hero"><div class="eb">Canyon Speedmax Museum</div><h1>Twenty-eight years on the <em>Queen K.</em></h1>
    <p class="lede">Walk every Speedmax generation in 3D, out along the Kona pier through twelve Octobers of racing, into three night experiences — and back to Koblenz, 1985.</p>
    <div class="cta"><a class="btn primary" href="index.html">Enter the museum →</a><a class="btn" href="Experiences.html#lava">Night experiences</a></div></section>
  <section class="pp-card" id="ppCard"><span class="av">${esc(s.profile?.emoji || '🎟️')}</span><div><small>${s.profile ? esc(lv.name) : 'Museum Passport'}</small><b>${s.profile ? esc(s.profile.name) : 'Collect stamps, keep a streak'}</b>
    <span class="meta">🔥 ${s.streak}-day streak · ${Object.keys(s.stamps).length} stamps · ${s.xp} XP</span></div><button class="btn primary sm" id="ppOpen">${s.profile ? 'Open' : 'Get yours'}</button></section>
  <section class="fact"><small>Kona fact of the day</small>${esc(passport.fact())}</section>
  <h2>Go somewhere</h2>
  <div class="tiles">
    ${[['index.html', '🏛️', 'The hall', 'Nine Speedmax generations on lava stone'], ['index.html?room=pier', '🌊', 'The Kona Pier', 'Best Speedmax at every Kona, 2014–2025'],
       ['Experiences.html#lava', '🎃', 'Lava Night', 'Halloween on the lava field'], ['Experiences.html#camp13', '🏕️', 'Camp 13', 'Friday the 13th, lakeside'],
       ['Experiences.html#tunnel', '👻', 'Ghost Tunnel', 'The haunted wind tunnel'], ['Experiences.html#history', '📜', 'History Lane', 'Koblenz, 1985 — today']]
      .map(([h, i, t, d]) => `<a class="tile" href="${h}"><i>${i}</i><b>${t}</b><small>${d}</small></a>`).join('')}
  </div>
  <h2>Latest from Kona <a class="more" href="#news">All news →</a></h2><div id="homeNews" class="news"></div>`;
  $('#ppOpen').onclick = () => passport.open();
  loadNews().then(items => { $('#homeNews').innerHTML = items.slice(0, 4).map(newsItem).join('') || '<p class="mut">Headlines load when you are online.</p>'; });
}

// ------------------------------------------------------------------ Bikes
function bikes() {
  $('#main').innerHTML = `<h1 class="pg">The bikes</h1><p class="lede">Every Speedmax generation in the museum — specs, the 3D studio with its exploded view, and where Canyon sells the parts today.</p>
    <div class="bikes">${G.bikes.map(b => `<a class="bike" href="#bikes/${esc(b.key)}"><span class="img">${b.thumb ? `<img src="${esc(b.thumb)}" alt="" loading="lazy">` : '<i>—</i>'}</span>
      <span><small>${esc(b.years)}</small><b>${esc(b.name)}</b><em>${esc(b.material || '')}</em></span></a>`).join('')}</div>`;
}
function bike(key) {
  const b = G.bikes.find(x => x.key === key); if (!b) return bikes();
  passport.stamp(`bike:${b.key}`, b.name, 10);
  const specRows = b.components ? b.components.map(c => [c.type, c.name, Object.entries(c.features || {}).map(([k, v]) => `${k}: ${v}`).join(' · ')]) : (b.spec || []).map(([k, v]) => [k, v, '']);
  $('#main').innerHTML = `<a class="crumb" href="#bikes">← All bikes</a>
    <section class="bike-hero">${b.thumb ? `<img src="${esc(b.thumb)}" alt="${esc(b.name)}, rendered from the museum's 3D model">` : ''}
      <div><div class="eb">${esc(b.years)}</div><h1 class="pg">${esc(b.name)}</h1><p class="mat">${esc(b.material || '')}</p><p>${esc(b.story || b.note || '')}</p>
      ${b.stats ? `<div class="stats">${b.stats.map(([v, l]) => `<div><b>${esc(v)}</b><small>${esc(l)}</small></div>`).join('')}</div>` : ''}
      <div class="cta">${b.viewer ? `<a class="btn primary" href="${esc(b.viewer)}">3D studio · exploded view →</a>` : ''}${b.product ? `<a class="btn" href="${esc(localize(b.product))}" target="_blank" rel="noopener">On Canyon.com ↗</a>` : ''}</div></div></section>
    ${b.buy?.length ? `<h2>Parts you can buy</h2><p class="mut">Pages checked on Canyon's store (${esc(G.buyChecked)}); prices shown are Canyon's Swedish listing at that time — open the page for your region's price.</p>
      <div class="parts">${b.buy.map(p => `<a class="part" href="${esc(localize(p.url))}" target="_blank" rel="noopener"><b>${esc(p.name)}</b><small>${esc(p.part)}${p.match === 'upgrade' ? ' · upgrade' : ''} · ${p.price.toLocaleString('sv-SE')} ${esc(p.currency)}</small><span>Buy at Canyon ↗</span></a>`).join('')}</div>` : ''}
    <h2>Specification</h2>
    <div class="spec">${specRows.map(([k, v, f]) => `<div class="row"><span>${esc(k)}</span><div><b>${esc(v)}</b>${f ? `<small>${esc(f)}</small>` : ''}${b.components ? `<a href="${esc(search(v))}" target="_blank" rel="noopener">Find at Canyon ↗</a>` : ''}</div></div>`).join('')}</div>
    ${b.uncertain?.length ? `<details class="unc"><summary>What the 3D model reconstructs</summary><ul>${b.uncertain.map(u => `<li>${esc(u)}</li>`).join('')}</ul></details>` : ''}
    ${b.source ? `<p class="mut"><a href="${esc(b.source)}" target="_blank" rel="noopener">Archive source ↗</a></p>` : ''}
    <div class="help-inline"><b>How to explode it</b><ol><li>Open the 3D studio.</li><li>Tap <em>Explode</em> — every part slides out along its axis.</li><li>Tap a part for its name, spec and weight; in the night experiences each part also links to Canyon.</li></ol></div>`;
}

// ------------------------------------------------------------------ Kona stats
function stats() {
  const K = G.kona, raced = K.years.filter(y => y.status === 'raced'), wins = raced.filter(y => y.place === 1);
  const fastest = wins.reduce((a, b) => secs(a.time) < secs(b.time) ? a : b);
  $('#main').innerHTML = `<h1 class="pg">Kona, in numbers</h1><p class="lede">The best-placed Canyon Speedmax at every Ironman World Championship held in Kailua-Kona, 2014–2025. Sourced results; see each year on the pier.</p>
    <div class="kpis">
      <div><b>${wins.length}</b><small>Kona titles on a Speedmax</small></div>
      <div><b>${esc(fastest.time)}</b><small>course record · ${esc(fastest.athlete)}, ${fastest.year}</small></div>
      <div><b>3:57:22</b><small>first sub-4 h Kona bike split · Sam Laidlow, 2024</small></div>
      <div><b>${raced.filter(y => y.place <= 3).length}/${raced.length}</b><small>Kona races with a Speedmax on the podium</small></div>
    </div>
    <figure class="chart"><figcaption><b>Winning times on a Speedmax at Kona</b><small>Men's race · lower is faster</small></figcaption><div id="c1" class="plot"></div>
      <details><summary>Table</summary><table><tr><th>Year</th><th>Athlete</th><th>Time</th></tr>${wins.map(w => `<tr><td>${w.year}</td><td>${esc(w.athlete)}</td><td>${esc(w.time)}</td></tr>`).join('')}</table></details></figure>
    <figure class="chart"><figcaption><b>Best Speedmax finish, year by year</b><small>Overall place in that day's Kona race · 2020 cancelled · 2021 raced in Utah</small></figcaption><div id="c2" class="plot"></div>
      <details><summary>Table</summary><table><tr><th>Year</th><th>Place</th><th>Athlete</th><th>Race</th></tr>${K.years.map(y => `<tr><td>${y.year}</td><td>${y.status === 'raced' ? ord(y.place) : '—'}</td><td>${esc(y.athlete || y.headline)}</td><td>${esc(y.race || 'no race in Kona')}</td></tr>`).join('')}</table></details></figure>
    <h2>The field</h2>
    <div class="facts">${G.fieldFacts.map(f => `<div><b>${esc(f.value)}</b><p>${esc(f.text)}</p><a href="${esc(f.source)}" target="_blank" rel="noopener">Source ↗</a></div>`).join('')}</div>`;
  lineChart($('#c1'), wins.map(w => ({ x: w.year, y: secs(w.time), label: `${w.athlete} · ${w.time}` })));
  placeChart($('#c2'), K.years);
}
const tip = document.createElement('div'); tip.className = 'tip'; document.body.appendChild(tip);
function tipAt(e, lines) { tip.replaceChildren(...lines.map((t, i) => { const el = document.createElement(i ? 'small' : 'b'); el.textContent = t; return el; })); tip.style.left = `${e.clientX}px`; tip.style.top = `${e.clientY}px`; tip.classList.add('on'); }
function svgEl(w, h) { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', `0 0 ${w} ${h}`); s.setAttribute('role', 'img'); return s; }
function lineChart(el, pts) {
  const W = 640, H = 260, m = { l: 56, r: 20, t: 16, b: 30 }, x0 = 2014.5, x1 = 2024.5;
  const ys = pts.map(p => p.y), lo = Math.floor(Math.min(...ys) / 600) * 600, hi = Math.ceil(Math.max(...ys) / 600) * 600;
  const X = x => m.l + (x - x0) / (x1 - x0) * (W - m.l - m.r), Y = y => m.t + (y - lo) / (hi - lo) * (H - m.t - m.b);
  let g = '';
  for (let y = lo; y <= hi; y += 600) g += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(y)}" y2="${Y(y)}" class="grid"/><text x="${m.l - 8}" y="${Y(y) + 4}" class="ax" text-anchor="end">${hms(y).slice(0, 4)}</text>`;
  for (let x = 2015; x <= 2024; x++) g += `<text x="${X(x)}" y="${H - 8}" class="ax" text-anchor="middle">${String(x).slice(2)}</text>`;
  const path = pts.map((p, i) => `${i && p.x - pts[i - 1].x === 1 ? 'L' : 'M'}${X(p.x)},${Y(p.y)}`).join('');   // no line across years without a Speedmax win
  g += `<path d="${path}" class="ln" fill="none"/>`;
  pts.forEach((p, i) => { g += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="5" class="dot"/><circle cx="${X(p.x)}" cy="${Y(p.y)}" r="16" class="hit" data-i="${i}" tabindex="0"/>`; });
  for (const i of [0, pts.length - 1]) g += `<text x="${X(pts[i].x) + (i ? -10 : 10)}" y="${Y(pts[i].y) + (i ? 20 : -10)}" class="lbl" text-anchor="${i ? 'end' : 'start'}">${hms(pts[i].y)}</text>`;
  const s = svgEl(W, H); s.setAttribute('aria-label', 'Winning times: ' + pts.map(p => `${p.x} ${hms(p.y)}`).join(', ')); s.innerHTML = g; el.appendChild(s);
  s.querySelectorAll('.hit').forEach(c => { const p = pts[+c.dataset.i]; const f = e => tipAt(e.clientX ? e : { clientX: c.getBoundingClientRect().x, clientY: c.getBoundingClientRect().y }, [hms(p.y), `${p.x} · ${p.label.split(' · ')[0]}`]); c.addEventListener('pointermove', f); c.addEventListener('focus', f); c.addEventListener('pointerleave', () => tip.classList.remove('on')); c.addEventListener('blur', () => tip.classList.remove('on')); });
}
function placeChart(el, years) {
  const W = 640, H = 240, m = { l: 40, r: 16, t: 14, b: 30 }, n = years.length;
  const X = i => m.l + (i + .5) / n * (W - m.l - m.r), Y = p => m.t + (p - 1) / 6 * (H - m.t - m.b);
  let g = '';
  for (let p = 1; p <= 7; p += 1) g += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(p)}" y2="${Y(p)}" class="grid"/>${p <= 6 ? `<text x="${m.l - 8}" y="${Y(p) + 4}" class="ax" text-anchor="end">${ord(p)}</text>` : ''}`;
  years.forEach((y, i) => {
    g += `<text x="${X(i)}" y="${H - 8}" class="ax" text-anchor="middle">${String(y.year).slice(2)}</text>`;
    if (y.status !== 'raced') { g += `<text x="${X(i)}" y="${Y(3.6)}" class="nr" text-anchor="middle">no race</text>`; return; }
    g += `<line x1="${X(i)}" x2="${X(i)}" y1="${Y(7)}" y2="${Y(y.place)}" class="stem"/><circle cx="${X(i)}" cy="${Y(y.place)}" r="6" class="dot${y.place === 1 ? ' win' : ''}"/><circle cx="${X(i)}" cy="${Y(y.place)}" r="16" class="hit" data-i="${i}" tabindex="0"/>`;
  });
  const s = svgEl(W, H); s.setAttribute('aria-label', 'Best Speedmax place by year'); s.innerHTML = g; el.appendChild(s);
  s.querySelectorAll('.hit').forEach(c => { const y = years[+c.dataset.i]; const f = e => tipAt(e.clientX ? e : { clientX: c.getBoundingClientRect().x, clientY: c.getBoundingClientRect().y }, [`${ord(y.place)} · ${y.year}`, `${y.athlete} · ${y.race}'s race · ${y.bike}`]); c.addEventListener('pointermove', f); c.addEventListener('focus', f); c.addEventListener('pointerleave', () => tip.classList.remove('on')); c.addEventListener('blur', () => tip.classList.remove('on')); });
}

// ------------------------------------------------------------------ News
let newsCache = null;
async function loadNews() {
  if (newsCache) return newsCache;
  try { const r = await fetch('museum/news.json', { cache: 'no-cache' }); if (r.ok) newsCache = (await r.json()).items; } catch (_) { }
  return newsCache || G.news;
}
const ago = d => { const h = (Date.now() - Date.parse(d)) / 36e5; return h < 1 ? 'just now' : h < 24 ? `${Math.round(h)} h ago` : `${Math.round(h / 24)} d ago`; };
const newsItem = i => `<a class="item" href="${esc(i.link)}" target="_blank" rel="noopener noreferrer"><small>${esc(i.tag)} · ${esc(i.source)} · ${ago(i.date)}</small><b>${esc(i.title)}</b></a>`;
function news() {
  $('#main').innerHTML = `<h1 class="pg">News</h1><p class="lede">Kona, Ironman and Speedmax headlines, refreshed every morning. Each opens at its publisher.</p>
    <div class="filters" role="group" aria-label="Filter"><button aria-pressed="true" data-f="">All</button><button aria-pressed="false" data-f="Kona">Kona</button><button aria-pressed="false" data-f="Speedmax">Speedmax</button><button aria-pressed="false" data-f="Triathlon">Triathlon</button></div>
    <div id="newsList" class="news"><p class="mut">Loading…</p></div>
    <h2>Follow</h2><div class="social">
      <a href="https://www.instagram.com/canyon/" target="_blank" rel="noopener">Canyon on Instagram ↗</a>
      <a href="https://www.instagram.com/ironmantri/" target="_blank" rel="noopener">IRONMAN on Instagram ↗</a>
      <a href="https://news.google.com/search?q=Kona%20Ironman" target="_blank" rel="noopener">Kona on Google News ↗</a>
      <a href="https://www.slowtwitch.com/" target="_blank" rel="noopener">Slowtwitch ↗</a></div>`;
  loadNews().then(items => {
    const draw = f => { $('#newsList').innerHTML = items.filter(i => !f || i.tag === f).map(newsItem).join('') || '<p class="mut">Nothing in this filter today.</p>'; };
    draw('');
    document.querySelectorAll('.filters button').forEach(b => b.onclick = () => { document.querySelectorAll('.filters button').forEach(x => x.setAttribute('aria-pressed', x === b)); draw(b.dataset.f); });
  });
}

// ------------------------------------------------------------------ Help
function help() {
  const Q = [
    ['Walking the museum', ['<b>Phone:</b> push the swim·bike·run stick to walk, drag anywhere to look, tap a bike to walk to it.', '<b>Computer:</b> W A S D to walk, drag to look, click a bike or press 1–9. K: Kona Champions, P: the pier, H: Lava Night, Y: WYLD room.', '<b>Guided tour:</b> “Guided tour” on the start screen walks you through the highlights hands-free.']],
    ['Exploded views', ['In a 3D studio or a night experience, tap <b>Explode</b>: every part slides out along its axis.', 'Tap any part for its name, specification and weight.', 'In the night experiences a part card links to Canyon: straight to the product page when we have checked it exists, otherwise Canyon’s own search for that part.']],
    ['The Kona Pier', ['Walk out of the glass door at the end of the hall. One painted canvas per October, 2014–2025: the best-placed Canyon Speedmax in that year’s Kona race.', 'Tap a canvas for the result, the athlete and the sources.']],
    ['Night experiences', ['Lava Night, Camp 13 and the Ghost Tunnel are full scenes around one Speedmax in a museum-made livery. Drag to orbit, pinch to zoom.', 'Each hides three objects. Find all nine for the Collector badge.', '♪ turns on synthesized ambience (off by default).']],
    ['History Lane', ['Drag up, or scroll, to walk down a Koblenz street from 1985 to today. Tap a chapter for dates, photographs and sources.']],
    ['Museum Passport', ['Stamps for every bike, Kona year, room and chapter; XP and levels; a daily streak with a Kona fact.', '“Get yours” asks for a nickname, an avatar and (optionally) a country. It stays on this device — no account, no email. A passport code moves it to another device.']],
    ['Install the app', ['<b>Android:</b> “Get the app” in the museum header → Add to Home Screen, or the Android app (APK) when offered.', '<b>iPhone/iPad:</b> Share → Add to Home Screen.', 'Installed, the museum opens full screen and works offline once visited.']],
    ['Updates and security', ['Each release is sealed: every file’s SHA-256 is recorded. An installed app only switches to a new version after every file it downloads matches — otherwise it keeps the last good one.', 'Updates never interrupt a visit: a “Reload” pill appears when a verified one is ready. The Android app checks the museum’s HTTPS site for a newer signed APK.']],
    ['Performance', ['Phones get a lighter renderer (lower pixel ratio, simpler shadows). Rooms you can’t see aren’t drawn; paintings and bikes download as you approach.', 'If a phone runs warm, close other tabs — the museum pauses when it isn’t visible.']],
    ['About the content', ['An independent study from public references — not affiliated with or endorsed by Canyon Bicycles. 3D models are visual reconstructions; liveries in the night experiences are the museum’s own.', 'Photographs come from Wikimedia Commons and keep their licences; the paintings are derivatives with the same licence and credit.', 'Kona results and history dates cite their sources on each card.']],
  ];
  $('#main').innerHTML = `<h1 class="pg">Help &amp; tutorials</h1><p class="lede">Everything the museum can do, and how.</p>
    <div class="faq">${Q.map(([t, ps], i) => `<details${i ? '' : ' open'}><summary>${t}</summary>${ps.map(p => `<p>${p}</p>`).join('')}</details>`).join('')}</div>
    <div class="cta"><button class="btn" id="resetTut">Replay the first-visit tips</button></div>`;
  $('#resetTut').onclick = () => { try { for (const k of ['speedmax.coach.v1', 'speedmax.exp.tut.v1', 'speedmax.hist.tut.v1']) localStorage.removeItem(k); } catch (_) { } passport.toast('💡', 'Tips will show again', 'on your next visit to each room'); };
}
go();
