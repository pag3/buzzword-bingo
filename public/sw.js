// Cache-first service worker so the web version works offline after the first
// visit. `npm run build` fills in both constants below: ASSETS lists every file
// in dist/, and CACHE_VERSION is a hash of their contents, so any change to the
// app gives returning visitors a fresh cache.
const CACHE_VERSION = 'buzzword-bingo-dev';
const ASSETS = ['./'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true })
      .then(cached => cached || fetch(event.request))
  );
});
