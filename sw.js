// Service worker mínimo: NO cachea nada (solo permite instalar la PWA).
// Todo va a la red como siempre, así los deploys se ven al instante.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) { event.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function () { /* sin respondWith: red normal */ });
