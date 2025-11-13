
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageCircle, Search, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function AdminWhatsAppCoach() {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['all-users-whatsapp'],
    queryFn: () => base44.entities.User.list('-created_date'),
  });

  const toggleCoachMutation = useMutation({
    mutationFn: ({ userId, enabled }) => 
      base44.entities.User.update(userId, { whatsapp_coach_enabled: enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-users-whatsapp']);
    },
  });

  const toggleAllMutation = useMutation({
    mutationFn: async (enabled) => {
      const updates = users.map(user => 
        base44.entities.User.update(user.id, { whatsapp_coach_enabled: enabled })
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-users-whatsapp']);
    },
  });

  const filteredUsers = users.filter(user =>
    user.nome_completo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const enabledCount = users.filter(u => u.whatsapp_coach_enabled !== false).length;
  const disabledCount = users.length - enabledCount;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total de Usuários</p>
                <p className="text-3xl font-bold text-white">{users.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Coach Habilitado</p>
                <p className="text-3xl font-bold text-green-400">{enabledCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Coach Desabilitado</p>
                <p className="text-3xl font-bold text-red-400">{disabledCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Ações em Massa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-400 text-sm">
            Habilitar ou desabilitar o WhatsApp Coach para todos os usuários de uma vez
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => toggleAllMutation.mutate(true)}
              disabled={toggleAllMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {toggleAllMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Habilitar para Todos
            </Button>
            <Button
              onClick={() => toggleAllMutation.mutate(false)}
              disabled={toggleAllMutation.isPending}
              variant="destructive"
            >
              {toggleAllMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Desabilitar para Todos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Gerenciar Usuários</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {isLoading ? (
            <p className="text-slate-400 text-center py-8">Carregando usuários...</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-medium">{user.nome_completo || "Sem nome"}</p>
                      {user.subscription_status === 'premium' && (
                        <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">
                          Premium
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">{user.email}</p>
                    {user.whatsapp && (
                      <p className="text-slate-500 text-xs mt-1">📱 {user.whatsapp}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`coach-${user.id}`}
                        className={`text-sm ${
                          user.whatsapp_coach_enabled !== false
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {user.whatsapp_coach_enabled !== false ? "Habilitado" : "Desabilitado"}
                      </Label>
                      <Switch
                        id={`coach-${user.id}`}
                        checked={user.whatsapp_coach_enabled !== false}
                        onCheckedChange={(enabled) =>
                          toggleCoachMutation.mutate({ userId: user.id, enabled })
                        }
                        disabled={toggleCoachMutation.isPending}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <p className="text-slate-400 text-center py-8">
                  Nenhum usuário encontrado
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-900/20 border-blue-800/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <MessageCircle className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="text-blue-400 font-semibold text-sm mb-1">
                ℹ️ Como funciona o WhatsApp Coach
              </p>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• Quando habilitado, o usuário pode conectar seu WhatsApp ao FitCoach</li>
                <li>• O coach responde dúvidas e registra treinos 24/7</li>
                <li>• Quando desabilitado, o usuário não consegue usar o serviço</li>
                <li>• Útil para testes ou limitar acesso por motivos específicos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
