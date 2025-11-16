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
import { Bell, Send, Clock, Users, Calendar, CheckCircle, XCircle, AlertCircle, Repeat } from "lucide-react";
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
    recurrence_time: "09:00"
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.NotificationSchedule.list('-created_date'),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
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

  const sendNotificationMutation = useMutation({
    mutationFn: async (data) => {
      // Criar registro da notificação
      const notification = await base44.entities.NotificationSchedule.create({
        ...data,
        status: data.schedule_type === 'immediate' ? 'sent' : 'pending',
        sent_count: data.schedule_type === 'immediate' ? 1 : 0,
        last_sent_date: data.schedule_type === 'immediate' ? new Date().toISOString() : null
      });

      // Se for envio imediato, enviar emails
      if (data.schedule_type === 'immediate') {
        const targetUsers = users.filter(u => {
          if (data.target_audience === 'all') return true;
          if (data.target_audience === 'premium') return u.subscription_status === 'premium';
          if (data.target_audience === 'free') return u.subscription_status !== 'premium';
          return false;
        });

        // Enviar emails para todos os usuários alvo
        const emailPromises = targetUsers.map(targetUser => 
          base44.integrations.Core.SendEmail({
            to: targetUser.email,
            subject: `🔔 ${data.title}`,
            body: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1E40AF;">${data.title}</h2>
                <p style="color: #334155; font-size: 16px; line-height: 1.6;">${data.message}</p>
                <br>
                <p style="color: #64748B; font-size: 14px;">Enviado via IA Coach Fitness</p>
              </div>
            `,
            from_name: "IA Coach Fitness"
          })
        );

        await Promise.all(emailPromises);
      }

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
        recurrence_time: "09:00"
      });
      toast.success('Notificação enviada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao enviar notificação:', error);
      toast.error('Erro ao enviar notificação');
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
      toast.error('Preencha título e mensagem');
      return;
    }
    sendNotificationMutation.mutate(formData);
  };

  const handleTestNotification = async () => {
    if (!formData.title || !formData.message) {
      toast.error('Preencha título e mensagem para testar');
      return;
    }

    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `🧪 TESTE: ${formData.title}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #FEF3C7; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
              <p style="color: #92400E; margin: 0;">⚠️ Esta é uma notificação de TESTE</p>
            </div>
            <h2 style="color: #1E40AF;">${formData.title}</h2>
            <p style="color: #334155; font-size: 16px; line-height: 1.6;">${formData.message}</p>
          </div>
        `,
        from_name: "IA Coach Fitness"
      });
      toast.success('Teste enviado para seu email!');
    } catch (error) {
      toast.error('Erro ao enviar teste');
    }
  };

  const getTargetCount = () => {
    if (formData.target_audience === 'all') return users.length;
    if (formData.target_audience === 'premium') return users.filter(u => u.subscription_status === 'premium').length;
    if (formData.target_audience === 'free') return users.filter(u => u.subscription_status !== 'premium').length;
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
          <h1 className="text-3xl font-bold text-white">Gerenciar Notificações</h1>
          <p className="text-slate-400">Envie notificações push para seus usuários</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-900/30 rounded-lg border border-blue-700/50">
          <Users className="w-5 h-5 text-blue-400" />
          <span className="text-white font-semibold">{users.length}</span>
          <span className="text-slate-400 text-sm">usuários</span>
        </div>
      </div>

      {/* Form */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            Nova Notificação
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

            <div className="grid md:grid-cols-2 gap-4">
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
                  {getTargetCount()} usuários receberão
                </p>
              </div>

              <div>
                <Label className="text-slate-300">Tipo de Envio</Label>
                <Select value={formData.schedule_type} onValueChange={(value) => setFormData({...formData, schedule_type: value})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Enviar Agora</SelectItem>
                    <SelectItem value="scheduled">Agendar Envio</SelectItem>
                    <SelectItem value="recurring">Envio Recorrente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.schedule_type === 'scheduled' && (
              <div>
                <Label className="text-slate-300">Data e Hora</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            )}

            {formData.schedule_type === 'recurring' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Frequência</Label>
                  <Select value={formData.recurrence_pattern} onValueChange={(value) => setFormData({...formData, recurrence_pattern: value})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diariamente</SelectItem>
                      <SelectItem value="every_2_days">A cada 2 dias</SelectItem>
                      <SelectItem value="every_3_days">A cada 3 dias</SelectItem>
                      <SelectItem value="weekly">Semanalmente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Horário</Label>
                  <Input
                    type="time"
                    value={formData.recurrence_time}
                    onChange={(e) => setFormData({...formData, recurrence_time: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestNotification}
                className="border-slate-700 text-slate-300"
              >
                Testar Comigo
              </Button>
              <Button
                type="submit"
                disabled={sendNotificationMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {formData.schedule_type === 'immediate' ? 'Enviar Agora' : 'Agendar Notificação'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Recurring Notifications */}
      {recurringNotifications.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Repeat className="w-5 h-5 text-purple-400" />
              Notificações Recorrentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recurringNotifications.map((notif) => (
              <div key={notif.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-white font-semibold">{notif.title}</h4>
                    <p className="text-slate-400 text-sm mb-2">{notif.message}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-purple-900/30 text-purple-400 rounded-full">
                        {getRecurrenceLabel(notif.recurrence_pattern)}
                      </span>
                      <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded-full">
                        {notif.recurrence_time}
                      </span>
                      <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded-full">
                        {notif.sent_count || 0} envios
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={notif.is_active ? "default" : "outline"}
                      onClick={() => toggleRecurrenceMutation.mutate({ id: notif.id, isActive: !notif.is_active })}
                      className={notif.is_active ? "bg-green-600" : ""}
                    >
                      {notif.is_active ? 'Ativa' : 'Pausada'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteNotificationMutation.mutate(notif.id)}
                      className="border-red-700 text-red-400"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pending Notifications */}
      {pendingNotifications.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-yellow-400" />
              Notificações Agendadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingNotifications.map((notif) => (
              <div key={notif.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-white font-semibold">{notif.title}</h4>
                  <p className="text-slate-400 text-sm">{notif.message}</p>
                  <p className="text-slate-500 text-xs mt-1">
                    {new Date(notif.scheduled_date).toLocaleString('pt-BR')}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteNotificationMutation.mutate(notif.id)}
                  className="border-red-700 text-red-400"
                >
                  Cancelar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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