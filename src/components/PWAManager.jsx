import { useEffect, useState } from 'react';
import { manifestData } from './pwa/manifest-data';
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
      
      // Verificar se está rodando como PWA
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                    window.navigator.standalone === true;
      
      console.log('📱 Rodando como PWA?', isPWA);
      
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