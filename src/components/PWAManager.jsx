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

    // Registrar Service Worker via Blob
    if ('serviceWorker' in navigator) {
      console.log('✅ Service Worker suportado');
      
      const swBlob = new Blob([serviceWorkerCode], { type: 'application/javascript' });
      const swURL = URL.createObjectURL(swBlob);
      
      navigator.serviceWorker
        .register(swURL)
        .then((registration) => {
          console.log('✅ Service Worker registrado:', registration.scope);
          
          // Verificar suporte a notificações
          if ('Notification' in window) {
            console.log('✅ Notificações suportadas');
            console.log('📊 Status atual:', Notification.permission);
            
            const hasAskedPermission = localStorage.getItem('notification-permission-asked');
            console.log('📋 Já pediu antes?', hasAskedPermission);
            
            // iOS Safari não suporta Notification API
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            if (isIOS) {
              console.log('⚠️ iOS detectado - Notificações Web não suportadas');
              return;
            }
            
            // Mostrar modal após 5 segundos se ainda não pediu
            if (Notification.permission === 'default' && !hasAskedPermission) {
              console.log('⏱️ Agendando modal de notificação em 5s');
              setTimeout(() => {
                console.log('🔔 Mostrando modal de notificação');
                setShowNotificationModal(true);
              }, 5000);
            }
          } else {
            console.log('❌ Notificações NÃO suportadas');
          }
        })
        .catch((error) => {
          console.error('❌ Erro ao registrar Service Worker:', error);
        });
    } else {
      console.log('❌ Service Worker NÃO suportado');
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