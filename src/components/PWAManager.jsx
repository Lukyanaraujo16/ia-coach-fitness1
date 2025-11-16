import { useEffect, useState } from 'react';
import { manifestData } from './pwa/manifest-data';
import { serviceWorkerCode } from './pwa/service-worker-code';
import InstallPWAModal from './pwa/InstallPWAModal';
import NotificationPermissionModal from './pwa/NotificationPermissionModal';
import { base44 } from '@/api/base44Client';

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
    console.log('✅ Manifest criado:', manifestURL);

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      console.log('✅ Service Worker e Push API suportados');
      
      const swBlob = new Blob([serviceWorkerCode], { type: 'application/javascript' });
      const swURL = URL.createObjectURL(swBlob);
      
      navigator.serviceWorker
        .register(swURL, { scope: '/' })
        .then(async (registration) => {
          console.log('✅ Service Worker registrado:', registration);
          
          if ('Notification' in window) {
            console.log('✅ Notificações suportadas');
            console.log('📊 Status atual:', Notification.permission);
            
            const hasAskedPermission = localStorage.getItem('notification-permission-asked');
            const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                          window.navigator.standalone === true;
            
            console.log('📱 Rodando como PWA?', isPWA);
            console.log('📋 Já pediu antes?', hasAskedPermission);
            
            // Salvar subscription se permissão já está concedida
            if (Notification.permission === 'granted') {
              try {
                const currentUser = await base44.auth.me();
                console.log('👤 Usuário logado:', currentUser.email);
                
                const existingSubscriptions = await base44.entities.PushSubscription.list();
                const userSubscription = existingSubscriptions.find(s => s.user_email === currentUser.email);
                
                if (!userSubscription) {
                  console.log('💾 Salvando subscription do usuário...');
                  await base44.entities.PushSubscription.create({
                    user_email: currentUser.email,
                    subscription: { enabled: true },
                    is_active: true
                  });
                  console.log('✅ Subscription salva!');
                } else {
                  console.log('✅ Subscription já existe');
                }
              } catch (error) {
                console.log('⚠️ Usuário não logado ou erro ao salvar subscription:', error);
              }
            }
            
            if (isPWA && Notification.permission === 'default' && !hasAskedPermission) {
              console.log('⏱️ Agendando modal de notificação em 3s');
              setTimeout(() => {
                console.log('🔔 Mostrando modal de notificação');
                setShowNotificationModal(true);
              }, 3000);
            }
          } else {
            console.log('❌ Notificações NÃO suportadas');
          }
        })
        .catch((error) => {
          console.error('❌ Erro ao registrar Service Worker:', error);
        });
    } else {
      console.log('❌ Service Worker ou Push API NÃO suportados');
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