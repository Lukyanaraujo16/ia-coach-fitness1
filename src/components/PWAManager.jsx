import { useEffect, useState } from 'react';
import InstallPWAModal from './pwa/InstallPWAModal';
import NotificationPermissionModal from './pwa/NotificationPermissionModal';
import { base44 } from '@/api/base44Client';

const ONESIGNAL_APP_ID = '1f48fb3f-a93e-42e3-89d1-ef062efe7cb0';

export default function PWAManager() {
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    console.log('🚀 PWAManager iniciado');
    
    const initOneSignal = async () => {
      try {
        // Detectar se é iOS
        const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
        console.log('📱 iOS detectado:', isIOS);

        // Registrar Service Worker para cache (não para notificações)
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register('/service-worker.js', { 
            scope: '/',
            updateViaCache: 'none'
          });
          console.log('✅ Service Worker registrado');
        }

        // Inicializar OneSignal (funciona em iOS e Android)
        if (!window.OneSignalDeferred) {
          window.OneSignalDeferred = window.OneSignalDeferred || [];
          const script = document.createElement('script');
          script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
          script.defer = true;
          document.head.appendChild(script);
        }

        window.OneSignalDeferred.push(async function(OneSignal) {
          await OneSignal.init({
            appId: ONESIGNAL_APP_ID,
            safari_web_id: 'web.onesignal.auto.1f48fb3f-a93e-42e3-89d1-ef062efe7cb0',
            notifyButton: {
              enable: false,
            },
            allowLocalhostAsSecureOrigin: true,
          });

          console.log('✅ OneSignal inicializado');

          // Configurar usuário se estiver logado
          try {
            const user = await base44.auth.me();
            if (user?.email) {
              await OneSignal.login(user.email);
              await OneSignal.User.addEmail(user.email);
              console.log('✅ Usuário identificado no OneSignal:', user.email);
            }
          } catch (e) {
            console.log('⚠️ Usuário não logado ainda');
          }

          // Verificar permissão atual
          const permission = await OneSignal.Notifications.permission;
          console.log('🔔 Permissão OneSignal:', permission);

          // Mostrar modal se estiver em PWA e não tiver permissão
          const hasAskedPermission = localStorage.getItem('notification-permission-asked');
          const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone === true;
          
          if (isPWA && !permission && !hasAskedPermission) {
            setTimeout(() => {
              console.log('📢 Mostrando modal de permissão');
              setShowNotificationModal(true);
            }, 3000);
          }
        });
      } catch (error) {
        console.error('❌ Erro ao inicializar notificações:', error);
      }
    };

    initOneSignal();
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