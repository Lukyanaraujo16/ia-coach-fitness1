import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, Clock, Users, Calendar, CheckCircle, XCircle, AlertCircle, Repeat, Info } from "lucide-react";
import { toast } from "sonner";

export default function AdminNotifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    target_audience: "all",
    schedule_type: "immediate",
    scheduled_date: "",
    recurrence_pattern: "daily",
    recurrence_time: "09:00",
    channel: "push",
    expires_at: ""
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.NotificationSchedule.list('-created_date'),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['push-subscriptions'],
    queryFn: () => base44.entities.PushSubscription.list(),
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.role !== 'admin') {
          navigate(createPageUrl("Dashboard"));
        }
      } catch (error) {
        base44.auth.redirectToLogin(createPageUrl("AdminNotifications"));
      }
    };
    loadUser();
  }, [navigate]);

  const sendImmediateNotificationMutation = useMutation({
    mutationFn: async (data) => {
      console.log('📤 Iniciando envio de notificação:', data);
      
      const channel = data.channel || 'push';
      let pushResult = { sent: 0, failed: 0 };
      let whatsappResult = { sent: 0, failed: 0 };
      
      // Buscar usuários alvo para criar notificações no app
      let targetUsers = users;
      if (data.target_audience === 'premium') {
        targetUsers = users.filter(u => u.subscription_status === 'premium' || u.subscription_status === 'trial' || u.subscription_status === 'lifetime');
      } else if (data.target_audience === 'free') {
        targetUsers = users.filter(u => !u.subscription_status || u.subscription_status === 'free');
      }
      
      console.log('👥 Usuários alvo:', targetUsers.length);
      
      // Criar notificação no app para cada usuário
      for (const targetUser of targetUsers) {
        if (targetUser.email) {
          const notificationData = {
            user_email: targetUser.email,
            type: 'push',
            title: data.title,
            message: data.message,
            is_read: false,
            link_type: 'popup'
          };
          
          // Adicionar expiração se definida
          if (data.expires_at) {
            notificationData.expires_at = new Date(data.expires_at).toISOString();
          }
          
          await base44.entities.AppNotification.create(notificationData);
        }
      }
      
      console.log('✅ Notificações no app criadas');
      
      // Enviar Push
      if (channel === 'push' || channel === 'both') {
        console.log('🔔 Enviando push notifications via backend...');
        try {
          const response = await base44.functions.invoke('sendPushNotification', {
            title: data.title,
            message: data.message,
            target_audience: data.target_audience
          });
          console.log('📥 Resposta do backend:', response);
          pushResult = response.data || { sent: 0, failed: 0 };
          console.log('✅ Push result:', pushResult);
        } catch (e) {
          console.error('❌ Erro ao enviar push:', e);
          pushResult = { sent: 0, failed: 0, error: e.message };
        }
      }
      
      // Enviar WhatsApp
      if (channel === 'whatsapp' || channel === 'both') {
        console.log('💬 Enviando WhatsApp via backend:', data);
        try {
          const response = await base44.functions.invoke('sendWhatsAppMessage', {
            title: data.title,
            message: data.message,
            target_audience: data.target_audience
          });
          whatsappResult = response.data || { sent: 0, failed: 0 };
          console.log('✅ WhatsApp enviado:', whatsappResult);
        } catch (e) {
          console.error('Erro whatsapp:', e);
        }
      }
      
      await base44.entities.NotificationSchedule.create({
        ...data,
        status: 'sent',
        sent_count: 1,
        last_sent_date: new Date().toISOString()
      });
      
      return {
        sent: (pushResult.sent || 0) + (whatsappResult.sent || 0),
        failed: (pushResult.failed || 0) + (whatsappResult.failed || 0),
        appNotifications: targetUsers.length,
        channel,
        pushResult
      };
    },
    onSuccess: (data) => {
      console.log('✅ Sucesso no envio:', data);
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['push-subscriptions']);
      queryClient.invalidateQueries(['app-notifications']);
      setFormData({
        title: "",
        message: "",
        target_audience: "all",
        schedule_type: "immediate",
        scheduled_date: "",
        recurrence_pattern: "daily",
        recurrence_time: "09:00",
        channel: "push",
        expires_at: ""
      });
      const channelLabel = data.channel === 'both' ? 'Push + WhatsApp' : data.channel === 'whatsapp' ? 'WhatsApp' : 'Push';
      
      if (data.channel === 'push' || data.channel === 'both') {
        const pushSent = data.pushResult?.sent || 0;
        const pushFailed = data.pushResult?.failed || 0;
        toast.success(`✅ ${channelLabel} - Push: ${pushSent} enviados, ${pushFailed} falhas. App: ${data.appNotifications} notificações criadas`);
      } else {
        toast.success(`✅ ${channelLabel} enviado! ${data.appNotifications} notificações no app criadas`);
      }
    },
    onError: (error) => {
      console.error('❌ Erro:', error);
      toast.error('❌ Erro: ' + error.message);
    }
  });

  const scheduleNotificationMutation = useMutation({
    mutationFn: async (data) => {
      const notification = await base44.entities.NotificationSchedule.create({
        ...data,
        status: 'pending'
      });
      return notification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      setFormData({
        title: "",
        message: "",
        target_audience: "all",
        schedule_type: "immediate",
        scheduled_date: "",
        recurrence_pattern: "daily",
        recurrence_time: "09:00",
        channel: "push"
      });
      toast.success('✅ Notificação agendada!');
    },
    onError: (error) => {
      console.error('❌ Erro:', error);
      toast.error('❌ Erro: ' + error.message);
    }
  });

  const toggleRecurrenceMutation = useMutation({
    mutationFn: ({ id, isActive }) => 
      base44.entities.NotificationSchedule.update(id, { is_active: isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('Status atualizado!');
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.NotificationSchedule.update(id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('Notificação cancelada!');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message) {
      toast.error('❌ Preencha título e mensagem');
      return;
    }

    if (formData.schedule_type === 'immediate') {
      sendImmediateNotificationMutation.mutate(formData);
    } else {
      scheduleNotificationMutation.mutate(formData);
    }
  };

  const handleTestNotification = async () => {
    if (!formData.title || !formData.message) {
      toast.error('❌ Preencha título e mensagem');
      return;
    }

    try {
      console.log('🔔 Iniciando teste de notificação');
      
      if (!('Notification' in window)) {
        toast.error('❌ Notificações não suportadas');
        return;
      }

      if (!('serviceWorker' in navigator)) {
        toast.error('❌ Service Worker não suportado');
        return;
      }

      let permission = Notification.permission;
      console.log('📱 Permissão atual:', permission);
      
      if (permission === 'default') {
        permission = await Notification.requestPermission();
        console.log('📱 Nova permissão:', permission);
      }

      if (permission !== 'granted') {
        toast.error('❌ Permissão negada. Habilite nas configurações do navegador.');
        return;
      }

      // Verificar se há service worker registrado
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ Service Worker ready:', registration.scope);

      // Enviar via service worker
      await registration.showNotification(formData.title, {
        body: formData.message,
        icon: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
        badge: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
        vibrate: [200, 100, 200],
        tag: 'test-notification',
        requireInteraction: false
      });

      console.log('✅ Notificação de teste enviada');
      toast.success('✅ Teste enviado! Verifique se a notificação apareceu.');
    } catch (error) {
      console.error('❌ Erro ao testar:', error);
      toast.error('❌ Erro: ' + error.message);
    }
  };

  const getTargetCount = () => {
    if (formData.target_audience === 'all') return subscriptions.filter(s => s.is_active).length;
    if (formData.target_audience === 'premium') return subscriptions.filter(s => s.is_active && users.find(u => u.email === s.user_email)?.subscription_status === 'premium').length;
    if (formData.target_audience === 'free') return subscriptions.filter(s => s.is_active && users.find(u => u.email === s.user_email)?.subscription_status !== 'premium').length;
    return 0;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-gray-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRecurrenceLabel = (pattern) => {
    const labels = {
      daily: "Diariamente",
      every_2_days: "A cada 2 dias",
      every_3_days: "A cada 3 dias",
      weekly: "Semanalmente"
    };
    return labels[pattern] || pattern;
  };

  if (!user) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  const pendingNotifications = notifications.filter(n => n.status === 'pending' && n.schedule_type !== 'recurring');
  const recurringNotifications = notifications.filter(n => n.schedule_type === 'recurring');
  const sentNotifications = notifications.filter(n => n.status === 'sent');

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gerenciar Notificações Push</h1>
          <p className="text-slate-400">Envie notificações para seus usuários (funciona com app fechado no iOS)</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-900/30 rounded-lg border border-blue-700/50">
          <Users className="w-5 h-5 text-blue-400" />
          <span className="text-white font-semibold">{subscriptions.filter(s => s.is_active).length}</span>
          <span className="text-slate-400 text-sm">subscriptions ativas</span>
        </div>
      </div>

      {/* Info Alert */}
      <Card className="bg-blue-900/20 border-blue-700/50">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-blue-400 font-semibold mb-1">Push Notifications Real com VAPID</h4>
            <p className="text-slate-300 text-sm">
              <strong>Enviar Agora:</strong> Envia via servidor push para TODOS usuários, mesmo com app fechado (iOS/Android).<br/>
              <strong>Agendar/Recorrente:</strong> Em breve - por enquanto use "Enviar Agora" manualmente.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            Nova Notificação Push
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-slate-300">Título</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Ex: Hora do treino!"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-300">Mensagem</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                placeholder="Escreva sua mensagem aqui..."
                className="bg-slate-800 border-slate-700 text-white h-24"
              />
            </div>

            <div>
              <Label className="text-slate-300">Canal de Envio</Label>
              <Select value={formData.channel || 'push'} onValueChange={(value) => setFormData({...formData, channel: value})}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="push">Push Notification</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="both">Ambos (Push + WhatsApp)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Público Alvo</Label>
              <Select value={formData.target_audience} onValueChange={(value) => setFormData({...formData, target_audience: value})}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Usuários</SelectItem>
                  <SelectItem value="premium">Apenas Premium</SelectItem>
                  <SelectItem value="free">Apenas Free</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-slate-400 text-xs mt-1">
                {formData.channel === 'push' ? `${getTargetCount()} com push` : formData.channel === 'whatsapp' ? 'Usuários com WhatsApp ativo' : 'Ambos os canais'}
              </p>
            </div>

            <div>
              <Label className="text-slate-300">Validade da Notificação (opcional)</Label>
              <Input
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-slate-400 text-xs mt-1">
                Após esta data, a notificação não será mais exibida. Deixe vazio para não expirar.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestNotification}
                className="border-slate-700 text-slate-300"
              >
                <Bell className="w-4 h-4 mr-2" />
                Testar Comigo
              </Button>
              <Button
                type="submit"
                disabled={sendImmediateNotificationMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {sendImmediateNotificationMutation.isPending ? 'Enviando...' : 
                  formData.channel === 'push' ? 'Enviar Push' : 
                  formData.channel === 'whatsapp' ? 'Enviar WhatsApp' : 
                  'Enviar Ambos'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* History */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-400" />
            Histórico de Envios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sentNotifications.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Nenhuma notificação enviada ainda</p>
          ) : (
            sentNotifications.map((notif) => (
              <div key={notif.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-start gap-3">
                  {getStatusIcon(notif.status)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-white font-semibold">{notif.title}</h4>
                      <span className="text-slate-500 text-xs">
                        {new Date(notif.last_sent_date || notif.created_date).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-2">{notif.message}</p>
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded-full">
                        {notif.target_audience === 'all' ? 'Todos' : notif.target_audience === 'premium' ? 'Premium' : 'Free'}
                      </span>
                      <span className="text-slate-500">
                        por {notif.created_by}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}