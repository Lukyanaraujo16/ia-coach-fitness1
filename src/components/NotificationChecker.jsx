import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function NotificationChecker({ user }) {
  const { data: notifications = [] } = useQuery({
    queryKey: ['pending-notifications'],
    queryFn: () => base44.entities.NotificationSchedule.list('-created_date', 20),
    refetchInterval: 2000,
    enabled: !!user,
  });

  // Listener para broadcasts via BroadcastChannel
  useEffect(() => {
    if (!user) return;

    if (!('BroadcastChannel' in window)) {
      console.log('⚠️ BroadcastChannel não suportado');
      return;
    }

    const channel = new BroadcastChannel('push-notifications');
    
    channel.onmessage = async (event) => {
      const notif = event.data;
      console.log('📢 Broadcast recebido:', notif);

      const isPremium = user.subscription_status === 'premium';

      // Verificar target audience
      if (notif.target_audience === 'premium' && !isPremium) {
        console.log('  ❌ Premium only');
        return;
      }
      if (notif.target_audience === 'free' && isPremium) {
        console.log('  ❌ Free only');
        return;
      }

      // Enviar notificação
      try {
        if ('Notification' in window && Notification.permission === 'granted') {
          console.log('🔔 Enviando broadcast:', notif.title);
          
          if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
              const registration = await navigator.serviceWorker.ready;
              await registration.showNotification(notif.title, {
                body: notif.message,
                icon: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
                badge: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
                vibrate: [200, 100, 200],
                tag: `broadcast-${notif.id}`,
                requireInteraction: false
              });
              console.log('✅ Broadcast enviado via SW!');
            } catch (swError) {
              new Notification(notif.title, {
                body: notif.message,
                icon: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
                vibrate: [200, 100, 200]
              });
              console.log('✅ Broadcast enviado via API!');
            }
          } else {
            new Notification(notif.title, {
              body: notif.message,
              icon: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
              vibrate: [200, 100, 200]
            });
            console.log('✅ Broadcast enviado!');
          }
        }
      } catch (error) {
        console.error('❌ Erro no broadcast:', error);
      }
    };

    return () => {
      channel.close();
    };
  }, [user]);

  // Processar notificações agendadas e recorrentes
  useEffect(() => {
    if (!user || !notifications.length) return;

    const isPremium = user.subscription_status === 'premium';

    console.log('🔍 Verificando notificações agendadas...', notifications.length, 'encontradas');

    const notificationsToShow = notifications.filter(notif => {
      console.log('📋 Verificando:', notif.title);

      if (notif.status === 'cancelled') {
        console.log('  ❌ Cancelada');
        return false;
      }

      if (notif.target_audience === 'premium' && !isPremium) {
        console.log('  ❌ Premium only');
        return false;
      }
      if (notif.target_audience === 'free' && isPremium) {
        console.log('  ❌ Free only');
        return false;
      }

      const shownKey = `notif-shown-${notif.id}`;
      if (localStorage.getItem(shownKey)) {
        console.log('  ❌ Já mostrada');
        return false;
      }

      if (notif.schedule_type === 'scheduled' && notif.scheduled_date) {
        const scheduledDate = new Date(notif.scheduled_date);
        const nowDate = new Date();
        if (nowDate >= scheduledDate && notif.status === 'pending') {
          console.log('  ✅ Hora de enviar agendada!');
          return true;
        }
      }

      if (notif.schedule_type === 'recurring' && notif.is_active) {
        const lastShownKey = `notif-last-shown-${notif.id}`;
        const lastShown = localStorage.getItem(lastShownKey);
        const today = new Date().toDateString();
        
        if (lastShown !== today) {
          const [hours, minutes] = (notif.recurrence_time || '09:00').split(':');
          const scheduledTime = new Date();
          scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          if (new Date() >= scheduledTime) {
            console.log('  ✅ Recorrente hora certa!');
            return true;
          }
        }
      }

      return false;
    });

    console.log('📬 Para mostrar:', notificationsToShow.length);

    notificationsToShow.forEach(async (notif) => {
      try {
        if ('Notification' in window && Notification.permission === 'granted') {
          console.log('🔔 Mostrando:', notif.title);
          
          if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
              const registration = await navigator.serviceWorker.ready;
              await registration.showNotification(notif.title, {
                body: notif.message,
                icon: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
                badge: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
                vibrate: [200, 100, 200],
                tag: `notification-${notif.id}`,
                requireInteraction: false
              });
              console.log('✅ Enviada via SW!');
            } catch (swError) {
              new Notification(notif.title, {
                body: notif.message,
                icon: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
                vibrate: [200, 100, 200]
              });
              console.log('✅ Enviada via API!');
            }
          } else {
            new Notification(notif.title, {
              body: notif.message,
              icon: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
              vibrate: [200, 100, 200]
            });
            console.log('✅ Enviada!');
          }

          localStorage.setItem(`notif-shown-${notif.id}`, 'true');
          
          if (notif.schedule_type === 'recurring') {
            localStorage.setItem(`notif-last-shown-${notif.id}`, new Date().toDateString());
          }
        }
      } catch (error) {
        console.error('❌ Erro:', error);
      }
    });
  }, [notifications, user]);

  return null;
}