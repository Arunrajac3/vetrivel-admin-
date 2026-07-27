// Vetrivel TNPSC — Service Worker
// NETWORK-FIRST strategy: every load tries the live GitHub-hosted file first,
// so any update you push (like the ADMIN_EMAILS change) shows up immediately.
// The cache is only a fallback for offline use — never the primary source.
// Firestore/Firebase calls always go straight to the network (untouched).

const CACHE_NAME = 'vetrivel-tnpsc-v2'; // bumped: v1 used cache-first and served stale files
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

  // Never touch Firebase/Firestore/Auth calls — always straight to network.
  if(url.includes('googleapis.com') || url.includes('gstatic.com/firebasejs') || url.includes('firebaseio.com')){
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Got a fresh copy from the network — use it, and update the cache
        // for next time we're offline.
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // Offline / network failed — fall back to whatever we have cached.
        return caches.match(event.request);
      })
  );
});
