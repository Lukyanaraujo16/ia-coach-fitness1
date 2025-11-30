import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageCircle, 
  Send, 
  HelpCircle, 
  Lightbulb, 
  Bug, 
  CheckCircle2,
  ArrowLeft,
  X,
  Clock,
  User
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const subjectLabels = {
  support: { label: "Suporte", icon: HelpCircle, color: "bg-blue-600" },
  suggestion: { label: "Sugestão", icon: Lightbulb, color: "bg-yellow-600" },
  bug: { label: "Bug/Erro", icon: Bug, color: "bg-red-600" }
};

const statusLabels = {
  open: { label: "Aberto", color: "bg-orange-600" },
  answered: { label: "Respondido", color: "bg-green-600" },
  waiting_user: { label: "Aguardando Usuário", color: "bg-purple-600" },
  closed: { label: "Fechado", color: "bg-slate-600" }
};

export default function AdminSupport() {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newMessage, setNewMessage] = useState("");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['admin-support-tickets'],
    queryFn: () => base44.entities.SupportTicket.list('-last_interaction_at'),
  });

  // Auto-fechar tickets inativos há mais de 5 dias
  const autoCloseTicketsMutation = useMutation({
    mutationFn: async (ticketsToClose) => {
      for (const ticket of ticketsToClose) {
        await base44.entities.SupportTicket.update(ticket.id, {
          status: 'closed',
          closed_at: new Date().toISOString()
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['admin-support-tickets']),
  });

  // Verificar tickets para auto-fechar
  React.useEffect(() => {
    const ticketsToClose = tickets.filter(t => {
      if (t.status === 'closed' || t.subject === 'suggestion') return false;
      const lastInteraction = new Date(t.last_interaction_at || t.created_date);
      return differenceInDays(new Date(), lastInteraction) >= 5;
    });
    
    if (ticketsToClose.length > 0) {
      autoCloseTicketsMutation.mutate(ticketsToClose);
    }
  }, [tickets]);

  const markAsReadMutation = useMutation({
    mutationFn: (ticketId) => base44.entities.SupportTicket.update(ticketId, { has_unread_admin: false }),
    onSuccess: () => queryClient.invalidateQueries(['admin-support-tickets']),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ ticketId, message }) => {
      const ticket = tickets.find(t => t.id === ticketId);
      const now = new Date().toISOString();
      const newMessages = [
        ...(ticket.messages || []),
        {
          sender_email: "admin",
          sender_name: "Suporte IA Coach",
          message,
          sent_at: now,
          is_admin: true
        }
      ];
      return base44.entities.SupportTicket.update(ticketId, {
        messages: newMessages,
        status: 'waiting_user',
        last_interaction_at: now,
        has_unread_admin: false,
        has_unread_user: true
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries(['admin-support-tickets']);
      // Atualizar o ticket selecionado
      const updatedTickets = await base44.entities.SupportTicket.list('-last_interaction_at');
      const updatedTicket = updatedTickets.find(t => t.id === selectedTicket?.id);
      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
      }
      setNewMessage("");
      toast.success("Resposta enviada!");
    },
  });

  const closeTicketMutation = useMutation({
    mutationFn: (ticketId) => base44.entities.SupportTicket.update(ticketId, {
      status: 'closed',
      closed_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-support-tickets']);
      setSelectedTicket(null);
      toast.success("Chamado fechado!");
    },
  });

  // Separar tickets por categoria
  const supportTickets = tickets.filter(t => t.subject === 'support' && t.status !== 'closed');
  const bugTickets = tickets.filter(t => t.subject === 'bug' && t.status !== 'closed');
  const suggestions = tickets.filter(t => t.subject === 'suggestion');
  const closedTickets = tickets.filter(t => t.status === 'closed' && t.subject !== 'suggestion');

  const unreadCount = tickets.filter(t => t.has_unread_admin && t.status !== 'closed').length;

  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    if (ticket.has_unread_admin) {
      markAsReadMutation.mutate(ticket.id);
    }
  };

  const renderTicketList = (ticketList, emptyMessage) => {
    if (ticketList.length === 0) {
      return (
        <div className="text-center py-8 text-slate-400">
          <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>{emptyMessage}</p>
        </div>
      );
    }

    return ticketList.map((ticket) => {
      const SubjectIcon = subjectLabels[ticket.subject]?.icon || HelpCircle;
      return (
        <Card
          key={ticket.id}
          onClick={() => handleSelectTicket(ticket)}
          className={`bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 cursor-pointer transition-all ${
            ticket.has_unread_admin ? 'border-l-4 border-l-blue-500' : ''
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${subjectLabels[ticket.subject]?.color} flex items-center justify-center flex-shrink-0`}>
                <SubjectIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-medium truncate">{ticket.title}</h3>
                  {ticket.has_unread_admin && (
                    <Badge className="bg-blue-600 text-white text-xs">Novo</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <User className="w-3 h-3" />
                  <span className="truncate">{ticket.user_name || ticket.user_email}</span>
                  <span>•</span>
                  <Clock className="w-3 h-3" />
                  <span>{format(new Date(ticket.last_interaction_at || ticket.created_date), "dd/MM HH:mm")}</span>
                </div>
              </div>
              <Badge className={`${statusLabels[ticket.status]?.color} text-white flex-shrink-0`}>
                {statusLabels[ticket.status]?.label}
              </Badge>
            </div>
          </CardContent>
        </Card>
      );
    });
  };

  // Tela de detalhes do ticket
  if (selectedTicket) {
    const SubjectIcon = subjectLabels[selectedTicket.subject]?.icon || HelpCircle;
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setSelectedTicket(null)}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-lg ${subjectLabels[selectedTicket.subject]?.color} flex items-center justify-center`}>
                  <SubjectIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-lg">{selectedTicket.title}</CardTitle>
                  <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                    <User className="w-4 h-4" />
                    <span>{selectedTicket.user_name}</span>
                    <span>({selectedTicket.user_email})</span>
                  </div>
                  <p className="text-slate-500 text-xs mt-1">
                    Aberto em {format(new Date(selectedTicket.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${statusLabels[selectedTicket.status]?.color} text-white`}>
                  {statusLabels[selectedTicket.status]?.label}
                </Badge>
                {selectedTicket.status !== 'closed' && selectedTicket.subject !== 'suggestion' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => closeTicketMutation.mutate(selectedTicket.id)}
                    className="border-red-600 text-red-400 hover:bg-red-900/20"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Fechar
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Mensagens */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {selectedTicket.messages?.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${
                    msg.is_admin
                      ? "bg-blue-900/30 border border-blue-700/50 ml-4"
                      : "bg-slate-700/50 border border-slate-600 mr-4"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${msg.is_admin ? "text-blue-400" : "text-slate-300"}`}>
                      {msg.is_admin ? "🛠️ Você (Suporte)" : `👤 ${msg.sender_name}`}
                    </span>
                    <span className="text-slate-500 text-xs">
                      {format(new Date(msg.sent_at), "dd/MM HH:mm")}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))}
            </div>

            {/* Campo de resposta */}
            {selectedTicket.status !== 'closed' && selectedTicket.subject !== 'suggestion' && (
              <div className="flex gap-2 pt-4 border-t border-slate-700">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua resposta..."
                  className="bg-slate-900 border-slate-600 text-white flex-1 min-h-[80px]"
                />
                <Button
                  onClick={() => sendMessageMutation.mutate({ ticketId: selectedTicket.id, message: newMessage })}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 self-end"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}

            {selectedTicket.subject === 'suggestion' && (
              <div className="text-center py-4 text-yellow-400 text-sm bg-yellow-900/20 rounded-lg">
                💡 Esta é uma sugestão. Não requer resposta.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-blue-400" />
            Central de Suporte
          </h2>
          {unreadCount > 0 && (
            <p className="text-blue-400 text-sm mt-1">
              🔔 {unreadCount} chamado(s) aguardando resposta
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-900/20 border-blue-700/50">
          <CardContent className="p-4 text-center">
            <HelpCircle className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{supportTickets.length}</p>
            <p className="text-slate-400 text-xs">Suporte Aberto</p>
          </CardContent>
        </Card>
        <Card className="bg-red-900/20 border-red-700/50">
          <CardContent className="p-4 text-center">
            <Bug className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{bugTickets.length}</p>
            <p className="text-slate-400 text-xs">Bugs Abertos</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-900/20 border-yellow-700/50">
          <CardContent className="p-4 text-center">
            <Lightbulb className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{suggestions.length}</p>
            <p className="text-slate-400 text-xs">Sugestões</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{closedTickets.length}</p>
            <p className="text-slate-400 text-xs">Fechados</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="support" className="w-full">
        <TabsList className="bg-slate-800/50 border border-slate-700 flex-wrap h-auto">
          <TabsTrigger value="support" className="data-[state=active]:bg-blue-600">
            <HelpCircle className="w-4 h-4 mr-1" />
            Suporte ({supportTickets.length})
          </TabsTrigger>
          <TabsTrigger value="bugs" className="data-[state=active]:bg-red-600">
            <Bug className="w-4 h-4 mr-1" />
            Bugs ({bugTickets.length})
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="data-[state=active]:bg-yellow-600">
            <Lightbulb className="w-4 h-4 mr-1" />
            Sugestões ({suggestions.length})
          </TabsTrigger>
          <TabsTrigger value="closed" className="data-[state=active]:bg-slate-600">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Fechados ({closedTickets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="support" className="mt-4 space-y-3">
          {renderTicketList(supportTickets, "Nenhum chamado de suporte aberto")}
        </TabsContent>

        <TabsContent value="bugs" className="mt-4 space-y-3">
          {renderTicketList(bugTickets, "Nenhum bug reportado")}
        </TabsContent>

        <TabsContent value="suggestions" className="mt-4 space-y-3">
          {renderTicketList(suggestions, "Nenhuma sugestão recebida")}
        </TabsContent>

        <TabsContent value="closed" className="mt-4 space-y-3">
          {renderTicketList(closedTickets, "Nenhum chamado fechado")}
        </TabsContent>
      </Tabs>
    </div>
  );
}