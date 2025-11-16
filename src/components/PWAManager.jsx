import { useEffect, useState } from 'react';
import { manifestData } from './pwa/manifest-data';
import InstallPWAModal from './pwa/InstallPWAModal';
import NotificationPermissionModal from './pwa/NotificationPermissionModal';
import { base44 } from '@/api/base44Client';

const VAPID_PUBLIC_KEY = 'BNJg8Uw8qpWl9GvHLheJP0VKEXe7yWU0XHlS9-xdmQPf8WHmvKELB1j7JYEIbWr4xKDKIqOPYL1KZ9-8_cFV6Yw';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PWAManager() {
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    console.log('🚀 PWAManager iniciado');
    console.log('📱 User Agent:', navigator.userAgent);
    console.log('🔔 Notification support:', 'Notification' in window);
    console.log('📮 Push support:', 'PushManager' in window);
    
    const manifestBlob = new Blob([JSON.stringify(manifestData)], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(manifestBlob);
    
    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = manifestURL;
    console.log('✅ Manifest criado');

    // Service Worker otimizado para receber push mesmo com app fechado
    const swCode = `
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
    `;

    const swBlob = new Blob([swCode], { type: 'application/javascript' });
    const swURL = URL.createObjectURL(swBlob);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register(swURL, { 
          scope: '/',
          updateViaCache: 'none' // Força atualização do SW sempre
        })
        .then(async (registration) => {
          console.log('✅ Service Worker registrado com sucesso');
          console.log('📍 Scope:', registration.scope);
          console.log('🔄 Estado:', registration.active?.state);
          console.log('🔄 Installing:', registration.installing?.state);
          console.log('🔄 Waiting:', registration.waiting?.state);
          
          // Forçar atualização do SW
          registration.update();
          
          if ('Notification' in window && 'PushManager' in window) {
            console.log('🔔 Permissão de notificação:', Notification.permission);
            
            if (Notification.permission === 'granted') {
              try {
                await navigator.serviceWorker.ready;
                console.log('⏳ Service Worker ready confirmado');
                
                const currentUser = await base44.auth.me();
                console.log('👤 Usuário logado:', currentUser.email);
                
                let subscription = await registration.pushManager.getSubscription();
                console.log('📮 Subscription atual:', subscription ? 'EXISTE' : 'NÃO EXISTE');
                
                if (subscription) {
                  console.log('📮 Endpoint:', subscription.endpoint);
                }
                
                if (!subscription) {
                  console.log('📝 Criando nova subscription...');
                  subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                  });
                  console.log('✅ Subscription criada!');
                  console.log('📮 Novo endpoint:', subscription.endpoint);
                }

                console.log('💾 Salvando subscription no banco de dados...');
                const existingSubscriptions = await base44.entities.PushSubscription.list();
                const userSubscription = existingSubscriptions.find(s => s.user_email === currentUser.email);
                
                const subscriptionData = {
                  user_email: currentUser.email,
                  subscription: subscription.toJSON(),
                  is_active: true
                };

                if (userSubscription) {
                  await base44.entities.PushSubscription.update(userSubscription.id, subscriptionData);
                  console.log('✅ Subscription atualizada no banco!');
                } else {
                  await base44.entities.PushSubscription.create(subscriptionData);
                  console.log('✅ Subscription criada no banco!');
                }
                
                console.log('🎉 TUDO PRONTO! Notificações funcionando mesmo com app fechado.');
              } catch (error) {
                console.error('❌ Erro ao configurar subscription:', error);
                console.error('Stack:', error.stack);
              }
            } else {
              console.warn('⚠️ Permissão de notificação não concedida:', Notification.permission);
            }
            
            const hasAskedPermission = localStorage.getItem('notification-permission-asked');
            const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                          window.navigator.standalone === true;
            
            console.log('🏠 Rodando como PWA?', isPWA);
            console.log('❓ Já pediu permissão?', hasAskedPermission);
            
            if (isPWA && Notification.permission === 'default' && !hasAskedPermission) {
              setTimeout(() => {
                console.log('📢 Mostrando modal de permissão');
                setShowNotificationModal(true);
              }, 3000);
            }
          } else {
            console.error('❌ Push notifications NÃO SUPORTADAS neste navegador');
          }
        })
        .catch((error) => {
          console.error('❌ ERRO ao registrar Service Worker:', error);
          console.error('Stack:', error.stack);
        });
    } else {
      console.error('❌ Service Workers NÃO SUPORTADOS neste navegador');
    }

    return () => {
      URL.revokeObjectURL(manifestURL);
      URL.revokeObjectURL(swURL);
    };
  }, []);

  return (
    <>
      <InstallPWAModal />
      {showNotificationModal && (
        <NotificationPermissionModal onClose={() => setShowNotificationModal(false)} />
      )}
    </>
  );
}