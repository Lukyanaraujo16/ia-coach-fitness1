import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  X, 
  CheckCheck, 
  MessageCircle, 
  Dumbbell, 
  Sparkles, 
  Megaphone,
  Target,
  HelpCircle,
  Bug
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const typeConfig = {
  support: { icon: MessageCircle, color: "text-blue-400", bg: "bg-blue-600/20" },
  push: { icon: Megaphone, color: "text-purple-400", bg: "bg-purple-600/20" },
  workout: { icon: Dumbbell, color: "text-green-400", bg: "bg-green-600/20" },
  ai: { icon: Sparkles, color: "text-yellow-400", bg: "bg-yellow-600/20" },
  system: { icon: Bell, color: "text-slate-400", bg: "bg-slate-600/20" },
  challenge: { icon: Target, color: "text-orange-400", bg: "bg-orange-600/20" },
};

export default function NotificationCenter({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [popupNotification, setPopupNotification] = useState(null);

  // Buscar notificações do usuário
  const { data: notifications = [] } = useQuery({
    queryKey: ['app-notifications', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const notifs = await base44.entities.AppNotification.filter(
        { user_email: user.email },
        '-created_date',
        50
      );
      // Filtrar notificações expiradas
      const now = new Date();
      return notifs.filter(n => !n.expires_at || new Date(n.expires_at) > now);
    },
    enabled: !!user?.email,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  // Buscar tickets de suporte com mensagens não lidas
  const { data: supportTickets = [] } = useQuery({
    queryKey: ['support-unread', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const tickets = await base44.entities.SupportTicket.filter(
        { user_email: user.email, has_unread_user: true }
      );
      return tickets;
    },
    enabled: !!user?.email && user?.role !== 'admin',
    refetchInterval: 30000,
  });

  // Para admin: buscar tickets não lidos
  const { data: adminTickets = [] } = useQuery({
    queryKey: ['admin-support-unread'],
    queryFn: async () => {
      const tickets = await base44.entities.SupportTicket.filter(
        { has_unread_admin: true }
      );
      return tickets.filter(t => t.status !== 'closed');
    },
    enabled: user?.role === 'admin',
    refetchInterval: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => 
      base44.entities.AppNotification.update(notificationId, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries(['app-notifications']),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      for (const notif of unread) {
        await base44.entities.AppNotification.update(notif.id, { is_read: true });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['app-notifications']),
  });

  const markSupportAsReadMutation = useMutation({
    mutationFn: (ticketId) => 
      base44.entities.SupportTicket.update(ticketId, { 
        has_unread_user: false,
        has_unread_admin: false 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['support-unread']);
      queryClient.invalidateQueries(['admin-support-unread']);
    },
  });

  // Calcular total de notificações não lidas
  const unreadNotifications = notifications.filter(n => !n.is_read);
  const unreadSupportCount = user?.role === 'admin' ? adminTickets.length : supportTickets.length;
  const totalUnread = unreadNotifications.length + unreadSupportCount;

  // Combinar notificações e tickets de suporte
  const allItems = [
    ...supportTickets.map(t => ({
      id: `support_${t.id}`,
      ticketId: t.id,
      type: 'support',
      title: `Resposta do Suporte: ${t.title}`,
      message: t.messages?.[t.messages.length - 1]?.message || '',
      created_date: t.last_interaction_at || t.updated_date,
      is_read: false,
      link_type: 'support_ticket',
    })),
    ...adminTickets.map(t => ({
      id: `admin_support_${t.id}`,
      ticketId: t.id,
      type: t.subject === 'bug' ? 'support' : 'support',
      title: `Novo chamado: ${t.title}`,
      message: t.messages?.[t.messages.length - 1]?.message || t.description,
      created_date: t.last_interaction_at || t.created_date,
      is_read: false,
      link_type: 'support_ticket',
      isAdmin: true,
      userName: t.user_name,
    })),
    ...unreadNotifications.map(n => ({
      ...n,
      id: n.id,
    })),
  ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const handleNotificationClick = (item) => {
    // Marcar como lida
    if (item.ticketId) {
      markSupportAsReadMutation.mutate(item.ticketId);
    } else if (!item.is_read) {
      markAsReadMutation.mutate(item.id);
    }

    // Ação baseada no tipo
    if (item.link_type === 'support_ticket') {
      setIsOpen(false);
      if (item.isAdmin) {
        navigate(createPageUrl("Admin") + "?tab=support");
      } else {
        navigate(createPageUrl("Support"));
      }
    } else if (item.link_type === 'workout' && item.link_id) {
      setIsOpen(false);
      navigate(createPageUrl("WorkoutDetail") + `?id=${item.link_id}`);
    } else if (item.link_type === 'page' && item.link_id) {
      setIsOpen(false);
      navigate(createPageUrl(item.link_id));
    } else {
      // Popup para notificações gerais
      setPopupNotification(item);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
    // Também marcar tickets como lidos
    if (user?.role === 'admin') {
      adminTickets.forEach(t => markSupportAsReadMutation.mutate(t.id));
    } else {
      supportTickets.forEach(t => markSupportAsReadMutation.mutate(t.id));
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Botão de Notificações */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="text-white hover:bg-slate-800 relative"
        >
          <Bell className="w-5 h-5" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </Button>

        {/* Dropdown de Notificações */}
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <div className="absolute right-0 top-12 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-[70vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <h3 className="text-white font-semibold">Notificações</h3>
                {totalUnread > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-blue-400 hover:text-blue-300 text-xs"
                  >
                    <CheckCheck className="w-4 h-4 mr-1" />
                    Ler todas
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {allItems.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">Nenhuma notificação</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {allItems.slice(0, 20).map((item) => {
                      const config = typeConfig[item.type] || typeConfig.system;
                      const Icon = config.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          className={`w-full p-4 text-left hover:bg-slate-800/50 transition-all ${
                            !item.is_read ? 'bg-blue-900/10' : ''
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                              <Icon className={`w-5 h-5 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`font-medium text-sm truncate ${!item.is_read ? 'text-white' : 'text-slate-300'}`}>
                                  {item.title}
                                </p>
                                {!item.is_read && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                                )}
                              </div>
                              {item.userName && (
                                <p className="text-slate-500 text-xs">de {item.userName}</p>
                              )}
                              <p className="text-slate-400 text-xs mt-1 line-clamp-2">{item.message}</p>
                              <p className="text-slate-500 text-xs mt-1">
                                {format(new Date(item.created_date), "dd/MM HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Popup de Notificação */}
      {popupNotification && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={() => setPopupNotification(null)}>
          <Card className="bg-slate-900 border-slate-800 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const config = typeConfig[popupNotification.type] || typeConfig.system;
                    const Icon = config.icon;
                    return (
                      <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${config.color}`} />
                      </div>
                    );
                  })()}
                  <div>
                    <h3 className="text-white font-semibold">{popupNotification.title}</h3>
                    <p className="text-slate-500 text-xs">
                      {format(new Date(popupNotification.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPopupNotification(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-slate-300 whitespace-pre-wrap">{popupNotification.message}</p>
              <Button
                onClick={() => setPopupNotification(null)}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
              >
                Fechar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}