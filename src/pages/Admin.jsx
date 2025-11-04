import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Users, DollarSign, Dumbbell, Crown } from "lucide-react";
import AdminUsers from "../components/admin/AdminUsers";
import AdminWorkouts from "../components/admin/AdminWorkouts";
import AdminExercises from "../components/admin/AdminExercises";
import AdminChallenges from "../components/admin/AdminChallenges";
import AdminMetrics from "../components/admin/AdminMetrics";
import AdminCommunity from "../components/admin/AdminCommunity";
import AdminNutrition from "../components/admin/AdminNutrition";

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("metrics");
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        
        if (!isMounted) return;
        
        if (currentUser.role !== 'admin') {
          console.log("User is not admin, redirecting to Home");
          navigate(createPageUrl("Home"));
          return;
        }
        
        setUser(currentUser);
        setAuthError(false);
      } catch (error) {
        if (!isMounted) return;
        
        // Ignorar erros de abort
        if (error.message?.includes('abort') || error.name === 'AbortError') {
          console.log("Request aborted, component unmounting");
          return;
        }
        
        console.error("Error loading user:", error);
        setAuthError(true);
        
        // Apenas redirecionar se for erro real de autenticação
        if (error.message?.includes('auth') || error.message?.includes('401')) {
          navigate(createPageUrl("Home"));
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };
    
    loadUser();
    
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Só faz queries se o usuário for admin confirmado
  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user && user.role === 'admin' && !isCheckingAuth,
    retry: 1,
  });

  const { data: workouts = [] } = useQuery({
    queryKey: ['all-workouts'],
    queryFn: () => base44.entities.Workout.list(),
    enabled: !!user && user.role === 'admin' && !isCheckingAuth,
    retry: 1,
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ['all-exercises'],
    queryFn: () => base44.entities.Exercise.list(),
    enabled: !!user && user.role === 'admin' && !isCheckingAuth,
    retry: 1,
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['all-challenges'],
    queryFn: () => base44.entities.Challenge.list(),
    enabled: !!user && user.role === 'admin' && !isCheckingAuth,
    retry: 1,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['all-posts'],
    queryFn: () => base44.entities.CommunityPost.list('-created_date'),
    enabled: !!user && user.role === 'admin' && !isCheckingAuth,
    retry: 1,
  });

  const { data: nutritionPlans = [] } = useQuery({
    queryKey: ['all-nutrition-plans'],
    queryFn: () => base44.entities.NutritionPlan.list(),
    enabled: !!user && user.role === 'admin' && !isCheckingAuth,
    retry: 1,
  });

  // Mostrar loading ou erro
  if (isCheckingAuth) {
    return (
      <div className="py-6">
        <p className="text-slate-400 text-center">Verificando permissões...</p>
      </div>
    );
  }

  if (authError && !user) {
    return (
      <div className="py-6">
        <Card className="bg-slate-900/50 border-slate-800 max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-red-400 mb-4">Erro ao carregar dados do usuário</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Tentar Novamente
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-6">
        <p className="text-slate-400 text-center">Carregando...</p>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="py-6">
        <p className="text-slate-400 text-center">Acesso negado</p>
      </div>
    );
  }

  const premiumUsers = users.filter(u => u.subscription_status === 'premium');
  const monthlyRevenue = premiumUsers.length * 29.90;

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Painel Admin</h2>
          <p className="text-slate-400 mt-1">Gerencie usuários e conteúdo</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-600/30 rounded-full">
          <Crown className="w-4 h-4 text-blue-400" />
          <span className="text-blue-400 font-medium text-sm">Administrador</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Total Usuários</p>
                <p className="text-2xl font-bold text-white">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-600/20 rounded-xl flex items-center justify-center">
                <Crown className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Premium</p>
                <p className="text-2xl font-bold text-white">{premiumUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Receita/Mês</p>
                <p className="text-2xl font-bold text-white">R$ {monthlyRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Treinos</p>
                <p className="text-2xl font-bold text-white">{workouts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800 w-full grid grid-cols-3 md:grid-cols-7 gap-2">
          <TabsTrigger value="metrics" className="data-[state=active]:bg-blue-600">
            Métricas
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-blue-600">
            Usuários
          </TabsTrigger>
          <TabsTrigger value="workouts" className="data-[state=active]:bg-blue-600">
            Treinos
          </TabsTrigger>
          <TabsTrigger value="exercises" className="data-[state=active]:bg-blue-600">
            Exercícios
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="data-[state=active]:bg-blue-600">
            Nutrição
          </TabsTrigger>
          <TabsTrigger value="challenges" className="data-[state=active]:bg-blue-600">
            Desafios
          </TabsTrigger>
          <TabsTrigger value="community" className="data-[state=active]:bg-blue-600">
            Comunidade
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      {activeTab === "metrics" && <AdminMetrics users={users} workouts={workouts} />}
      {activeTab === "users" && <AdminUsers users={users} />}
      {activeTab === "workouts" && <AdminWorkouts workouts={workouts} exercises={exercises} />}
      {activeTab === "exercises" && <AdminExercises exercises={exercises} />}
      {activeTab === "nutrition" && <AdminNutrition plans={nutritionPlans} />}
      {activeTab === "challenges" && <AdminChallenges challenges={challenges} />}
      {activeTab === "community" && <AdminCommunity posts={posts} />}
    </div>
  );
}