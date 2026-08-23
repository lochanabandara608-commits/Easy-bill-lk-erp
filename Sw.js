const CACHE_NAME = 'easybill-erp-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './main.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install වෙනකොට files cache කරනවා
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Files caching...');
        return cache.addAll(urlsToCache);
      })
  );
});

// Network නැතුවත් වැඩ කරන විදිහ
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache එකේ තියෙනවා නම් ඒක දෙන්න, නැත්නම් internet එකෙන් ගන්න
        return response || fetch(event.request);