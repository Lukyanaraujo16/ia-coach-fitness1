import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function NotificationChecker({ user }) {
  const { data: notifications = [] } = useQuery({
    queryKey: ['pending-notifications'],
    queryFn: () => base44.entities.NotificationSchedule.list('-created_date', 20),
    refetchInterval: 5000, // Verificar a cada 5 segundos
    enabled: !!user,
  });

  useEffect(() => {
    if (!user || !notifications.length) return;

    const isPremium = user.subscription_status === 'premium';
    const now = new Date();

    const notificationsToShow = notifications.filter(notif => {
      if (notif.status === 'cancelled') return false;

      // Verificar público alvo
      if (notif.target_audience === 'premium' && !isPremium) return false;
      if (notif.target_audience === 'free' && isPremium) return false;

      // Verificar se já foi mostrada (localStorage)
      const shownKey = `notif-shown-${notif.id}`;
      if (localStorage.getItem(shownKey)) return false;

      // Verificar tipo de agendamento
      if (notif.schedule_type === 'immediate' && notif.status === 'sent') {
        return true;
      }

      if (notif.schedule_type === 'scheduled' && notif.scheduled_date) {
        const scheduledDate = new Date(notif.scheduled_date);
        return now >= scheduledDate && notif.status === 'pending';
      }

      if (notif.schedule_type === 'recurring' && notif.is_active) {
        const lastShownKey = `notif-last-shown-${notif.id}`;
        const lastShown = localStorage.getItem(lastShownKey);
        const today = now.toDateString();
        
        if (lastShown !== today) {
          const [hours, minutes] = (notif.recurrence_time || '09:00').split(':');
          const scheduledTime = new Date();
          scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          return now >= scheduledTime;
        }
      }

      return false;
    });

    // Mostrar notificações
    notificationsToShow.forEach(async (notif) => {
      try {
        if ('Notification' in window && Notification.permission === 'granted') {
          console.log('🔔 Mostrando notificação:', notif.title);
          
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
              console.log('✅ Notificação enviada via Service Worker!');
            } catch (swError) {
              console.log('⚠️ Fallback para Notification API:', swError);
              new Notification(notif.title, {
                body: notif.message,
                icon: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
                vibrate: [200, 100, 200]
              });
              console.log('✅ Notificação enviada via API direta!');
            }
          } else {
            new Notification(notif.title, {
              body: notif.message,
              icon: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
              vibrate: [200, 100, 200]
            });
            console.log('✅ Notificação enviada via API direta!');
          }

          // Marcar como mostrada
          if (notif.schedule_type === 'recurring') {
            localStorage.setItem(`notif-last-shown-${notif.id}`, now.toDateString());
          } else {
            localStorage.setItem(`notif-shown-${notif.id}`, 'true');
          }
        }
      } catch (error) {
        console.error('❌ Erro ao mostrar notificação:', error);
      }
    });
  }, [notifications, user]);

  return null;
}