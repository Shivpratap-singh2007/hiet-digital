// =============================================================================
// HIET DIGITAL CAMPUS — SERVICE WORKER (PWA & PUSH NOTIFICATIONS)
// Himachal Institute of Engineering & Technology, Shahpur (H.P.)
// =============================================================================

const CACHE_NAME = 'hiet-campus-pwa-v5';
const PRECACHE_ASSETS = [
  '/',
  '/?source=pwa',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/images/hiet_crest.png',
  '/images/hiet_logo.png',
  '/images/hiet_maskable.svg'
];

// 1. Install Event: Pre-cache essential app shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[HIET PWA] Pre-caching asset skipped:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[HIET PWA] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Event: Network-First with Fast Timeout for Navigation, Cache-First for static assets
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignore non-GET and browser extensions
  if (req.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // API calls & Supabase endpoints: Network Only (do not cache dynamic DB queries)
  if (url.pathname.includes('/rest/v1/') || url.pathname.includes('/functions/v1/')) {
    return;
  }

  // On localhost/dev server, always bypass caching for scripts and styles to prevent stale development bundles
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    if (
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.includes('/src/') ||
      url.pathname.includes('/@vite/') ||
      url.pathname.includes('/@fs/') ||
      url.pathname.includes('/node_modules/')
    ) {
      return;
    }
  }

  // Navigation requests (HTML pages): Fast Network-First (2.5s timeout) with instant App Shell Cache Fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Race network fetch against a strict 2.5-second timeout to prevent splash-screen freezing
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Navigation timeout')), 2500)
          );

          const networkPromise = fetch(req).then((networkResp) => {
            if (networkResp && networkResp.status === 200) {
              const copy = networkResp.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            }
            return networkResp;
          });

          return await Promise.race([networkPromise, timeoutPromise]);
        } catch (err) {
          // If network is offline or hangs > 2.5s, immediately serve cached app shell
          const cachedResp = 
            (await caches.match(req)) || 
            (await caches.match('/index.html')) || 
            (await caches.match('/?source=pwa')) || 
            (await caches.match('/'));
            
          if (cachedResp) {
            return cachedResp;
          }
          // Ultimate fallback: wait for direct fetch
          return fetch(req);
        }
      })()
    );
    return;
  }

  // Static Assets (Images, Fonts, CSS, JS, SVG): Stale-While-Revalidate
  if (
    url.pathname.startsWith('/images/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js')
  ) {
    event.respondWith(
      caches.match(req).then((cachedResp) => {
        const fetchPromise = fetch(req)
          .then((networkResp) => {
            if (networkResp && networkResp.status === 200) {
              const copy = networkResp.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            }
            return networkResp;
          })
          .catch(() => cachedResp);

        return cachedResp || fetchPromise;
      })
    );
  }
});

// 4. Push Notification Event Listener
self.addEventListener('push', (event) => {
  let data = {
    title: 'HIET Campus Alert',
    body: 'You have a new update in your digital campus portal.',
    deepLink: 'dashboard',
    type: 'general'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/images/hiet_crest.png',
    badge: '/images/hiet_crest.png',
    vibrate: [120, 60, 120],
    data: {
      deepLink: data.deepLink || 'dashboard',
      timestamp: Date.now()
    },
    actions: [
      { action: 'open_app', title: 'Open Portal' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 5. Notification Click Event Listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetTab = event.notification.data?.deepLink || 'dashboard';
  const urlToOpen = new URL(`/?tab=${targetTab}`, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'NAVIGATE_TAB', tab: targetTab });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
