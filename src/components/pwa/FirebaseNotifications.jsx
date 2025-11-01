import { useEffect, useState } from "react";
import { requestNotificationPermission, onMessageListener } from "@/lib/firebase";
import { toast } from "sonner";

export function useFirebaseNotifications() {
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [fcmToken, setFcmToken] = useState(null);

  useEffect(() => {
    // Verificar permissão atual
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Escutar mensagens em primeiro plano
    const unsubscribe = onMessageListener().then((payload) => {
      if (payload) {
        // Mostrar toast quando receber notificação
        toast(payload.notification?.title || 'Nova Notificação', {
          description: payload.notification?.body,
          action: payload.data?.url ? {
            label: 'Abrir',
            onClick: () => window.location.href = payload.data.url,
          } : undefined,
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe.catch(() => {});
    };
  }, []);

  const requestPermission = async () => {
    const result = await requestNotificationPermission();
    
    if (result.success) {
      setNotificationPermission('granted');
      setFcmToken(result.token);
      
      // ⚠️ AQUI: Envie o token para seu backend
      // await base44.auth.updateMe({ fcm_token: result.token });
      
      toast.success('Notificações ativadas! 🎉');
    } else {
      toast.error(result.error);
    }
    
    return result;
  };

  return {
    notificationPermission,
    fcmToken,
    requestPermission,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator,
  };
}

export default useFirebaseNotifications;