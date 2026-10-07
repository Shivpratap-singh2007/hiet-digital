// HIET Digital Campus - Service Worker & Push Notification Handler
// Himachal Institute of Engineering & Technology, Shahpur

const CACHE_NAME = 'hiet-campus-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/images/hiet_crest.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // Cache failures during dev are non-blocking
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Push notification event listener
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
    } catch (e) {
      data.body = event.data.text();
    }
  }

  // Safety rule: never include private student PII in lock-screen notifications
  const options = {
    body: data.body,
    icon: '/images/hiet_crest.png',
    badge: '/images/hiet_crest.png',
    vibrate: [100, 50, 100],
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

// Notification click event listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetTab = event.notification.data?.deepLink || 'dashboard';
  const urlToOpen = new URL(`/?tab=${targetTab}`, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
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
