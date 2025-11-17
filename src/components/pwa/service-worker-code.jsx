// INSTRUÇÕES IMPORTANTES:
// Este arquivo contém o código do Service Worker.
// Para que as notificações push funcionem com app fechado (iOS + Android),
// você DEVE copiar este código para um arquivo físico na raiz pública:
// 
// Caminho: /public/service-worker.js
// 
// E então registrar no PWAManager assim:
// navigator.serviceWorker.register('/service-worker.js', { scope: '/' })

console.log('[SW] 🚀 Service Worker versão 2.0 iniciado - suporte para background push');

// CRITICAL: skipWaiting garante ativação imediata
self.addEventListener('install', (event) => {
  console.log('[SW] ⚙️ Instalando...');
  event.waitUntil(self.skipWaiting());
});

// CRITICAL: claim garante controle imediato de todas as páginas
self.addEventListener('activate', (event) => {
  console.log('[SW] ✅ Ativando e assumindo controle...');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Limpar caches antigos se houver
      caches.keys().then(keys => Promise.all(
        keys.map(key => caches.delete(key))
      ))
    ])
  );
});

// CRITICAL: Este listener é executado MESMO COM APP FECHADO
self.addEventListener('push', (event) => {
  const timestamp = new Date().toISOString();
  console.log('[SW] 📬 PUSH RECEBIDO EM:', timestamp);
  console.log('[SW] 📦 Dados raw:', event.data ? event.data.text() : 'SEM DADOS');
  
  let notificationData = {
    title: '🔔 IA Coach Fitness',
    message: 'Nova notificação',
    icon: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
    badge: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png'
  };
  
  if (event.data) {
    try {
      const parsed = event.data.json();
      console.log('[SW] 📄 JSON parseado:', parsed);
      notificationData = {
        title: parsed.title || notificationData.title,
        message: parsed.message || parsed.body || notificationData.message,
        icon: parsed.icon || notificationData.icon,
        badge: parsed.badge || notificationData.badge,
        data: parsed.data || {},
        tag: parsed.tag || 'push-notification',
        requireInteraction: parsed.requireInteraction || false
      };
    } catch (e) {
      console.log('[SW] ⚠️ Falha ao parsear JSON, usando texto:', e);
      const text = event.data.text();
      notificationData.message = text || notificationData.message;
    }
  }

  console.log('[SW] 🔔 Mostrando notificação:', notificationData);

  // CRITICAL: event.waitUntil garante que o SW não seja encerrado antes de mostrar a notificação
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.message,
      icon: notificationData.icon,
      badge: notificationData.badge,
      vibrate: [200, 100, 200, 100, 200],
      tag: notificationData.tag || 'fitness-notification',
      requireInteraction: false,
      silent: false,
      data: notificationData.data || { url: '/' },
      actions: []
    }).then(() => {
      console.log('[SW] ✅ Notificação mostrada com sucesso!');
    }).catch((error) => {
      console.error('[SW] ❌ Erro ao mostrar notificação:', error);
    })
  );
});

// Listener para quando o usuário clica na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 👆 Notificação clicada');
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  console.log('[SW] 🔗 Abrindo URL:', urlToOpen);
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        console.log('[SW] 🪟 Clientes abertos:', clients.length);
        
        // Tentar focar em um cliente existente
        for (const client of clients) {
          if (client.url === urlToOpen && 'focus' in client) {
            console.log('[SW] ✅ Focando cliente existente');
            return client.focus();
          }
        }
        
        // Se não houver cliente aberto, abrir nova janela
        if (self.clients.openWindow) {
          console.log('[SW] 🆕 Abrindo nova janela');
          return self.clients.openWindow(urlToOpen);
        }
      })
      .catch((error) => {
        console.error('[SW] ❌ Erro ao processar click:', error);
      })
  );
});

// Error handler global
self.addEventListener('error', (event) => {
  console.error('[SW] ❌ Erro global:', event.error);
});

// Unhandled rejection handler
self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] ❌ Promise rejeitada:', event.reason);
});

console.log('[SW] 🎯 Service Worker pronto para receber push notifications em background!');