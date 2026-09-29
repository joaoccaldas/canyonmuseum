// Canyon Museum service worker. Conservative on purpose:
// - Navigation stays network-first, so a new museum is seen as soon as it is published;
//   the cached page is only a fallback when offline.
// - Scripts, styles, images and fonts are stale-while-revalidate: served from cache, refreshed in the background.
// - Bike GLBs are never pre-cached (they stream as you walk and the browser's HTTP cache keeps them).
const CACHE = 'canyon-museum-shell-v8';
// Shown only when a page was never cached and the network (or the local server) is unreachable.
const OFFLINE = '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline · Speedmax Museum</title>'
  + '<body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#f4efe7;color:#12181d;font:15px/1.6 system-ui,sans-serif;text-align:center;padding:24px">'
  + '<div><p style="letter-spacing:.24em;font-size:11px;text-transform:uppercase;color:#138a8f;font-weight:700">Speedmax Museum</p>'
  + '<h1 style="font:400 38px Georgia,serif;margin:8px 0">The museum can\'t be reached</h1>'
  + '<p>You are offline, or the server is not running. If you are running it locally, start it in the project folder:<br><code>python3 -m http.server 8754 --bind 127.0.0.1</code></p>'
  + '<p><button onclick="location.reload()" style="font:600 14px system-ui;padding:12px 22px;border-radius:999px;border:0;background:#12181d;color:#fff">Try again</button></p></div>';
const SHELL = ['./', './index.html', './manifest.webmanifest', './assets/pwa/icon-v3.svg', './assets/pwa/icon-v3-192.png', './assets/pwa/icon-v3-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('canyon-museum-shell-') && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {                          // network-first; each page falls back to its own copy
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then(response => {
          if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); }
          return response;
        })
        .catch(async () => (await caches.match(event.request, { ignoreSearch: true }))
          || new Response(OFFLINE, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }))
    );
    return;
  }

  if (!['script', 'style', 'image', 'font', 'manifest'].includes(event.request.destination)) return;
  event.respondWith(caches.open(CACHE).then(cache => cache.match(event.request).then(hit => {   // stale-while-revalidate
    const fresh = fetch(event.request).then(response => {
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    }).catch(() => hit || new Response('', { status: 504, statusText: 'Offline' }));   // always a Response, never undefined
    return hit || fresh;
  })));
});
