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

    // Carregar SW físico do diretório components/pwa
    const loadServiceWorker = async () => {
      try {
        const swResponse = await fetch('/components/pwa/service-worker.js');
        const swCode = await swResponse.text();
        const swBlob = new Blob([swCode], { type: 'application/javascript' });
        const swURL = URL.createObjectURL(swBlob);

        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register(swURL, { 
            scope: '/',
            updateViaCache: 'none'
          });
          
          console.log('✅ Service Worker físico registrado');
          console.log('📍 Scope:', registration.scope);
          
          registration.update();
          
          if ('Notification' in window && 'PushManager' in window) {
            console.log('🔔 Permissão de notificação:', Notification.permission);
            
            if (Notification.permission === 'granted') {
              await navigator.serviceWorker.ready;
              console.log('⏳ Service Worker ready');
              
              const currentUser = await base44.auth.me();
              console.log('👤 Usuário:', currentUser.email);
              
              let subscription = await registration.pushManager.getSubscription();
              console.log('📮 Subscription:', subscription ? 'EXISTE' : 'NÃO EXISTE');
              
              if (!subscription) {
                console.log('📝 Criando subscription...');
                subscription = await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });
                console.log('✅ Subscription criada!');
              }

              console.log('💾 Salvando no banco...');
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
              
              console.log('🎉 Push notifications configurado - funciona com app fechado!');
            }
            
            const hasAskedPermission = localStorage.getItem('notification-permission-asked');
            const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                          window.navigator.standalone === true;
            
            console.log('🏠 PWA?', isPWA);
            console.log('❓ Já perguntou?', hasAskedPermission);
            
            if (isPWA && Notification.permission === 'default' && !hasAskedPermission) {
              setTimeout(() => {
                console.log('📢 Mostrando modal de permissão');
                setShowNotificationModal(true);
              }, 3000);
            }
          }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar SW:', error);
      }
    };

    loadServiceWorker();

    return () => {
      URL.revokeObjectURL(manifestURL);
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