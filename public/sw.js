// Версия меняется автоматически при каждом деплое через timestamp
// Vite подставляет его через vite.config.js (см. ниже)
const CACHE_VERSION = self.__CACHE_VERSION__ || 'dev';
const CACHE_NAME    = `checkursubs-${CACHE_VERSION}`;

// ─── Install: ничего не кэшируем заранее, всё lazy ────────────────────────────
self.addEventListener('install', () => {
  self.skipWaiting(); // активируемся сразу, не ждём закрытия вкладок
});

// ─── Activate: удаляем все старые кэши ────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Supabase и внешние запросы — никогда не кэшируем
  if (!url.origin.includes(self.location.hostname)) return;

  // index.html и навигационные запросы — всегда сеть, кэш только как fallback
  if (request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // JS/CSS с хешем в имени — кэш навсегда (они иммутабельны)
  if (/\.(js|css)$/.test(url.pathname) && /[a-f0-9]{8}/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return res;
        });
      })
    );
    return;
  }

  // Всё остальное — network-first
  event.respondWith(
    fetch(request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        return res;
      })
      .catch(() => caches.match(request))
  );
});
