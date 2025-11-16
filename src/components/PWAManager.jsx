import { useEffect } from 'react';
import { manifestData } from './pwa/manifest-data';
import { serviceWorkerCode } from './pwa/service-worker-code';

export default function PWAManager() {
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
          
          // Solicitar permissão para notificações após registro
          if ('Notification' in window && Notification.permission === 'default') {
            const requestPermission = () => {
              Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                  console.log('✅ Permissão de notificação concedida');
                  
                  // Testar notificação
                  registration.showNotification('IA Coach Fitness', {
                    body: '🎉 Notificações ativadas! Agora você receberá lembretes de treino.',
                    icon: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
                    vibrate: [200, 100, 200],
                    tag: 'welcome'
                  });
                }
              });
            };
            
            // Solicitar na primeira interação
            document.addEventListener('click', requestPermission, { once: true });
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

  return null;
}