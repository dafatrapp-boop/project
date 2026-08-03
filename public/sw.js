/**
 * SocialSales OS — Service Worker
 *
 * Hand-written, dependency-free (no Workbox / no generated SW) so the
 * project doesn't gain a build-time PWA plugin. Strategy is
 * deliberately conservative because most of this app is authenticated,
 * per-user, per-workspace data behind RLS:
 *
 *   - Navigations (HTML/RSC document requests): NETWORK ONLY, with an
 *     offline fallback page shown only when the network request fails
 *     outright. We never cache-and-serve dashboard HTML — this app is
 *     multi-tenant and can be used on shared/kiosk devices, so serving
 *     a stale cached page (or worse, another account's cached page)
 *     offline would be a correctness and security problem, not just a
 *     UX one.
 *   - Next.js build assets (/_next/static/*), the app icons, and the
 *     manifest: CACHE FIRST. These are either content-hashed
 *     (immutable — safe to cache forever) or static brand assets, so
 *     this is what makes the *installed shell* boot instantly and work
 *     offline, without ever risking stale business data.
 *   - Everything else (API routes, Supabase REST calls, RSC data
 *     fetches, Stripe, uploads): NOT intercepted at all — falls
 *     through to the browser's normal network handling. Auth, RLS, and
 *     billing must always hit the network fresh.
 *
 * Offline fallback page is /offline (see app/offline/page.tsx), a
 * fully static route with no auth/data dependency, precached below.
 */

const CACHE_VERSION = 'v1';
const SHELL_CACHE = `ss-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `ss-static-${CACHE_VERSION}`;
const CURRENT_CACHES = [SHELL_CACHE, STATIC_CACHE];

const OFFLINE_URL = '/offline';

const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Precache individually — one missing/failing URL shouldn't ever
      // block installation of the rest of the shell.
      await Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => console.warn('[sw] precache failed', url, err))
        )
      );
      // Do not auto-activate over an existing controller here; the app
      // asks the user via the update toast (see register-sw.ts) and
      // only then posts SKIP_WAITING. This avoids yanking a page's
      // assets mid-session.
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => !CURRENT_CACHES.includes(n)).map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function isStaticAsset(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/_next/static/') ||
      url.pathname.startsWith('/icons/') ||
      url.pathname === '/favicon.ico' ||
      url.pathname === '/manifest.webmanifest')
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // never intercept mutations

  const url = new URL(request.url);

  // 1) Navigations — network only, offline page on failure.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          return response;
        } catch {
          const cache = await caches.open(SHELL_CACHE);
          const offline = await cache.match(OFFLINE_URL);
          return offline ?? Response.error();
        }
      })()
    );
    return;
  }

  // 2) Static, content-hashed or brand assets — cache first.
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return cached ?? Response.error();
        }
      })()
    );
    return;
  }

  // 3) Everything else (API, Supabase, RSC payloads, Stripe, uploads):
  // fall through untouched — always hit the network.
});

// ---------------------------------------------------------------------
// Web Push
// ---------------------------------------------------------------------

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'SocialSales OS', body: event.data.text() };
  }

  const title = payload.title || 'SocialSales OS';
  const options = {
    body: payload.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    dir: 'rtl',
    lang: 'ar',
    // Notifications that share a `tag` collapse into one instead of
    // stacking (e.g. repeated plan-expiry reminders) — grouped
    // notifications, per spec. Type-specific tags (new_lead, etc.)
    // still stack separately from each other.
    tag: payload.tag || payload.type || 'ss-notification',
    renotify: Boolean(payload.renotify),
    data: {
      url: payload.url || '/dashboard',
      notificationId: payload.notificationId || null,
    },
    timestamp: payload.timestamp || Date.now(),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const targetAbsolute = new URL(targetUrl, self.location.origin).href;

      for (const client of allClients) {
        if (client.url === targetAbsolute && 'focus' in client) {
          return client.focus();
        }
      }
      // No matching open tab — reuse any open app window by navigating
      // it, or open a fresh one.
      const anyClient = allClients.find((c) => 'focus' in c);
      if (anyClient) {
        await anyClient.navigate(targetAbsolute);
        return anyClient.focus();
      }
      return self.clients.openWindow(targetAbsolute);
    })()
  );
});
