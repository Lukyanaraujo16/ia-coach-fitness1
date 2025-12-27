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

    // Registrar Service Worker do /public
    const loadServiceWorker = async () => {
      try {
        if ('serviceWorker' in navigator) {
          console.log('🔄 Registrando Service Worker...');

          const registration = await navigator.serviceWorker.register('/service-worker.js', { 
            scope: '/',
            updateViaCache: 'none'
          });

          console.log('✅ Service Worker registrado');
          console.log('📍 Scope:', registration.scope);
          console.log('📱 State:', registration.active?.state);

          // Forçar atualização
          registration.update();

          // Aguardar o SW estar ativo
          await navigator.serviceWorker.ready;
          console.log('✅ Service Worker ready e ativo');

          if ('Notification' in window && 'PushManager' in window) {
            console.log('🔔 Permissão de notificação:', Notification.permission);

            if (Notification.permission === 'granted') {
              try {
                const currentUser = await base44.auth.me();
                console.log('👤 Usuário:', currentUser.email);

                let subscription = await registration.pushManager.getSubscription();
                console.log('📮 Subscription existente:', subscription ? 'SIM' : 'NÃO');

                if (!subscription) {
                  console.log('📝 Criando nova subscription...');
                  subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                  });
                  console.log('✅ Subscription criada:', subscription.endpoint);
                } else {
                  console.log('✅ Subscription já existe:', subscription.endpoint);
                }

                console.log('💾 Preparando para salvar no banco...');
                console.log('🔍 Tipo de subscription:', typeof subscription);
                console.log('🔍 Subscription objeto completo:', subscription);
                console.log('🔍 Endpoint direto:', subscription.endpoint);
                console.log('🔍 Keys direto:', subscription.keys);

                const subscriptionJSON = subscription.toJSON();
                const subscriptionString = JSON.stringify(subscriptionJSON);
                const endpoint = subscription.endpoint;

                console.log('📦 Subscription objeto:', subscription);
                console.log('📄 JSON:', subscriptionJSON);
                console.log('🔗 Endpoint:', endpoint);
                console.log('📝 String:', subscriptionString);

                const existingSubscriptions = await base44.entities.PushSubscription.list();
                console.log('📋 Subscriptions existentes:', existingSubscriptions.length);

                const userSubscription = existingSubscriptions.find(s => s.user_email === currentUser.email);
                console.log('👤 Subscription do usuário:', userSubscription ? 'existe' : 'não existe');

                const payload = {
                  user_email: currentUser.email,
                  subscription_json: subscriptionString,
                  endpoint: endpoint,
                  is_active: true
                };

                console.log('💾 Payload completo:', payload);
                console.log('💾 Endpoint no payload:', payload.endpoint);
                console.log('💾 JSON no payload:', payload.subscription_json?.substring(0, 100));

                if (userSubscription) {
                  console.log('🔄 Atualizando subscription ID:', userSubscription.id);
                  const result = await base44.entities.PushSubscription.update(userSubscription.id, payload);
                  console.log('✅ Atualizado:', result);
                } else {
                  console.log('➕ Criando nova subscription');
                  const result = await base44.entities.PushSubscription.create(payload);
                  console.log('✅ Criado:', result);
                }

                // Validar
                const validate = await base44.entities.PushSubscription.list();
                const saved = validate.find(s => s.user_email === currentUser.email);
                console.log('🔍 Validação:', saved);
                console.log('🔍 Endpoint salvo:', saved?.endpoint);

                if (saved?.endpoint) {
                  console.log('🎉 Push configurado! ✅');
                } else {
                  console.error('❌ FALHA: Endpoint null!');
                }
              } catch (error) {
                console.error('❌ Erro ao configurar push:', error);
                console.error('Stack:', error.stack);
              }
            }

            const hasAskedPermission = localStorage.getItem('notification-permission-asked');
            const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                          window.navigator.standalone === true;

            console.log('🏠 PWA?', isPWA);
            console.log('❓ Já perguntou permissão?', hasAskedPermission);

            if (isPWA && Notification.permission === 'default' && !hasAskedPermission) {
              setTimeout(() => {
                console.log('📢 Mostrando modal de permissão');
                setShowNotificationModal(true);
              }, 3000);
            }
          }
        } else {
          console.log('❌ Service Worker não suportado');
        }
      } catch (error) {
        console.error('❌ Erro fatal ao carregar SW:', error);
      }
    };

    loadServiceWorker();
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