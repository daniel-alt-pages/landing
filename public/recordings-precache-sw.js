/**
 * Service worker — caché masivo catálogo + media Drive (drive-v6).
 * Cache-first 30 días: un hit a Drive por URL/mes por dispositivo.
 */

const CATALOG_PREFIX = '/data/recordings/';
const CACHE_PREFIX = 'sg-recordings';
/** 30 días — alineado con TTL localStorage y límites Drive ~24h–30d. */
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const STALE_AT_HEADER = 'x-sg-precache-at';

let activeCacheId = 'sg-recordings-drive-v6-default';
const registeredMedia = new Set();

function isDriveMedia(url) {
  return (
    url.includes('drive.google.com/uc') ||
    url.includes('drive.google.com/file/d/') ||
    url.includes('drive.usercontent.google.com') ||
    url.includes('googleusercontent.com')
  );
}

function isCatalogUrl(url) {
  return url.includes(CATALOG_PREFIX);
}

function registerUrl(url) {
  if (typeof url === 'string' && url) registeredMedia.add(url);
}

function isRegistered(url) {
  if (registeredMedia.has(url)) return true;
  if (!isDriveMedia(url)) return false;
  for (const media of registeredMedia) {
    if (url === media) return true;
    if (isDriveMedia(media) && url.startsWith(media.split('?')[0])) return true;
  }
  return false;
}

function isFresh(response) {
  const at = response.headers.get(STALE_AT_HEADER);
  if (!at) return true;
  const ts = Number(at);
  if (!Number.isFinite(ts)) return true;
  return Date.now() - ts < MAX_AGE_MS;
}

async function stampAndPut(cache, request, response) {
  if (!response || (!response.ok && response.type !== 'opaque')) return;
  const headers = new Headers(response.headers);
  headers.set(STALE_AT_HEADER, String(Date.now()));
  const body = await response.blob();
  await cache.put(request, new Response(body, { status: response.status, statusText: response.statusText, headers }));
}

async function pruneExpired(cache) {
  const keys = await cache.keys();
  await Promise.all(
    keys.map(async (request) => {
      const response = await cache.match(request);
      if (!response || !isFresh(response)) {
        await cache.delete(request);
      }
    }),
  );
}

async function cacheFirst(request, cacheId) {
  const cache = await caches.open(cacheId);
  const cached = await cache.match(request);
  if (cached && isFresh(cached)) return cached;
  if (cached) await cache.delete(request);

  try {
    const response = await fetch(request, { credentials: 'omit', mode: 'cors' });
    if (response && response.ok) {
      await stampAndPut(cache, request, response.clone());
    }
    return response;
  } catch {
    try {
      const opaque = await fetch(request, { credentials: 'omit', mode: 'no-cors' });
      if (opaque) await stampAndPut(cache, request, opaque);
      if (opaque) return opaque;
    } catch {
      /* ignore */
    }
    if (cached) return cached;
    return Response.error();
  }
}

async function precacheUrl(url) {
  try {
    const cache = await caches.open(activeCacheId);
    const existing = await cache.match(url);
    if (existing && isFresh(existing)) return;

    if (isCatalogUrl(url)) {
      const response = await fetch(url, { credentials: 'same-origin', cache: 'no-cache' });
      if (response.ok) await stampAndPut(cache, url, response.clone());
      return;
    }

    if (isDriveMedia(url)) {
      await cacheFirst(new Request(url), activeCacheId);
    }
  } catch {
    /* quota / red — precarga vía main thread */
  }
}

async function purgeAllCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX)).map((key) => caches.delete(key)));
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && !key.includes('drive-v6'))
          .map((key) => caches.delete(key)),
      );
      for (const key of keys) {
        if (!key.startsWith(CACHE_PREFIX)) continue;
        const cache = await caches.open(key);
        await pruneExpired(cache);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'SG_RECORDINGS_SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (data.type === 'SG_RECORDINGS_PURGE_ALL') {
    event.waitUntil(purgeAllCaches());
    registeredMedia.clear();
    return;
  }

  if (data.type === 'SG_RECORDINGS_INIT' && typeof data.cacheId === 'string') {
    activeCacheId = data.cacheId;
    if (typeof data.catalogPath === 'string') registerUrl(data.catalogPath);
    if (Array.isArray(data.driveUrls)) {
      for (const url of data.driveUrls) registerUrl(url);
    }
    event.waitUntil(caches.open(activeCacheId).then(pruneExpired));
    return;
  }

  if (data.type === 'SG_RECORDINGS_PRECACHE_ONE' && typeof data.url === 'string') {
    registerUrl(data.url);
    event.waitUntil(precacheUrl(data.url));
  }

  if (data.type === 'SG_RECORDINGS_REGISTER_URL' && typeof data.url === 'string') {
    registerUrl(data.url);
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;

  if (isCatalogUrl(url)) {
    event.respondWith(
      caches.open(activeCacheId).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached && isFresh(cached)) return cached;
        try {
          const response = await fetch(event.request, { credentials: 'same-origin' });
          if (response.ok) await stampAndPut(cache, event.request, response.clone());
          return response;
        } catch {
          return cached ?? Response.error();
        }
      }),
    );
    return;
  }

  if (!isRegistered(url) && !isDriveMedia(url)) return;
  if (!isRegistered(url) && isDriveMedia(url)) return;

  event.respondWith(cacheFirst(event.request, activeCacheId));
});
