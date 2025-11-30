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

// Salvar subscription no banco de dados
async function saveSubscriptionToDatabase(subscription, userEmail) {
  try {
    console.log('💾 Salvando subscription no banco...');
    const existingSubscriptions = await base44.entities.PushSubscription.list();
    const userSubscription = existingSubscriptions.find(s => s.user_email === userEmail);
    
    const subscriptionData = {
      user_email: userEmail,
      subscription: typeof subscription === 'string' ? JSON.parse(subscription) : subscription,
      is_active: true
    };

    if (userSubscription) {
      await base44.entities.PushSubscription.update(userSubscription.id, subscriptionData);
      console.log('✅ Subscription atualizada no banco!');
    } else {
      await base44.entities.PushSubscription.create(subscriptionData);
      console.log('✅ Subscription criada no banco!');
    }
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar subscription:', error);
    return false;
  }
}

export default function PWAManager() {
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    console.log('🚀 PWAManager iniciado');
    
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone === true;
    const isFromExternalPWA = document.referrer.includes('pwa-ia-coach.vercel.app');
    
    console.log('🏠 PWA?', isPWA);
    console.log('🔗 Veio do PWA externo?', isFromExternalPWA);
    
    // Configurar manifest
    const manifestBlob = new Blob([JSON.stringify(manifestData)], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(manifestBlob);
    
    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = manifestURL;

    const initPushNotifications = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser) return;
        
        console.log('👤 Usuário:', currentUser.email);
        
        // Verificar se há subscription salva do PWA externo (localStorage compartilhado não funciona cross-domain)
        // Então vamos registrar diretamente se tivermos permissão
        
        if ('Notification' in window && 'PushManager' in window) {
          console.log('🔔 Permissão de notificação:', Notification.permission);
          
          if (Notification.permission === 'granted') {
            // Tentar registrar SW e subscription
            await registerLocalPushSubscription(currentUser.email);
          } else if (Notification.permission === 'default') {
            // Verificar se está no PWA para pedir permissão
            const hasAskedPermission = localStorage.getItem('notification-permission-asked');
            
            if (isPWA && !hasAskedPermission) {
              setTimeout(() => {
                console.log('📢 Mostrando modal de permissão');
                setShowNotificationModal(true);
              }, 3000);
            }
          }
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar push:', error);
      }
    };

    const registerLocalPushSubscription = async (userEmail) => {
      try {
        // Carregar SW físico do diretório components/pwa
        const swResponse = await fetch('/components/pwa/service-worker.js');
        const swCode = await swResponse.text();
        const swBlob = new Blob([swCode], { type: 'application/javascript' });
        const swURL = URL.createObjectURL(swBlob);

        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register(swURL, { 
            scope: '/',
            updateViaCache: 'none'
          });
          
          console.log('✅ Service Worker registrado');
          
          await navigator.serviceWorker.ready;
          
          let subscription = await registration.pushManager.getSubscription();
          
          if (!subscription) {
            console.log('📝 Criando subscription...');
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
            console.log('✅ Subscription criada!');
          }

          await saveSubscriptionToDatabase(subscription.toJSON(), userEmail);
          console.log('🎉 Push notifications configurado!');
        }
      } catch (error) {
        console.error('❌ Erro ao registrar SW local:', error);
      }
    };

    // Escutar mensagens do PWA externo (se estiver em iframe)
    const handleMessage = async (event) => {
      // Aceitar mensagens do PWA externo
      if (!event.origin.includes('pwa-ia-coach.vercel.app')) {
        return;
      }
      
      console.log('📨 Mensagem do PWA externo:', event.data);
      
      if (event.data.type === 'PUSH_SUBSCRIPTION' && event.data.subscription) {
        try {
          const currentUser = await base44.auth.me();
          if (currentUser) {
            await saveSubscriptionToDatabase(event.data.subscription, currentUser.email);
          }
        } catch (error) {
          console.error('Erro ao salvar subscription do PWA externo:', error);
        }
      }
      
      if (event.data.type === 'NOTIFICATION_PERMISSION_GRANTED' && event.data.subscription) {
        try {
          const currentUser = await base44.auth.me();
          if (currentUser) {
            await saveSubscriptionToDatabase(event.data.subscription, currentUser.email);
          }
        } catch (error) {
          console.error('Erro ao salvar subscription:', error);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Inicializar push
    initPushNotifications();

    return () => {
      URL.revokeObjectURL(manifestURL);
      window.removeEventListener('message', handleMessage);
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