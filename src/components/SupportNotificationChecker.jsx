import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export default function SupportNotificationChecker({ user }) {
  const isAdmin = user?.role === 'admin';

  const { data: tickets = [] } = useQuery({
    queryKey: ['support-notification-check', user?.email],
    queryFn: () => base44.entities.SupportTicket.list('-created_date'),
    enabled: !!user?.email,
    refetchInterval: 60000, // Verifica a cada minuto
  });

  useEffect(() => {
    if (!user || tickets.length === 0) return;

    const notifiedKey = `support_notified_${user.email}`;
    const notifiedIds = JSON.parse(localStorage.getItem(notifiedKey) || '[]');

    if (isAdmin) {
      // Admin: verificar tickets com has_unread_admin
      const unreadTickets = tickets.filter(t => 
        t.has_unread_admin && 
        t.status !== 'closed' &&
        !notifiedIds.includes(t.id)
      );

      if (unreadTickets.length > 0) {
        toast.info(`🔔 ${unreadTickets.length} novo(s) chamado(s) de suporte aguardando resposta!`, {
          duration: 8000,
          action: {
            label: "Ver",
            onClick: () => window.location.href = "/page/Admin?tab=support"
          }
        });

        // Marcar como notificado
        const newNotifiedIds = [...notifiedIds, ...unreadTickets.map(t => t.id)];
        localStorage.setItem(notifiedKey, JSON.stringify(newNotifiedIds));
      }
    } else {
      // Usuário: verificar tickets com has_unread_user
      const userTickets = tickets.filter(t => t.user_email === user.email);
      const unreadTickets = userTickets.filter(t => 
        t.has_unread_user && 
        !notifiedIds.includes(`${t.id}_user`)
      );

      if (unreadTickets.length > 0) {
        toast.info(`🔔 Você tem ${unreadTickets.length} resposta(s) do suporte!`, {
          duration: 8000,
          action: {
            label: "Ver",
            onClick: () => window.location.href = "/page/Support"
          }
        });

        // Marcar como notificado
        const newNotifiedIds = [...notifiedIds, ...unreadTickets.map(t => `${t.id}_user`)];
        localStorage.setItem(notifiedKey, JSON.stringify(newNotifiedIds));
      }
    }
  }, [tickets, user, isAdmin]);

  return null;
}