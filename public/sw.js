// Cache-first service worker so the web version works offline after the first
// visit. Bump CACHE_VERSION whenever any file below changes.
const CACHE_VERSION = 'buzzword-bingo-v2';
const ASSETS = [
  './',
  'index.html',
  'game.js',
  'app.js',
  'style.css',
  'manifest.webmanifest',
  'privacy.html',
  'icons/icon.svg',
  'icons/favicon-32.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'vendor/react/react.production.min.js',
  'vendor/react-dom/react-dom.production.min.js'
];

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
