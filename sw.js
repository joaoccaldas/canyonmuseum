const CACHE = 'canyon-museum-shell-v4';
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

  // Navigation stays network-first so visitors always get the newest museum when online.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Static same-origin assets: serve from cache instantly, refresh in the background (stale-while-revalidate),
  // so an installed app never gets stuck on old scripts, styles or images. Large GLBs are not precached.
  if (!['script', 'style', 'image', 'font'].includes(event.request.destination)) return;
  event.respondWith(caches.open(CACHE).then(cache => cache.match(event.request).then(hit => {
    const fresh = fetch(event.request).then(response => {
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    }).catch(() => hit);
    return hit || fresh;
  })));
});
