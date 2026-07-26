// Vetrivel TNPSC — Service Worker
// Caches only the static app shell (HTML/CSS/JS/logo). Firestore requests
// always go to the network so quiz content, results, and reports are never
// served stale — this only makes the app itself open instantly / offline.

const CACHE_NAME = 'vetrivel-tnpsc-v1';
const APP_SHELL = [
  './quiz.html',
  './manifest.json',
  './assets/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .catch(err => console.error('SW cache addAll failed:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Never cache Firebase/Firestore/Auth calls — always hit the network.
  if(url.includes('googleapis.com') || url.includes('gstatic.com/firebasejs') || url.includes('firebaseio.com')){
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
