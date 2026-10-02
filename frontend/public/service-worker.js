/* Smart Reply AI — service worker
 * Strategy:
 *   - navigations      : network-first (fresh HTML), falls back to cache then offline page
 *   - static assets    : stale-while-revalidate (fast repeat loads)
 *   - /api & cross-origin requests: never intercepted
 */
const CACHE_NAME = 'smart-reply-v2';
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = ['/', '/index.html', OFFLINE_URL, '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.disable();
      }
      await self.clients.claim();
    })()
  );
});

const isCacheableResponse = (response) =>
  Boolean(response) && response.status === 200 && response.type === 'basic';

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET' || request.headers.get('range')) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never touch cross-origin traffic
  if (url.pathname.startsWith('/api/')) return; // always live

  // --- Navigations: network first -------------------------------------
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (isCacheableResponse(networkResponse)) {
            const cache = await caches.open(CACHE_NAME);
            cache.put('/index.html', networkResponse.clone());
          }
          return networkResponse;
        } catch {
          const cached = (await caches.match('/index.html')) || (await caches.match('/'));
          return cached || (await caches.match(OFFLINE_URL)) || Response.error();
        }
      })()
    );
    return;
  }

  // --- Static assets: stale-while-revalidate --------------------------
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      const network = fetch(request)
        .then(async (response) => {
          if (isCacheableResponse(response)) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => undefined);

      return cached || (await network) || new Response('', { status: 504, statusText: 'Offline' });
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
