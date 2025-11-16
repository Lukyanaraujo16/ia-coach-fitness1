import { useEffect, useState } from 'react';
import { manifestData } from './pwa/manifest-data';
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
    console.log('✅ Manifest criado');

    if ('serviceWorker' in navigator) {
      console.log('✅ Service Worker suportado');
      
      navigator.serviceWorker
        .register('/service-worker.js', { scope: '/' })
        .then(async (registration) => {
          console.log('✅ Service Worker registrado:', registration.scope);
          
          if ('Notification' in window) {
            console.log('✅ Notificações suportadas');
            console.log('📊 Status:', Notification.permission);
            
            const hasAskedPermission = localStorage.getItem('notification-permission-asked');
            const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                          window.navigator.standalone === true;
            
            console.log('📱 PWA?', isPWA);
            
            if (Notification.permission === 'granted') {
              try {
                const currentUser = await base44.auth.me();
                console.log('👤 Usuário:', currentUser.email);
                
                const existingSubscriptions = await base44.entities.PushSubscription.list();
                const userSubscription = existingSubscriptions.find(s => s.user_email === currentUser.email);
                
                if (!userSubscription) {
                  console.log('💾 Salvando subscription...');
                  await base44.entities.PushSubscription.create({
                    user_email: currentUser.email,
                    subscription: { enabled: true },
                    is_active: true
                  });
                  console.log('✅ Subscription salva!');
                } else {
                  console.log('✅ Subscription existe');
                }
              } catch (error) {
                console.log('⚠️ Erro subscription:', error.message);
              }
            }
            
            if (isPWA && Notification.permission === 'default' && !hasAskedPermission) {
              console.log('⏱️ Modal em 3s');
              setTimeout(() => {
                setShowNotificationModal(true);
              }, 3000);
            }
          }
        })
        .catch((error) => {
          console.error('❌ Erro SW:', error);
        });
    } else {
      console.log('❌ Service Worker não suportado');
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