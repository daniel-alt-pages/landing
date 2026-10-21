// Service Worker kill switch.
// El hosting ya maneja cache correctamente con Cache-Control. Mantener un SW viejo
// interceptando requests externos (Drive, chunks, auth) produjo errores CORS/stale
// difíciles de depurar. Este archivo se sirve en /sw.js para que navegadores con una
// versión previa registrada la actualicen, borren caches y se desregistren.

self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
            .then(() => self.registration.unregister())
            .then(() => self.clients.matchAll({ type: 'window' }))
            .then((clients) => {
                for (const client of clients) client.navigate(client.url);
            })
    );
});

self.addEventListener('fetch', () => {
    // No interceptar nada. Navegador/CDN/Firebase Auth/Firestore manejan su propio cache.
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))));
    }
    if (event.data && event.data.type === 'SKIP_WAITING') {
        event.waitUntil(self.skipWaiting());
    }
});

/*
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key.startsWith('sg-') && key !== OFFLINE_CACHE)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    if (
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.hostname.endsWith('.local')
    ) {
        return;
    }

    if (BYPASS_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
        return;
    }

    if (
        url.hostname.includes('firestore.googleapis.com') ||
        url.hostname.includes('identitytoolkit.googleapis.com') ||
        url.hostname.includes('securetoken.googleapis.com') ||
        url.hostname.includes('firebase') ||
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('imgbb.com')
    ) {
        return;
    }

    if (url.pathname.startsWith('/data/')) return;

    // Chunks, scripts, estilos, imágenes: navegador + CDN (no interceptar).
    if (
        request.destination === 'script' ||
        request.destination === 'style' ||
        request.destination === 'font' ||
        request.destination === 'image' ||
        url.pathname.match(/\.(js|css|mjs|woff2?|ttf|eot|png|jpg|jpeg|webp|svg|gif|ico|avif)$/)
    ) {
        return;
    }

    // Solo navegación: red primero; cache solo si offline.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response && response.ok && response.status === 200) {
                        const clone = response.clone();
                        caches.open(OFFLINE_CACHE).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() => caches.match(request).then((cached) => cached || caches.match('/login')))
        );
    }
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
    }
});
*/
