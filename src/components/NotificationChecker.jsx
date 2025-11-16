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

  useEffect(() => {
    if (!user || !notifications.length) return;

    const isPremium = user.subscription_status === 'premium';
    const now = Date.now();

    console.log('🔍 Verificando notificações...', notifications.length, 'encontradas');

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

      if (notif.schedule_type === 'immediate' && notif.status === 'sent') {
        const createdTime = new Date(notif.created_date).getTime();
        const twoMinutesInMs = 2 * 60 * 1000;
        const ageInMs = now - createdTime;
        
        console.log(`  📅 Idade: ${Math.floor(ageInMs / 1000)}s (limite: 120s)`);
        
        if (ageInMs <= twoMinutesInMs) {
          console.log('  ✅ Notificação NOVA!');
          return true;
        } else {
          console.log('  ❌ Notificação antiga');
          return false;
        }
      }

      if (notif.schedule_type === 'scheduled' && notif.scheduled_date) {
        const scheduledDate = new Date(notif.scheduled_date);
        if (now >= scheduledDate.getTime() && notif.status === 'pending') {
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
          
          if (now >= scheduledTime.getTime()) {
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