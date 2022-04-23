let cacheName = 'Timeplan';
let filesToCache = [
  '/login',
  '/about',
  '/css/style.css',
  '/css/login/style.css',
  '/js/script.js',
  '/js/login/script.js'
];

/* Start the service worker and cache all of the app's content */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(filesToCache);
    })
  );
});

/* Serve cached content when offline */
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});