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

    console.log('🔍 Verificando notificações...', notifications.length);

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
        const sentDate = new Date(notif.last_sent_date || notif.created_date);
        const nowDate = new Date();
        const ageInSeconds = Math.floor(Math.abs(nowDate.getTime() - sentDate.getTime()) / 1000);
        
        console.log(`  📅 Idade: ${ageInSeconds}s`);
        
        if (ageInSeconds <= 120) {
          console.log('  ✅ NOVA!');
          return true;
        } else {
          console.log(`  ❌ Antiga`);
          return false;
        }
      }

      if (notif.schedule_type === 'scheduled' && notif.scheduled_date) {
        const scheduledDate = new Date(notif.scheduled_date);
        const nowDate = new Date();
        if (nowDate >= scheduledDate && notif.status === 'pending') {
          console.log('  ✅ Agendada!');
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
            console.log('  ✅ Recorrente!');
            return true;
          }
        }
      }

      return false;
    });

    console.log('📬 Mostrar:', notificationsToShow.length);

    notificationsToShow.forEach(async (notif) => {
      console.log('🔔 Enviando:', notif.title);
      
      if (!('Notification' in window)) {
        console.error('❌ API não suportada');
        return;
      }

      if (Notification.permission !== 'granted') {
        console.error('❌ Permissão:', Notification.permission);
        return;
      }

      try {
        // Tentar com Notification API direta (mais confiável)
        new Notification(notif.title, {
          body: notif.message,
          icon: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
          vibrate: [200, 100, 200],
          tag: `notif-${notif.id}`
        });
        console.log('✅ Enviada!');

        localStorage.setItem(`notif-shown-${notif.id}`, 'true');
        
        if (notif.schedule_type === 'recurring') {
          localStorage.setItem(`notif-last-shown-${notif.id}`, new Date().toDateString());
        }
      } catch (error) {
        console.error('❌ Erro:', error.message);
      }
    });
  }, [notifications, user]);

  return null;
}