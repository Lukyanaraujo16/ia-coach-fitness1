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

    // Criar Service Worker dinamicamente
    const swCode = `
      console.log('[SW] Service Worker iniciado');

      self.addEventListener('install', (event) => {
        console.log('[SW] Instalado');
        self.skipWaiting();
      });

      self.addEventListener('activate', (event) => {
        console.log('[SW] Ativado');
        event.waitUntil(self.clients.claim());
      });

      self.addEventListener('push', (event) => {
        console.log('[SW] Push recebido');
        
        let data = { title: 'Notificação', message: 'Nova mensagem' };
        
        if (event.data) {
          try {
            data = event.data.json();
          } catch (e) {
            console.log('[SW] Erro parse JSON');
          }
        }

        event.waitUntil(
          self.registration.showNotification(data.title, {
            body: data.message,
            icon: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
            badge: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
            vibrate: [200, 100, 200],
            tag: 'notification'
          })
        );
      });

      self.addEventListener('notificationclick', (event) => {
        console.log('[SW] Notificação clicada');
        event.notification.close();
        event.waitUntil(
          self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            for (const client of clients) {
              if ('focus' in client) {
                return client.focus();
              }
            }
            if (self.clients.openWindow) {
              return self.clients.openWindow('/');
            }
          })
        );
      });
    `;

    const swBlob = new Blob([swCode], { type: 'application/javascript' });
    const swURL = URL.createObjectURL(swBlob);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register(swURL, { scope: '/' })
        .then(async (registration) => {
          console.log('✅ Service Worker registrado');
          
          if ('Notification' in window && 'PushManager' in window) {
            if (Notification.permission === 'granted') {
              try {
                const currentUser = await base44.auth.me();
                
                let subscription = await registration.pushManager.getSubscription();
                
                if (!subscription) {
                  console.log('📝 Criando subscription...');
                  subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                  });
                }

                console.log('💾 Salvando subscription...');
                const existingSubscriptions = await base44.entities.PushSubscription.list();
                const userSubscription = existingSubscriptions.find(s => s.user_email === currentUser.email);
                
                const subscriptionData = {
                  user_email: currentUser.email,
                  subscription: subscription.toJSON(),
                  is_active: true
                };

                if (userSubscription) {
                  await base44.entities.PushSubscription.update(userSubscription.id, subscriptionData);
                  console.log('✅ Subscription atualizada!');
                } else {
                  await base44.entities.PushSubscription.create(subscriptionData);
                  console.log('✅ Subscription criada!');
                }
              } catch (error) {
                console.error('❌ Erro subscription:', error);
              }
            }
            
            const hasAskedPermission = localStorage.getItem('notification-permission-asked');
            const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                          window.navigator.standalone === true;
            
            if (isPWA && Notification.permission === 'default' && !hasAskedPermission) {
              setTimeout(() => {
                setShowNotificationModal(true);
              }, 3000);
            }
          }
        })
        .catch((error) => {
          console.error('❌ Erro SW:', error);
        });
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