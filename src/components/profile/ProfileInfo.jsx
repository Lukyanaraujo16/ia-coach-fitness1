import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit2, Save, X } from "lucide-react";

export default function ProfileInfo({ user, setUser }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    current_weight: '',
    weight_goal: '',
    height: '',
    gender: 'male',
    fitness_level: 'beginner',
    bio: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        current_weight: user.current_weight || '',
        weight_goal: user.weight_goal || '',
        height: user.height || '',
        gender: user.gender || 'male',
        fitness_level: user.fitness_level || 'beginner',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      // Atualizar usando o entity User diretamente
      await base44.entities.User.update(user.id, data);
      // Recarregar usuário
      const updatedUser = await base44.auth.me();
      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      setIsEditing(false);
      queryClient.invalidateQueries(['user']);
      queryClient.invalidateQueries(['all-users']);
    },
    onError: (error) => {
      console.error("Erro ao atualizar perfil:", error);
      alert("Erro ao atualizar perfil. Tente novamente.");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      full_name: formData.full_name.trim(),
      current_weight: formData.current_weight ? parseFloat(formData.current_weight) : undefined,
      weight_goal: formData.weight_goal ? parseFloat(formData.weight_goal) : undefined,
      height: formData.height ? parseFloat(formData.height) : undefined,
      gender: formData.gender,
      fitness_level: formData.fitness_level,
      bio: formData.bio.trim(),
    });
  };

  const genderLabels = {
    male: "Masculino",
    female: "Feminino",
    other: "Outro"
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Informações</CardTitle>
        {!isEditing ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsEditing(false);
              setFormData({
                full_name: user.full_name || '',
                current_weight: user.current_weight || '',
                weight_goal: user.weight_goal || '',
                height: user.height || '',
                gender: user.gender || 'male',
                fitness_level: user.fitness_level || 'beginner',
                bio: user.bio || '',
              });
            }}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Nome Completo</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Digite seu nome"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Peso Atual (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.current_weight}
                  onChange={(e) => setFormData({ ...formData, current_weight: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Meta (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.weight_goal}
                  onChange={(e) => setFormData({ ...formData, weight_goal: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Altura (cm)</Label>
              <Input
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Gênero</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Nível de Condicionamento</Label>
              <Select
                value={formData.fitness_level}
                onValueChange={(value) => setFormData({ ...formData, fitness_level: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Iniciante</SelectItem>
                  <SelectItem value="intermediate">Intermediário</SelectItem>
                  <SelectItem value="advanced">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Bio</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Conte um pouco sobre você..."
              />
            </div>
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </form>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Nome:</span>
              <span className="text-white font-medium">{user?.full_name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Peso Atual:</span>
              <span className="text-white font-medium">{user?.current_weight || '-'} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Meta:</span>
              <span className="text-white font-medium">{user?.weight_goal || '-'} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Altura:</span>
              <span className="text-white font-medium">{user?.height || '-'} cm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Gênero:</span>
              <span className="text-white font-medium">{user?.gender ? genderLabels[user.gender] : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Nível:</span>
              <span className="text-white font-medium capitalize">{user?.fitness_level || '-'}</span>
            </div>
            {user?.bio && (
              <div>
                <span className="text-slate-400 block mb-1">Bio:</span>
                <p className="text-white">{user.bio}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}