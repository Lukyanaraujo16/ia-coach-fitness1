import { useEffect, useState } from 'react';
import { manifestData } from './pwa/manifest-data';
import { serviceWorkerCode } from './pwa/service-worker-code';
import InstallPWAModal from './pwa/InstallPWAModal';
import NotificationPermissionModal from './pwa/NotificationPermissionModal';

export default function PWAManager() {
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    console.log('🚀 PWAManager iniciado');
    
    // Criar manifest.json dinamicamente
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

    // Registrar Service Worker para Push Notifications
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      console.log('✅ Service Worker e Push API suportados');
      
      const swBlob = new Blob([serviceWorkerCode], { type: 'application/javascript' });
      const swURL = URL.createObjectURL(swBlob);
      
      navigator.serviceWorker
        .register(swURL, { scope: '/' })
        .then((registration) => {
          console.log('✅ Service Worker registrado:', registration);
          
          // Verificar suporte a notificações
          if ('Notification' in window) {
            console.log('✅ Notificações suportadas');
            console.log('📊 Status atual:', Notification.permission);
            
            const hasAskedPermission = localStorage.getItem('notification-permission-asked');
            
            // Verificar se está rodando como PWA
            const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                          window.navigator.standalone === true;
            
            console.log('📱 Rodando como PWA?', isPWA);
            console.log('📋 Já pediu antes?', hasAskedPermission);
            
            // Mostrar modal após 3 segundos se for PWA, primeira vez e permissão não concedida
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

    // Cleanup
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