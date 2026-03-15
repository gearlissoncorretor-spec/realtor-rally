// Web Push notification handler - imported by the service worker
self.addEventListener('push', function(event) {
  let data = { title: 'Axis', body: 'Nova notificação' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch(e) {
    console.error('Error parsing push data:', e);
  }

  const options = {
    body: data.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: data.tag || 'axis-push',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'dismiss', title: 'Dispensar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Axis', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// Background Sync handler for offline data
self.addEventListener('sync', function(event) {
  if (event.tag === 'axis-offline-sync') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        for (const client of clientList) {
          client.postMessage({ type: 'TRIGGER_OFFLINE_SYNC' });
          return;
        }
      })
    );
  }
});
