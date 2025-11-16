import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function NotificationChecker({ user }) {
  const { data: notifications = [] } = useQuery({
    queryKey: ['pending-notifications'],
    queryFn: () => base44.entities.NotificationSchedule.list('-created_date', 50),
    refetchInterval: 2000, // Verificar a cada 2 segundos
    enabled: !!user,
  });

  useEffect(() => {
    if (!user || !notifications.length) return;

    const isPremium = user.subscription_status === 'premium';
    const now = new Date();

    console.log('🔍 Verificando notificações...', notifications.length, 'encontradas');

    const notificationsToShow = notifications.filter(notif => {
      // Debug para cada notificação
      console.log('📋 Verificando:', notif.title, {
        status: notif.status,
        schedule_type: notif.schedule_type,
        target_audience: notif.target_audience,
        created: notif.created_date
      });

      if (notif.status === 'cancelled') {
        console.log('  ❌ Cancelada');
        return false;
      }

      // Verificar público alvo
      if (notif.target_audience === 'premium' && !isPremium) {
        console.log('  ❌ Premium only, usuário não é premium');
        return false;
      }
      if (notif.target_audience === 'free' && isPremium) {
        console.log('  ❌ Free only, usuário é premium');
        return false;
      }

      // Verificar se já foi mostrada
      const shownKey = `notif-shown-${notif.id}`;
      const alreadyShown = localStorage.getItem(shownKey);
      
      if (alreadyShown) {
        console.log('  ❌ Já foi mostrada');
        return false;
      }

      // Notificações imediatas
      if (notif.schedule_type === 'immediate' && notif.status === 'sent') {
        // Verificar se foi criada nos últimos 5 minutos
        const createdDate = new Date(notif.created_date);
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        
        if (createdDate > fiveMinutesAgo) {
          console.log('  ✅ Notificação imediata recente!');
          return true;
        } else {
          console.log('  ❌ Notificação imediata antiga');
          return false;
        }
      }

      // Notificações agendadas
      if (notif.schedule_type === 'scheduled' && notif.scheduled_date) {
        const scheduledDate = new Date(notif.scheduled_date);
        if (now >= scheduledDate && notif.status === 'pending') {
          console.log('  ✅ Notificação agendada chegou a hora!');
          return true;
        }
      }

      // Notificações recorrentes
      if (notif.schedule_type === 'recurring' && notif.is_active) {
        const lastShownKey = `notif-last-shown-${notif.id}`;
        const lastShown = localStorage.getItem(lastShownKey);
        const today = now.toDateString();
        
        if (lastShown !== today) {
          const [hours, minutes] = (notif.recurrence_time || '09:00').split(':');
          const scheduledTime = new Date();
          scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          if (now >= scheduledTime) {
            console.log('  ✅ Notificação recorrente hora certa!');
            return true;
          }
        }
      }

      return false;
    });

    console.log('📬 Notificações para mostrar:', notificationsToShow.length);

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
            console.log('💾 Marcada como mostrada hoje (recorrente)');
          } else {
            localStorage.setItem(`notif-shown-${notif.id}`, 'true');
            console.log('💾 Marcada como mostrada permanentemente');
          }
        } else {
          console.log('❌ Notificações não permitidas ou não suportadas');
        }
      } catch (error) {
        console.error('❌ Erro ao mostrar notificação:', error);
      }
    });
  }, [notifications, user]);

  return null;
}