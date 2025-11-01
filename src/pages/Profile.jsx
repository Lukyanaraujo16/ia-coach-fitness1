import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, LogOut, User, Settings, Edit2, Save, X, Dumbbell, Trash2, AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ProfileStats from "../components/profile/ProfileStats";
import ProfileInfo from "../components/profile/ProfileInfo";

export default function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: selectedWorkout } = useQuery({
    queryKey: ['selected-workout', user?.selected_workout_id],
    queryFn: async () => {
      if (!user?.selected_workout_id) return null;
      const workouts = await base44.entities.Workout.list();
      return workouts.find(w => w.id === user.selected_workout_id);
    },
    enabled: !!user?.selected_workout_id,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['user-posts'],
    queryFn: async () => {
      if (!user) return [];
      const allPosts = await base44.entities.CommunityPost.list();
      return allPosts.filter(p => p.created_by === user.email);
    },
    enabled: !!user,
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setNewName(currentUser.full_name || "");
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const updateNameMutation = useMutation({
    mutationFn: async (name) => {
      await base44.auth.updateMe({ full_name: name });
      // Recarregar os dados do usuário após atualizar
      const updatedUser = await base44.auth.me();
      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      setNewName(updatedUser.full_name || "");
      setIsEditingName(false);
      queryClient.invalidateQueries(['user']);
    },
    onError: (error) => {
      console.error("Erro ao atualizar nome:", error);
      alert("Erro ao atualizar nome. Tente novamente.");
    }
  });

  const changeWorkoutMutation = useMutation({
    mutationFn: () => base44.auth.updateMe({
      selected_workout_id: null,
      current_workout_day: 1,
      completed_workout_days: [],
    }),
    onSuccess: () => {
      navigate(createPageUrl("WorkoutSelection"));
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      for (const post of posts) {
        await base44.entities.CommunityPost.update(post.id, { is_active: false });
      }
      await base44.auth.updateMe({ is_active: false });
      await base44.auth.logout();
    },
    onSuccess: () => {
      navigate(createPageUrl("Home"));
    },
  });

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const handleSaveName = () => {
    const trimmedName = newName.trim();
    if (trimmedName && trimmedName !== user?.full_name) {
      updateNameMutation.mutate(trimmedName);
    } else {
      setIsEditingName(false);
    }
  };

  const handleChangeWorkout = () => {
    if (confirm('Tem certeza que deseja trocar de treino? Seu progresso atual será reiniciado.')) {
      changeWorkoutMutation.mutate();
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = () => {
    deleteAccountMutation.mutate();
  };

  const isPremium = user?.subscription_status === 'premium';

  return (
    <div className="py-6 space-y-6">
      {/* Profile Header */}
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-800 backdrop-blur-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <CardContent className="p-6 relative">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2 mb-3">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Seu nome"
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                  <Button
                    size="icon"
                    onClick={handleSaveName}
                    disabled={updateNameMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      setIsEditingName(false);
                      setNewName(user?.full_name || "");
                    }}
                    className="border-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-white">
                    {user?.full_name || 'Carregando...'}
                  </h2>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsEditingName(true)}
                    className="text-slate-400 hover:text-white h-8 w-8"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <p className="text-slate-400 mb-3">{user?.email}</p>
              <div className="flex flex-wrap gap-2">
                {isPremium ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 text-sm font-medium">Premium</span>
                  </div>
                ) : (
                  <Link to={createPageUrl("Subscription")}>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade Premium
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Workout */}
      {selectedWorkout && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Treino Atual</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={handleChangeWorkout}
              disabled={changeWorkoutMutation.isPending}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Dumbbell className="w-4 h-4 mr-2" />
              Trocar Treino
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-600/20 rounded-xl flex items-center justify-center">
                <Dumbbell className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h4 className="text-white font-semibold mb-1">{selectedWorkout.title}</h4>
                <p className="text-slate-400 text-sm">{selectedWorkout.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <ProfileStats user={user} />

      {/* Profile Info */}
      <ProfileInfo user={user} setUser={setUser} />

      {/* Actions */}
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start border-slate-800 text-slate-300 hover:bg-slate-800"
        >
          <Settings className="w-5 h-5 mr-3" />
          Configurações
        </Button>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full justify-start border-slate-800 text-slate-300 hover:bg-slate-800"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair da Conta
        </Button>
        <Button
          variant="outline"
          onClick={handleDeleteAccount}
          className="w-full justify-start border-red-900/50 text-red-400 hover:bg-red-950/50"
        >
          <Trash2 className="w-5 h-5 mr-3" />
          Cancelar Conta
        </Button>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-slate-800 max-w-md w-full">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Cancelar Conta?
                </h3>
                <p className="text-slate-400 text-sm">
                  Esta ação irá desativar sua conta e todos os seus posts na comunidade.
                  Você terá que criar uma nova conta para voltar a usar o app.
                </p>
                {posts.length > 0 && (
                  <p className="text-orange-400 text-sm mt-2">
                    ⚠️ Você tem {posts.length} post(s) que serão desativados
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 border-slate-700 text-slate-300"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmDeleteAccount}
                  disabled={deleteAccountMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {deleteAccountMutation.isPending ? "Cancelando..." : "Confirmar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}