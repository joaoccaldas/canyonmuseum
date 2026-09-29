// Canyon Museum service worker. Conservative on purpose:
// - Navigation stays network-first, so a new museum is seen as soon as it is published;
//   the cached page is only a fallback when offline.
// - Scripts, styles, images and fonts are stale-while-revalidate: served from cache, refreshed in the background.
// - Bike GLBs are never pre-cached (they stream as you walk and the browser's HTTP cache keeps them).
const CACHE = 'canyon-museum-shell-v6';
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

  if (event.request.mode === 'navigate') {                          // network-first
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then(response => {
          if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put('./index.html', copy)); }
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  if (!['script', 'style', 'image', 'font', 'manifest'].includes(event.request.destination)) return;
  event.respondWith(caches.open(CACHE).then(cache => cache.match(event.request).then(hit => {   // stale-while-revalidate
    const fresh = fetch(event.request).then(response => {
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    }).catch(() => hit);
    return hit || fresh;
  })));
});
