import { useEffect } from "react";

export const notificationManager = {
  // Verificar se notificações são suportadas
  isSupported: () => {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  },

  // Verificar permissão atual
  getPermission: () => {
    if (!notificationManager.isSupported()) return 'denied';
    return Notification.permission;
  },

  // Pedir permissão
  requestPermission: async () => {
    if (!notificationManager.isSupported()) {
      return { success: false, error: 'Notificações não suportadas neste navegador' };
    }

    if (Notification.permission === 'granted') {
      return { success: true, permission: 'granted' };
    }

    if (Notification.permission === 'denied') {
      return { success: false, error: 'Notificações foram bloqueadas. Ative nas configurações do navegador.' };
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem('notification-permission', 'granted');
        return { success: true, permission };
      } else {
        return { success: false, error: 'Permissão negada' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Mostrar notificação local
  showNotification: (title, options = {}) => {
    if (!notificationManager.isSupported() || Notification.permission !== 'granted') {
      return;
    }

    const defaultOptions = {
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      vibrate: [200, 100, 200],
      ...options,
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Usar service worker se disponível
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, defaultOptions);
      });
    } else {
      // Fallback para notificação normal
      new Notification(title, defaultOptions);
    }
  },

  // Registrar para push notifications (requer backend)
  subscribeToPush: async () => {
    if (!notificationManager.isSupported()) {
      return { success: false, error: 'Push notifications não suportadas' };
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // VAPID public key - deve vir do backend
      // const vapidPublicKey = 'YOUR_PUBLIC_VAPID_KEY';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // applicationServerKey: vapidPublicKey
      });

      // Aqui você enviaria a subscription para o backend
      console.log('Push subscription:', subscription);
      
      return { success: true, subscription };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Cancelar push notifications
  unsubscribeFromPush: async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        return { success: true };
      }
      
      return { success: false, error: 'Nenhuma inscrição ativa' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

// Hook para usar notificações
export function useNotifications() {
  useEffect(() => {
    // Registrar service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registrado:', registration);
        })
        .catch(error => {
          console.log('Erro ao registrar Service Worker:', error);
        });
    }
  }, []);

  return notificationManager;
}

export default notificationManager;