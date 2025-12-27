console.log('[SW] 🚀 Service Worker v3.0 - Push Notifications + Offline');

// Instalar imediatamente
self.addEventListener('install', (event) => {
  console.log('[SW] ⚙️ Instalando...');
  event.waitUntil(self.skipWaiting());
});

// Ativar e assumir controle
self.addEventListener('activate', (event) => {
  console.log('[SW] ✅ Ativando...');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(keys => Promise.all(
        keys.map(key => caches.delete(key))
      ))
    ])
  );
});

// PUSH NOTIFICATIONS - Funciona com app fechado
self.addEventListener('push', (event) => {
  console.log('[SW] 📬 PUSH RECEBIDO:', new Date().toISOString());
  
  let notificationData = {
    title: '🔔 IA Coach Fitness',
    message: 'Nova notificação',
    icon: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
    badge: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png'
  };
  
  if (event.data) {
    try {
      const parsed = event.data.json();
      notificationData = {
        title: parsed.title || notificationData.title,
        message: parsed.message || parsed.body || notificationData.message,
        icon: parsed.icon || notificationData.icon,
        badge: parsed.badge || notificationData.badge,
        data: parsed.data || {},
        tag: parsed.tag || 'push-notification'
      };
    } catch (e) {
      notificationData.message = event.data.text() || notificationData.message;
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.message,
      icon: notificationData.icon,
      badge: notificationData.badge,
      vibrate: [200, 100, 200],
      tag: notificationData.tag,
      data: notificationData.data || { url: '/' }
    })
  );
});

// Click na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 👆 Notificação clicada');
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Fetch - Estratégia Network First com fallback para offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
        return new Response('Offline', { status: 503 });
      })
  );
});

console.log('[SW] 🎯 Service Worker pronto!');
