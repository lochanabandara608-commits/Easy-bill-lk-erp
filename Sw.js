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
        return response || fetch(event.request);// Firebase connect කරන code එක
// 1. https://firebase.google.com ගිහින් project එකක් හදාගන්න
// 2. Web App add කරලා config key එක ගන්න

// Example:
function loginToBackend(username, password){
    fetch('https://uba-api.com/api/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username: username, password: password})
    })
   .then(res => res.json())
   .then(data => {
        if(data.success){ showDashboard(data.role) }
    })
}