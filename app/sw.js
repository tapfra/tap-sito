// Service worker per le notifiche push di TAP
self.addEventListener('push', function(event) {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch(e) { data = { title: 'TAP', body: event.data ? event.data.text() : '' }; }

  const title = data.title || 'TAP';
  const options = {
    body: data.body || 'Hai una nuova notifica',
    icon: '/app/icon-192.png',
    badge: '/app/icon-192.png',
    data: { url: data.url || '/app/index.html' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/app/index.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url.includes('/app/') && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
