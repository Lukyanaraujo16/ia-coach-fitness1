import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Crown, User, Trash2, Edit2, X, Save, Power, PowerOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminUsers({ users = [] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const queryClient = useQueryClient();

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => base44.entities.User.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-users']);
      setEditingUser(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => base44.entities.User.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-users']);
    },
  });

  const handleTogglePremium = (user) => {
    const newStatus = user.subscription_status === 'premium' ? 'free' : 'premium';
    updateUserMutation.mutate({
      userId: user.id,
      data: { subscription_status: newStatus },
    });
  };

  const handleToggleCommunity = (value) => {
    // Atualizar para TODOS os usuários
    users.forEach(user => {
      updateUserMutation.mutate({
        userId: user.id,
        data: { community_enabled: value },
      });
    });
  };

  const handleDeleteUser = (userId) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user.id);
    setEditForm({
      full_name: user.full_name || '',
      whatsapp: user.whatsapp || '',
      email: user.email || '',
      current_weight: user.current_weight || '',
      height: user.height || '',
      weight_goal: user.weight_goal || '',
      weekly_goal: user.weekly_goal || 3,
      gender: user.gender || 'male',
      fitness_goal: user.fitness_goal || 'maintain',
      fitness_level: user.fitness_level || 'beginner',
    });
  };

  const handleSaveEdit = () => {
    if (!editingUser) return;
    
    updateUserMutation.mutate({
      userId: editingUser,
      data: {
        full_name: editForm.full_name,
        whatsapp: editForm.whatsapp,
        current_weight: parseFloat(editForm.current_weight) || undefined,
        height: parseFloat(editForm.height) || undefined,
        weight_goal: parseFloat(editForm.weight_goal) || undefined,
        weekly_goal: parseInt(editForm.weekly_goal) || 3,
        gender: editForm.gender,
        fitness_goal: editForm.fitness_goal,
        fitness_level: editForm.fitness_level,
      },
    });
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const communityEnabled = users.length > 0 ? users[0]?.community_enabled !== false : true;

  return (
    <div className="space-y-4">
      {/* Community Toggle */}
      <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/20 border-purple-700/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold mb-1">Comunidade Global</h3>
              <p className="text-slate-400 text-sm">Habilitar ou desabilitar para todos os usuários</p>
            </div>
            <Button
              onClick={() => handleToggleCommunity(!communityEnabled)}
              className={communityEnabled ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {communityEnabled ? (
                <>
                  <Power className="w-4 h-4 mr-2" />
                  Ativada
                </>
              ) : (
                <>
                  <PowerOff className="w-4 h-4 mr-2" />
                  Desativada
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Usuários Cadastrados</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar usuário..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">Usuário</TableHead>
                  <TableHead className="text-slate-400">Email</TableHead>
                  <TableHead className="text-slate-400">WhatsApp</TableHead>
                  <TableHead className="text-slate-400">Plano</TableHead>
                  <TableHead className="text-slate-400">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-slate-800">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            {user.full_name?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <span className="text-white font-medium">{user.full_name || 'Usuário'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">{user.email}</TableCell>
                    <TableCell className="text-slate-300">{user.whatsapp || '-'}</TableCell>
                    <TableCell>
                      {user.subscription_status === 'premium' ? (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400 border-slate-700">
                          Gratuito
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditUser(user)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-slate-300 hover:bg-slate-800"
                            >
                              •••
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleTogglePremium(user)}>
                              <Crown className="w-4 h-4 mr-2" />
                              {user.subscription_status === 'premium' ? 'Remover Premium' : 'Tornar Premium'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-400"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir Usuário
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Editar Usuário</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingUser(null)}
                  className="text-slate-400"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Nome Completo</Label>
                  <Input
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">WhatsApp</Label>
                  <Input
                    value={editForm.whatsapp}
                    onChange={(e) => setEditForm({...editForm, whatsapp: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Peso Atual (kg)</Label>
                  <Input
                    type="number"
                    value={editForm.current_weight}
                    onChange={(e) => setEditForm({...editForm, current_weight: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Altura (cm)</Label>
                  <Input
                    type="number"
                    value={editForm.height}
                    onChange={(e) => setEditForm({...editForm, height: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Meta de Peso (kg)</Label>
                  <Input
                    type="number"
                    value={editForm.weight_goal}
                    onChange={(e) => setEditForm({...editForm, weight_goal: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Treinos/Semana</Label>
                  <Input
                    type="number"
                    value={editForm.weekly_goal}
                    onChange={(e) => setEditForm({...editForm, weekly_goal: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Gênero</Label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                  >
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                    <option value="other">Outro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Objetivo</Label>
                  <select
                    value={editForm.fitness_goal}
                    onChange={(e) => setEditForm({...editForm, fitness_goal: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                  >
                    <option value="lose_weight">Emagrecer</option>
                    <option value="gain_muscle">Ganhar Massa</option>
                    <option value="maintain">Manter Forma</option>
                  </select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-slate-300">Nível</Label>
                  <select
                    value={editForm.fitness_level}
                    onChange={(e) => setEditForm({...editForm, fitness_level: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                  >
                    <option value="beginner">Iniciante</option>
                    <option value="intermediate">Intermediário</option>
                    <option value="advanced">Avançado</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 border-slate-700 text-slate-300"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={updateUserMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {updateUserMutation.isPending ? (
                    "Salvando..."
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-slate-400 text-sm">Usuários Ativos</p>
                <p className="text-2xl font-bold text-white">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-slate-400 text-sm">Assinantes Premium</p>
                <p className="text-2xl font-bold text-white">
                  {users.filter(u => u.subscription_status === 'premium').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-slate-400" />
              <div>
                <p className="text-slate-400 text-sm">Usuários Free</p>
                <p className="text-2xl font-bold text-white">
                  {users.filter(u => u.subscription_status !== 'premium').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}