export const serviceWorkerCode = `
const CACHE_NAME = 'ia-coach-fitness-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalado');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativado');
  event.waitUntil(self.clients.claim());
});

// Push event - Recebe notificações push
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push recebido', event);
  
  let notificationData = {
    title: 'IA Coach Fitness',
    body: 'Você tem uma nova atualização!',
    icon: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
    badge: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
    tag: 'notification',
    requireInteraction: false,
    vibrate: [200, 100, 200]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data
      };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  // Safari requer que notificações sejam mostradas imediatamente
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      vibrate: notificationData.vibrate,
      data: notificationData.data
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notificação clicada', event);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já existe uma janela aberta, foca nela
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Caso contrário, abre uma nova janela
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Fetch event - Não vamos fazer cache por enquanto
self.addEventListener('fetch', (event) => {
  // Deixar passar todas as requisições normalmente
  event.respondWith(fetch(event.request));
});
`;