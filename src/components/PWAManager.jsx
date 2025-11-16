import { useEffect } from 'react';

export default function PWAManager() {
  useEffect(() => {
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado com sucesso:', registration);
        })
        .catch((error) => {
          console.log('Falha ao registrar Service Worker:', error);
        });
    }

    // Solicitar permissão para notificações
    if ('Notification' in window && Notification.permission === 'default') {
      // Aguardar interação do usuário antes de solicitar permissão
      const requestPermission = () => {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            console.log('Permissão de notificação concedida');
          }
        });
      };

      // Adicionar listener para primeira interação
      document.addEventListener('click', requestPermission, { once: true });
    }
  }, []);

  return null;
}