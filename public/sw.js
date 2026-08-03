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
 *     UX one. This is a deliberate tradeoff against "previously
 *     visited pages work fully offline" — the app SHELL (this file's
 *     job) works offline; per-tenant data render does not, by design.
 *   - Next.js build assets (/_next/static/*): CACHE FIRST. These are
 *     content-hashed — the filename itself changes whenever the
 *     content does — so a cached copy can never go stale; there is
 *     nothing to revalidate.
 *   - Non-hashed static/brand assets (icons, favicon, manifest):
 *     STALE-WHILE-REVALIDATE. These CAN change between deployments
 *     without their URL changing (unlike /_next/static/*), so cache-
 *     first alone risks serving a stale icon indefinitely until
 *     someone remembers to bump CACHE_VERSION. Serving the cached copy
 *     instantly while refetching in the background self-heals that
 *     staleness within one extra load, no manual version bump needed.
 *   - Everything else (API routes, Supabase REST calls, RSC data
 *     fetches, Stripe, uploads): NOT intercepted at all — falls
 *     through to the browser's normal network handling. Auth, RLS, and
 *     billing must always hit the network fresh.
 *
 * Offline fallback page is /offline (see app/offline/page.tsx), a
 * fully static route with no auth/data dependency, precached below.
 */

const CACHE_VERSION = 'v2';
const SHELL_CACHE = `ss-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `ss-static-${CACHE_VERSION}`;
const SYNC_QUEUE_CACHE = 'ss-sync-queue-v1'; // not version-bumped with the rest — this is a durable queue, not a content cache
const CURRENT_CACHES = [SHELL_CACHE, STATIC_CACHE, SYNC_QUEUE_CACHE];

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
      // asks the user via the update toast (see components/pwa/pwa-provider.tsx)
      // and only then posts SKIP_WAITING. This avoids yanking a page's
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

function isHashedAsset(url) {
  return url.origin === self.location.origin && url.pathname.startsWith('/_next/static/');
}

function isRevalidatableAsset(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/icons/') ||
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

  // 2) Content-hashed build assets — cache first, never revalidated
  // (the filename itself would change if the content did).
  if (isHashedAsset(url)) {
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

  // 3) Non-hashed static/brand assets — stale-while-revalidate.
  if (isRevalidatableAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => null);

        if (cached) {
          // Don't await the revalidation — return the cached copy
          // immediately, let the fresh one land in cache for next time.
          event.waitUntil(networkFetch);
          return cached;
        }
        const fresh = await networkFetch;
        return fresh ?? Response.error();
      })()
    );
    return;
  }

  // 4) Everything else (API, Supabase, RSC payloads, Stripe, uploads):
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
    // Per-type icon when the sender provides one (send-push Edge
    // Function maps notification type -> icon, reusing the existing
    // manifest-shortcut assets) — falls back to the app icon so older/
    // unrelated callers of showNotification still work unchanged.
    icon: payload.icon || '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    dir: 'rtl',
    lang: 'ar',
    // Unique per notification (id, when the sender provides one) so
    // two DIFFERENT notifications never silently replace each other —
    // only a genuine re-delivery of the SAME notification collapses.
    // Falls back to `type` only for callers that predate notificationId.
    tag: payload.tag || payload.notificationId || payload.type || 'ss-notification',
    renotify: Boolean(payload.renotify),
    data: {
      url: payload.url || '/dashboard',
      notificationId: payload.notificationId || null,
    },
    timestamp: payload.timestamp || Date.now(),
    // "تعليم كمقروء" resolves entirely inside the service worker (see
    // notificationclick below) — it never needs to open/focus a window,
    // so it works exactly the same whether the app is open, backgrounded,
    // or fully closed.
    actions: payload.notificationId ? [{ action: 'mark_read', title: 'تعليم كمقروء' }] : [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ---------------------------------------------------------------------
// Background Sync — a small, deliberately narrow use: retrying a
// "mark as read" call that failed while offline. NOT a general
// mutation queue (this app's fetch handler above still never
// intercepts API requests) — just this one safe, idempotent,
// low-stakes action, queued via the Cache Storage API (already used
// elsewhere in this file) rather than pulling in IndexedDB for a
// single JSON array.
//
// Background Sync is Chromium-only — Safari/iOS has no equivalent API
// at all. There, a failed mark-as-read simply isn't retried until the
// user opens the notification center again (which re-reads real state
// from the server), which is a acceptable degrade, not a data-loss risk.
// ---------------------------------------------------------------------

const SYNC_QUEUE_KEY = new Request('https://ss-sync-queue.local/mark-read');
const SYNC_TAG = 'mark-read-queue';

async function queueMarkRead(notificationId) {
  const cache = await caches.open(SYNC_QUEUE_CACHE);
  const existing = await cache.match(SYNC_QUEUE_KEY);
  const ids = existing ? await existing.json() : [];
  if (!ids.includes(notificationId)) ids.push(notificationId);
  await cache.put(SYNC_QUEUE_KEY, new Response(JSON.stringify(ids)));

  if ('sync' in self.registration) {
    try {
      await self.registration.sync.register(SYNC_TAG);
    } catch (err) {
      console.warn('[sw] background sync registration failed', err);
    }
  }
}

async function flushMarkReadQueue() {
  const cache = await caches.open(SYNC_QUEUE_CACHE);
  const existing = await cache.match(SYNC_QUEUE_KEY);
  if (!existing) return;

  const ids = await existing.json();
  const remaining = [];
  for (const id of ids) {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      if (!res.ok) remaining.push(id);
    } catch {
      remaining.push(id);
    }
  }

  if (remaining.length > 0) {
    await cache.put(SYNC_QUEUE_KEY, new Response(JSON.stringify(remaining)));
  } else {
    await cache.delete(SYNC_QUEUE_KEY);
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(flushMarkReadQueue());
  }
});

self.addEventListener('notificationclick', (event) => {
  const notificationId = event.notification.data?.notificationId;

  if (event.action === 'mark_read' && notificationId) {
    event.notification.close();
    event.waitUntil(
      fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' }).catch(() =>
        queueMarkRead(notificationId)
      )
    );
    return;
  }

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

// ---------------------------------------------------------------------
// Subscription lifecycle recovery — addresses the audit's finding that
// a silently rotated/invalidated subscription (a spec-defined browser
// behavior, not something the app can prevent) was only ever cleaned
// up reactively, the next time a send happened to 404/410 against it.
// This proactively re-subscribes the instant the browser reports the
// change, so a device never has a dead subscription sitting unnoticed.
// ---------------------------------------------------------------------

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      const oldEndpoint = event.oldSubscription?.endpoint ?? null;
      try {
        const keyRes = await fetch('/api/push/vapid-public-key');
        const { key } = await keyRes.json();
        if (!key) return;

        const newSubscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });

        const json = newSubscription.toJSON();
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
        });

        if (oldEndpoint && oldEndpoint !== json.endpoint) {
          await fetch('/api/push/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: oldEndpoint }),
          });
        }
      } catch (err) {
        console.warn('[sw] pushsubscriptionchange recovery failed', err);
      }
    })()
  );
});
