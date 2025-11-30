import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageCircle, 
  Plus, 
  Send, 
  HelpCircle, 
  Lightbulb, 
  Bug, 
  Clock, 
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  X
} from "lucide-react";
import { format } from "date-fns";
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
  waiting_user: { label: "Aguardando você", color: "bg-purple-600" },
  closed: { label: "Fechado", color: "bg-slate-600" }
};

export default function Support() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [newTicket, setNewTicket] = useState({
    subject: "support",
    title: "",
    description: ""
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['support-tickets', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allTickets = await base44.entities.SupportTicket.list('-last_interaction_at');
      return allTickets.filter(t => t.user_email === user.email);
    },
    enabled: !!user?.email,
  });

  // Marcar como lido quando usuário visualizar ticket com resposta
  const markAsReadMutation = useMutation({
    mutationFn: (ticketId) => base44.entities.SupportTicket.update(ticketId, { has_unread_user: false }),
    onSuccess: () => queryClient.invalidateQueries(['support-tickets']),
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data) => {
      const now = new Date().toISOString();
      return base44.entities.SupportTicket.create({
        ...data,
        user_email: user.email,
        user_name: user.nome_completo || user.full_name,
        status: data.subject === 'suggestion' ? 'closed' : 'open',
        messages: [{
          sender_email: user.email,
          sender_name: user.nome_completo || user.full_name,
          message: data.description,
          sent_at: now,
          is_admin: false
        }],
        last_interaction_at: now,
        has_unread_admin: true,
        has_unread_user: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['support-tickets']);
      setShowNewTicket(false);
      setNewTicket({ subject: "support", title: "", description: "" });
      toast.success("Chamado criado com sucesso!");
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ ticketId, message }) => {
      const ticket = tickets.find(t => t.id === ticketId);
      const now = new Date().toISOString();
      const newMessages = [
        ...(ticket.messages || []),
        {
          sender_email: user.email,
          sender_name: user.nome_completo || user.full_name,
          message,
          sent_at: now,
          is_admin: false
        }
      ];
      return base44.entities.SupportTicket.update(ticketId, {
        messages: newMessages,
        status: 'open',
        last_interaction_at: now,
        has_unread_admin: true,
        has_unread_user: false
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries(['support-tickets']);
      // Atualizar o ticket selecionado
      const updatedTickets = await base44.entities.SupportTicket.filter({ user_email: user.email });
      const updatedTicket = updatedTickets.find(t => t.id === selectedTicket?.id);
      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
      }
      setNewMessage("");
      toast.success("Mensagem enviada!");
    },
  });

  const openTickets = tickets.filter(t => t.status !== 'closed' && t.subject !== 'suggestion');
  const closedTickets = tickets.filter(t => t.status === 'closed' || t.subject === 'suggestion');

  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    if (ticket.has_unread_user) {
      markAsReadMutation.mutate(ticket.id);
    }
  };

  if (!user) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  // Tela de detalhes do ticket
  if (selectedTicket) {
    const SubjectIcon = subjectLabels[selectedTicket.subject]?.icon || HelpCircle;
    return (
      <div className="py-6 space-y-4">
        <Button
          variant="ghost"
          onClick={() => setSelectedTicket(null)}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="border-b border-slate-800">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg ${subjectLabels[selectedTicket.subject]?.color} flex items-center justify-center`}>
                  <SubjectIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-lg">{selectedTicket.title}</CardTitle>
                  <p className="text-slate-400 text-sm mt-1">
                    Aberto em {format(new Date(selectedTicket.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <Badge className={`${statusLabels[selectedTicket.status]?.color} text-white`}>
                {statusLabels[selectedTicket.status]?.label}
              </Badge>
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
                      : "bg-slate-800/50 border border-slate-700 mr-4"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${msg.is_admin ? "text-blue-400" : "text-slate-300"}`}>
                      {msg.is_admin ? "🛠️ Suporte" : "Você"}
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
              <div className="flex gap-2 pt-4 border-t border-slate-800">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="bg-slate-800 border-slate-700 text-white flex-1 min-h-[80px]"
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

            {selectedTicket.status === 'closed' && (
              <div className="text-center py-4 text-slate-400 text-sm">
                Este chamado foi encerrado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formulário de novo ticket
  if (showNewTicket) {
    return (
      <div className="py-6 space-y-4">
        <Button
          variant="ghost"
          onClick={() => setShowNewTicket(false)}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Novo Chamado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-300 mb-2 block">Tipo de Chamado</Label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(subjectLabels).map(([key, { label, icon: Icon, color }]) => (
                  <button
                    key={key}
                    onClick={() => setNewTicket({ ...newTicket, subject: key })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      newTicket.subject === key
                        ? `${color} border-transparent`
                        : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    <Icon className="w-5 h-5 text-white mx-auto mb-1" />
                    <p className="text-white text-xs">{label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Título</Label>
              <Input
                value={newTicket.title}
                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                placeholder="Resumo do seu chamado"
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-slate-300">Descrição</Label>
              <Textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                placeholder="Descreva detalhadamente..."
                className="bg-slate-800 border-slate-700 text-white mt-1 min-h-[120px]"
              />
            </div>

            {newTicket.subject === 'suggestion' && (
              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3">
                <p className="text-yellow-400 text-sm">
                  💡 Sugestões são enviadas para análise da equipe. Você não receberá resposta direta, mas agradecemos seu feedback!
                </p>
              </div>
            )}

            <Button
              onClick={() => createTicketMutation.mutate(newTicket)}
              disabled={!newTicket.title.trim() || !newTicket.description.trim() || createTicketMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {createTicketMutation.isPending ? "Enviando..." : "Enviar Chamado"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Lista de tickets
  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Suporte</h1>
          <p className="text-slate-400 text-sm">Tire suas dúvidas ou reporte problemas</p>
        </div>
        <Button
          onClick={() => setShowNewTicket(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Chamado
        </Button>
      </div>

      <Tabs defaultValue="open" className="w-full">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="open" className="data-[state=active]:bg-blue-600">
            Abertos ({openTickets.length})
          </TabsTrigger>
          <TabsTrigger value="closed" className="data-[state=active]:bg-blue-600">
            Histórico ({closedTickets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-4 space-y-3">
          {openTickets.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Nenhum chamado aberto</p>
                <Button
                  onClick={() => setShowNewTicket(true)}
                  variant="link"
                  className="text-blue-400 mt-2"
                >
                  Abrir novo chamado
                </Button>
              </CardContent>
            </Card>
          ) : (
            openTickets.map((ticket) => {
              const SubjectIcon = subjectLabels[ticket.subject]?.icon || HelpCircle;
              return (
                <Card
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket)}
                  className="bg-slate-900/50 border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${subjectLabels[ticket.subject]?.color} flex items-center justify-center flex-shrink-0`}>
                        <SubjectIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-medium truncate">{ticket.title}</h3>
                          {ticket.has_unread_user && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-slate-400 text-sm">
                          {format(new Date(ticket.last_interaction_at || ticket.created_date), "dd/MM/yyyy HH:mm")}
                        </p>
                      </div>
                      <Badge className={`${statusLabels[ticket.status]?.color} text-white flex-shrink-0`}>
                        {statusLabels[ticket.status]?.label}
                      </Badge>
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="closed" className="mt-4 space-y-3">
          {closedTickets.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Nenhum chamado no histórico</p>
              </CardContent>
            </Card>
          ) : (
            closedTickets.map((ticket) => {
              const SubjectIcon = subjectLabels[ticket.subject]?.icon || HelpCircle;
              return (
                <Card
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket)}
                  className="bg-slate-900/50 border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-all opacity-70"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${subjectLabels[ticket.subject]?.color} flex items-center justify-center flex-shrink-0`}>
                        <SubjectIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">{ticket.title}</h3>
                        <p className="text-slate-400 text-sm">
                          {format(new Date(ticket.created_date), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <Badge className="bg-slate-600 text-white flex-shrink-0">
                        {ticket.subject === 'suggestion' ? 'Sugestão' : 'Fechado'}
                      </Badge>
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}