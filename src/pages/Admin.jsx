import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, Dumbbell, Crown, MessageSquare, MessageCircle, BarChart, Target, Activity, Apple, Settings, Bell } from "lucide-react";
import AdminUsers from "../components/admin/AdminUsers";
import AdminWorkouts from "../components/admin/AdminWorkouts";
import AdminExercises from "../components/admin/AdminExercises";
import AdminChallenges from "../components/admin/AdminChallenges";
import AdminMetrics from "../components/admin/AdminMetrics";
import AdminCommunity from "../components/admin/AdminCommunity";
import AdminNutrition from "../components/admin/AdminNutrition";
import AdminWhatsAppCoach from "../components/admin/AdminWhatsAppCoach";
import AdminSettings from "../components/admin/AdminSettings";

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("metrics");
  const [user, setUser] = useState(null);

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: workouts = [] } = useQuery({
    queryKey: ['all-workouts'],
    queryFn: () => base44.entities.Workout.list(),
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ['all-exercises'],
    queryFn: () => base44.entities.Exercise.list(),
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['all-challenges'],
    queryFn: () => base44.entities.Challenge.list(),
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['all-posts'],
    queryFn: () => base44.entities.CommunityPost.list('-created_date'),
  });

  const { data: nutritionPlans = [] } = useQuery({
    queryKey: ['all-nutrition-plans'],
    queryFn: () => base44.entities.NutritionPlan.list(),
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (currentUser.role !== 'admin') {
          navigate(createPageUrl("Home"));
        }
      } catch (error) {
        console.error("Error loading user:", error);
        navigate(createPageUrl("Home"));
      }
    };
    loadUser();
  }, [navigate]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="py-6">
        <p className="text-slate-400 text-center">Verificando permissões...</p>
      </div>
    );
  }

  const premiumUsers = users.filter(u => u.subscription_status === 'premium');
  const monthlyRevenue = premiumUsers.length * 29.90;

  const tabs = [
    { value: "metrics", label: "Métricas", icon: BarChart },
    { value: "users", label: "Usuários", icon: Users },
    { value: "workouts", label: "Treinos", icon: Dumbbell },
    { value: "exercises", label: "Exercícios", icon: Activity },
    { value: "nutrition", label: "Nutrição", icon: Apple },
    { value: "challenges", label: "Desafios", icon: Target },
    { value: "community", label: "Comunidade", icon: MessageSquare },
    { value: "whatsapp", label: "WhatsApp Coach", icon: MessageCircle },
    { value: "settings", label: "Configurações", icon: Settings },
  ];

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Painel Admin</h2>
          <p className="text-slate-400 mt-1">Gerencie usuários e conteúdo</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("AdminNotifications")}>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Bell className="w-4 h-4 mr-2" />
              Notificações
            </Button>
          </Link>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-600/30 rounded-full">
            <Crown className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 font-medium text-sm">Administrador</span>
          </div>
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
      <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-900/50 border border-slate-800 inline-flex w-auto min-w-full md:grid md:grid-cols-9 gap-1 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-blue-600 flex items-center gap-2 whitespace-nowrap px-3"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === "metrics" && <AdminMetrics users={users} workouts={workouts} />}
        {activeTab === "users" && <AdminUsers users={users} />}
        {activeTab === "workouts" && <AdminWorkouts workouts={workouts} exercises={exercises} />}
        {activeTab === "exercises" && <AdminExercises exercises={exercises} />}
        {activeTab === "nutrition" && <AdminNutrition plans={nutritionPlans} />}
        {activeTab === "challenges" && <AdminChallenges challenges={challenges} />}
        {activeTab === "community" && <AdminCommunity posts={posts} />}
        {activeTab === "whatsapp" && <AdminWhatsAppCoach />}
        {activeTab === "settings" && <AdminSettings user={user} />}
      </div>
    </div>
  );
}