const CACHE_NAME = 'lunar-v2.1';
const ASSETS = [
  './index.html',
  'https://cdn.jsdelivr.net/npm/lunar-javascript/lunar.min.js'
];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))));

self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));

