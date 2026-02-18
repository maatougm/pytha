/**
 * School Hub Service Worker
 * Handles caching, background sync, and push notifications
 */

const CACHE_NAME = 'school-hub-v1';
const STATIC_CACHE = 'school-hub-static-v1';
const API_CACHE = 'school-hub-api-v1';
const IMAGE_CACHE = 'school-hub-images-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/src/main.js',
  '/src/assets/styles.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((err) => {
        console.error('[SW] Failed to cache static assets:', err);
      })
  );
  
  // Activate immediately
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![STATIC_CACHE, API_CACHE, IMAGE_CACHE].includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests except for Google Fonts
  if (!url.origin.includes(self.location.origin) && 
      !url.hostname.includes('fonts.googleapis.com') &&
      !url.hostname.includes('fonts.gstatic.com')) {
    return;
  }
  
  // API calls - Network First strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }
  
  // Images - Cache First strategy
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }
  
  // Google Fonts stylesheets - Stale While Revalidate
  if (url.hostname.includes('fonts.googleapis.com')) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }
  
  // Google Fonts webfonts - Cache First
  if (url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }
  
  // Static assets - Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
});

/**
 * Network First Strategy
 * Try network first, fallback to cache if offline
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for API calls
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({ 
          error: 'You are offline',
          offline: true 
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

/**
 * Cache First Strategy
 * Try cache first, fallback to network
 */
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first strategy failed:', error);
    throw error;
  }
}

/**
 * Stale While Revalidate Strategy
 * Return cached version immediately, update cache in background
 */
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(cacheName).then((cache) => {
        cache.put(request, networkResponse.clone());
      });
    }
    return networkResponse;
  }).catch((error) => {
    console.log('[SW] Stale while revalidate fetch failed:', error);
    // Return cached response if available, otherwise fail
    return cachedResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Background Sync for offline messages
const BACKGROUND_SYNC_TAG = 'sync-messages';

self.addEventListener('sync', (event) => {
  if (event.tag === BACKGROUND_SYNC_TAG) {
    console.log('[SW] Background sync triggered');
    event.waitUntil(syncMessages());
  }
});

/**
 * Sync pending messages when back online
 */
async function syncMessages() {
  try {
    const db = await openDatabase();
    const pendingMessages = await db.getAll('pendingMessages');
    
    for (const message of pendingMessages) {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${message.token}`
          },
          body: JSON.stringify(message.data)
        });
        
        if (response.ok) {
          await db.delete('pendingMessages', message.id);
          
          // Notify clients about successful sync
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'MESSAGE_SYNCED',
              messageId: message.id
            });
          });
        }
      } catch (error) {
        console.error('[SW] Failed to sync message:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

/**
 * Open IndexedDB for storing pending messages
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SchoolHubDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingMessages')) {
        db.createObjectStore('pendingMessages', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Push Notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');
  
  if (!event.data) {
    console.log('[SW] Push event has no data');
    return;
  }
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification from School Hub',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/icon-72x72.png',
      image: data.image,
      tag: data.tag || 'school-hub-notification',
      requireInteraction: data.requireInteraction || false,
      renotify: data.renotify || false,
      data: data.data || {},
      actions: data.actions || [],
      vibrate: data.vibrate || [200, 100, 200]
    };
    
    event.waitUntil(
      self.registration.showNotification(
        data.title || 'School Hub',
        options
      )
    );
  } catch (error) {
    console.error('[SW] Error handling push event:', error);
    
    // Show generic notification if parsing fails
    event.waitUntil(
      self.registration.showNotification('School Hub', {
        body: 'You have a new notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png'
      })
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const notificationData = event.notification.data;
  let targetUrl = '/';
  
  // Handle action buttons
  if (event.action) {
    switch (event.action) {
      case 'reply':
        targetUrl = notificationData.replyUrl || '/messaging';
        break;
      case 'view':
        targetUrl = notificationData.viewUrl || '/';
        break;
      case 'dismiss':
        return;
      default:
        targetUrl = notificationData.url || '/';
    }
  } else if (notificationData.url) {
    targetUrl = notificationData.url;
  }
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              url: targetUrl,
              data: notificationData
            });
            return client.navigate(targetUrl);
          }
        }
        
        // Open new window if none exists
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

// Notification close handling
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
});

// Message handling from client
self.addEventListener('message', (event) => {
  console.log('[SW] Message from client:', event.data);
  
  if (!event.data) return;
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'SCHEDULE_SYNC':
      if ('sync' in self.registration) {
        self.registration.sync.register(BACKGROUND_SYNC_TAG)
          .then(() => {
            event.ports[0].postMessage({ scheduled: true });
          })
          .catch((err) => {
            console.error('[SW] Sync registration failed:', err);
            event.ports[0].postMessage({ scheduled: false, error: err.message });
          });
      } else {
        event.ports[0].postMessage({ scheduled: false, error: 'Background Sync not supported' });
      }
      break;
      
    case 'CACHE_URLS':
      cacheUrls(event.data.urls)
        .then(() => {
          event.ports[0].postMessage({ cached: true });
        })
        .catch((err) => {
          event.ports[0].postMessage({ cached: false, error: err.message });
        });
      break;
  }
});

/**
 * Cache specific URLs
 */
async function cacheUrls(urls) {
  const cache = await caches.open(STATIC_CACHE);
  const requests = urls.map(url => new Request(url));
  const responses = await Promise.all(
    requests.map(req => fetch(req).catch(() => null))
  );
  
  for (let i = 0; i < responses.length; i++) {
    if (responses[i] && responses[i].ok) {
      await cache.put(requests[i], responses[i]);
    }
  }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-messages') {
    console.log('[SW] Periodic sync triggered');
    event.waitUntil(checkNewMessages());
  }
});

/**
 * Check for new messages in background
 */
async function checkNewMessages() {
  try {
    const response = await fetch('/api/messages/unread-count', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.count > 0) {
        await self.registration.showNotification('School Hub', {
          body: `You have ${data.count} new message${data.count > 1 ? 's' : ''}`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'new-messages',
          data: {
            url: '/messaging'
          }
        });
      }
    }
  } catch (error) {
    console.error('[SW] Check new messages failed:', error);
  }
}
