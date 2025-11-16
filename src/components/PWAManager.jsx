import { useEffect, useState } from 'react';
import { manifestData } from './pwa/manifest-data';
import { serviceWorkerCode } from './pwa/service-worker-code';
import InstallPWAModal from './pwa/InstallPWAModal';
import NotificationPermissionModal from './pwa/NotificationPermissionModal';

export default function PWAManager() {
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
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

    // Registrar Service Worker via Blob
    if ('serviceWorker' in navigator) {
      const swBlob = new Blob([serviceWorkerCode], { type: 'application/javascript' });
      const swURL = URL.createObjectURL(swBlob);
      
      navigator.serviceWorker
        .register(swURL)
        .then((registration) => {
          console.log('✅ Service Worker registrado:', registration.scope);
          
          // Verificar se já pediu permissão
          const hasAskedPermission = localStorage.getItem('notification-permission-asked');
          
          // Mostrar modal após 5 segundos se ainda não pediu
          if ('Notification' in window && Notification.permission === 'default' && !hasAskedPermission) {
            setTimeout(() => {
              setShowNotificationModal(true);
            }, 5000);
          }
        })
        .catch((error) => {
          console.error('❌ Erro ao registrar Service Worker:', error);
        });
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