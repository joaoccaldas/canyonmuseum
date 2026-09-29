#!/usr/bin/env node
// tools/fetch_news.mjs — triathlon and Kona headlines for the Museum Guide's News tab.
//
// Reads public RSS feeds (Google News searches, Slowtwitch, 220 Triathlon), keeps headlines that
// match Kona / Ironman / Speedmax / triathlon, dedupes, and writes museum/news.json: title, link,
// source, date. Only headlines and links are stored — no article text, no images — and every item
// links to the publisher. Run daily by .github/workflows/news.yml.
//   node tools/fetch_news.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const FEEDS = [
  { url: 'https://news.google.com/rss/search?q=%22Ironman+World+Championship%22+OR+Kona+Ironman&hl=en-US&gl=US&ceid=US:en', tag: 'Kona' },
  { url: 'https://news.google.com/rss/search?q=Canyon+Speedmax&hl=en-US&gl=US&ceid=US:en', tag: 'Speedmax' },
  { url: 'https://news.google.com/rss/search?q=triathlon+Ironman&hl=en-US&gl=US&ceid=US:en', tag: 'Triathlon' },
  { url: 'https://www.slowtwitch.com/feed/', tag: 'Triathlon', source: 'Slowtwitch' },
  { url: 'https://www.220triathlon.com/feed', tag: 'Triathlon', source: '220 Triathlon' },
];
const KEEP = /kona|ironman|speedmax|canyon|triathl|70\.3|frodeno|lange|laidlow|philipp|matthews|t100|challenge roth/i;
const decode = s => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#039;|&apos;/g, "'").replace(/&#8217;/g, '’').replace(/&#8216;/g, '‘').replace(/&#8211;/g, '–').replace(/&#8220;|&#8221;/g, '"').replace(/<[^>]+>/g, '').trim();
const tag = (x, t) => { const m = x.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)); return m ? decode(m[1]) : ''; };

const items = [];
for (const f of FEEDS) {
  try {
    const res = await fetch(f.url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; SpeedmaxMuseumNews/1.0; +https://github.com/joaoccaldas/canyonmuseum)' }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) { console.warn('skip', f.url, res.status); continue; }
    const xml = await res.text();
    for (const m of xml.matchAll(/<item[\s>][\s\S]*?<\/item>/g)) {
      const x = m[0]; let title = tag(x, 'title'), source = f.source || tag(x, 'source');
      const link = tag(x, 'link'), date = new Date(tag(x, 'pubDate'));
      if (!f.source && source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
      if (!title || !/^https:\/\//.test(link) || isNaN(date) || !KEEP.test(title)) continue;
      items.push({ title: title.slice(0, 200), link, source: (source || new URL(link).hostname).slice(0, 60), date: date.toISOString(), tag: f.tag });
    }
  } catch (e) { console.warn('skip', f.url, e.message); }
}
const seen = new Set(), out = [];
for (const it of items.sort((a, b) => b.date.localeCompare(a.date))) {
  const k = it.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').slice(0, 70);
  if (seen.has(k)) continue; seen.add(k); out.push(it);
  if (out.length >= 60) break;
}
if (!out.length) { console.error('no headlines fetched; keeping the previous file'); process.exit(0); }
fs.writeFileSync(path.join(root, 'museum/news.json'), JSON.stringify({ fetchedAt: new Date().toISOString(), note: 'Headlines and links only; every item links to its publisher.', items: out }, null, 1) + '\n');
console.log(`news: ${out.length} headlines from ${new Set(out.map(i => i.source)).size} sources`);
