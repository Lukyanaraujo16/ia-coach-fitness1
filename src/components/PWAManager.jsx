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

    // Registrar Service Worker físico (não Blob) para suporte a push em background
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js', { 
          scope: '/',
          updateViaCache: 'none'
        })
        .then(async (registration) => {
          console.log('✅ Service Worker físico registrado');
          console.log('📍 Scope:', registration.scope);
          console.log('🔄 Estado:', registration.active?.state);
          
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
                
                console.log('🎉 TUDO PRONTO! Notificações funcionando mesmo com app fechado (iOS + Android).');
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