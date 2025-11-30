// IA Coach Fitness - Service Worker para PWA Externo
// Versão: 1.0.0

const CACHE_NAME = 'ia-coach-fitness-v1';
const ICON_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904da724b4ce40db58404e7/ff4e4563c_LogoIA.png';

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker instalado');
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker ativado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

// Interceptar requisições (fetch)
self.addEventListener('fetch', (event) => {
  // Deixar passar todas as requisições para o iframe
  // Não cachear nada do app Base44
  return;
});

// Receber Push Notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push recebido:', event);

  let data = {
    title: 'IA Coach Fitness',
    body: 'Você tem uma nova notificação!',
    icon: ICON_URL,
    badge: ICON_URL,
    tag: 'ia-coach-notification',
    requireInteraction: false,
    data: {}
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || payload.message || data.body,
        icon: payload.icon || ICON_URL,
        badge: payload.badge || ICON_URL,
        tag: payload.tag || 'ia-coach-' + Date.now(),
        requireInteraction: payload.requireInteraction || false,
        data: payload.data || {}
      };
    }
  } catch (e) {
    console.log('[SW] Erro ao parsear payload:', e);
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    requireInteraction: data.requireInteraction,
    vibrate: [200, 100, 200],
    data: data.data,
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificação clicada:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // URL padrão ou URL customizada da notificação
  let targetUrl = 'https://iacoachfitness.com.br';
  if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já tem uma janela aberta, focar nela
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          // Enviar mensagem para o cliente sobre a notificação
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            data: event.notification.data
          });
          return;
        }
      }
      // Se não tem janela aberta, abrir uma nova
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Fechar notificação
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notificação fechada:', event);
});

// Receber mensagens do cliente (página)
self.addEventListener('message', (event) => {
  console.log('[SW] Mensagem recebida:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});