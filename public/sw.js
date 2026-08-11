// A minimal service worker to make the app installable as a PWA.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let all requests pass through. We are just satisfying the PWA install requirement.
});
