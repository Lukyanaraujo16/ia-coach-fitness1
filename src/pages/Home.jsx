
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar, Flame, Trophy, TrendingUp, ChevronRight, Zap, Target, Crown, MessageCircle, Apple } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatsCard from "../components/home/StatsCard";
import QuickActionCard from "../components/home/QuickActionCard";
import NextWorkoutCard from "../components/home/NextWorkoutCard";
import PWAInstallPrompt from "../components/home/PWAInstallPrompt";

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [challengeInput, setChallengeInput] = useState("");
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (!currentUser.onboarding_completed) {
          navigate(createPageUrl("Onboarding"));
        } else if (!currentUser.nutrition_setup_completed) {
          navigate(createPageUrl("NutritionSetup"));
        } else if (!currentUser.workout_setup_completed) {
          navigate(createPageUrl("WorkoutSetup"));
        } else {
          const hasSeenPrompt = localStorage.getItem('pwa_prompt_shown');
          if (!hasSeenPrompt && currentUser.workout_setup_completed) {
            setTimeout(() => {
              setShowPWAPrompt(true);
            }, 1000);
          }
        }
      } catch (error) {
        base44.auth.redirectToLogin(createPageUrl("Home"));
      }
    };
    loadUser();
  }, [navigate]);

  const { data: workoutLogs = [] } = useQuery({
    queryKey: ['workout-logs', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allLogs = await base44.entities.WorkoutLog.list('-date');
      return allLogs.filter(log => log.created_by === user.email);
    },
    enabled: !!user?.email,
  });

  const { data: progressEntries = [] } = useQuery({
    queryKey: ['progress-entries', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allEntries = await base44.entities.ProgressEntry.list('-date', 1);
      return allEntries.filter(entry => entry.created_by === user.email);
    },
    enabled: !!user?.email,
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => base44.entities.Challenge.list('-created_date'),
  });

  const { data: challengeProgress = [] } = useQuery({
    queryKey: ['challenge-progress', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allProgress = await base44.entities.ChallengeProgress.list();
      return allProgress.filter(p => p.created_by === user.email);
    },
    enabled: !!user?.email,
  });

  const { data: mealLogs = [] } = useQuery({
    queryKey: ['meal-logs', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allLogs = await base44.entities.MealLog.list('-date');
      return allLogs.filter(log => log.created_by === user.email);
    },
    enabled: !!user?.email,
  });

  const activeChallenge = challenges.find(c => c.is_active);
  const userProgress = challengeProgress.find(p => p.challenge_id === activeChallenge?.id);

  const updateProgressMutation = useMutation({
    mutationFn: (data) => {
      if (userProgress) {
        return base44.entities.ChallengeProgress.update(userProgress.id, data);
      }
      return base44.entities.ChallengeProgress.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['challenge-progress']);
      setChallengeInput("");
    },
  });

  const handleAddProgress = () => {
    if (!challengeInput || !activeChallenge) return;
    
    const toAdd = parseInt(challengeInput);
    if (isNaN(toAdd) || toAdd <= 0) return;

    const newProgress = (userProgress?.current_progress || 0) + toAdd;
    
    updateProgressMutation.mutate({
      challenge_id: activeChallenge.id,
      current_progress: newProgress,
      completed: newProgress >= activeChallenge.target,
    });
  };

  const handleClosePWAPrompt = () => {
    setShowPWAPrompt(false);
    localStorage.setItem('pwa_prompt_shown', 'true');
  };

  const handlePWAInstalled = () => {
    setShowPWAPrompt(false);
    localStorage.setItem('pwa_prompt_shown', 'true');
  };

  const thisWeekWorkouts = workoutLogs.filter(log => {
    const logDate = new Date(log.date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return logDate >= weekAgo && logDate <= today;
  });

  const totalCalories = thisWeekWorkouts.reduce((sum, log) => sum + (log.calories_burned || 0), 0);
  const currentWeight = progressEntries[0]?.weight || user?.current_weight || 0;
  const weeklyGoal = user?.weekly_goal || 3;
  const progress = Math.min((thisWeekWorkouts.length / weeklyGoal) * 100, 100);

  // Calcular calorias e macros do dia atual
  const getLocalDateString = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDate = getLocalDateString();
  const todayMeals = mealLogs.filter(log => log.date === todayDate && log.analysis_complete);
  const todayCalories = todayMeals.reduce((sum, log) => sum + (log.total_calories || 0), 0);
  const todayProtein = todayMeals.reduce((sum, log) => sum + (log.macros?.protein || 0), 0);
  const todayCarbs = todayMeals.reduce((sum, log) => sum + (log.macros?.carbs || 0), 0);
  const todayFat = todayMeals.reduce((sum, log) => sum + (log.macros?.fat || 0), 0);
  
  const calorieGoal = user?.daily_calorie_goal || 2000;
  const caloriePercentage = Math.min((todayCalories / calorieGoal) * 100, 100);

  // Calcular metas de macros em gramas
  const proteinPercentage = user?.macro_protein_percentage || 30;
  const carbsPercentage = user?.macro_carbs_percentage || 40;
  const fatPercentage = user?.macro_fat_percentage || 30;

  const proteinGoal = Math.round((calorieGoal * (proteinPercentage / 100)) / 4); // 4 cal por grama
  const carbsGoal = Math.round((calorieGoal * (carbsPercentage / 100)) / 4); // 4 cal por grama
  const fatGoal = Math.round((calorieGoal * (fatPercentage / 100)) / 9); // 9 cal por grama

  const proteinPercentageComplete = Math.min((todayProtein / proteinGoal) * 100, 100);
  const carbsPercentageComplete = Math.min((todayCarbs / carbsGoal) * 100, 100);
  const fatPercentageComplete = Math.min((todayFat / fatGoal) * 100, 100);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const challengePercentage = activeChallenge 
    ? Math.min(((userProgress?.current_progress || 0) / activeChallenge.target) * 100, 100)
    : 0;

  const isPremium = user?.subscription_status === 'premium' || user?.subscription_status === 'trial';

  if (!user) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      {showPWAPrompt && (
        <PWAInstallPrompt 
          onClose={handleClosePWAPrompt}
          onInstalled={handlePWAInstalled}
        />
      )}

      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-white">
          {getGreeting()}, {user?.nome_completo?.split(' ')[0] || 'Atleta'}! 👋
        </h2>
        <p className="text-slate-400">
          Pronto para superar seus limites hoje?
        </p>
      </div>

      {!isPremium && (
        <Link to={createPageUrl("Subscription")}>
          <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-700/50 hover:from-blue-900/60 hover:to-purple-900/60 transition-all cursor-pointer">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <Crown className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Assine Premium</h3>
                  <p className="text-slate-300 text-sm">Desbloqueie treinos exclusivos</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </CardContent>
          </Card>
        </Link>
      )}

      {user?.whatsapp_coach_enabled !== false && (
        <a 
          href={base44.agents.getWhatsAppConnectURL('fitness_coach')} 
          target="_blank"
          rel="noopener noreferrer"
        >
          <Card className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-700/50 hover:from-green-900/60 hover:to-emerald-900/60 transition-all cursor-pointer">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    Coach no WhatsApp
                    <span className="px-2 py-0.5 bg-green-600/20 text-green-400 text-xs rounded-full">Novo</span>
                  </h3>
                  <p className="text-slate-300 text-sm">Tire dúvidas e registre treinos 24/7</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </CardContent>
          </Card>
        </a>
      )}

      {/* Nutrition Summary Card */}
      <Link to={createPageUrl("Nutrition")}>
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 border-green-700/50 hover:from-green-900/40 hover:to-emerald-900/30 transition-all cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Apple className="w-5 h-5 text-green-400" />
                Nutrição de Hoje
              </CardTitle>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Calorias */}
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <span className="text-4xl font-bold text-green-400">{Math.round(todayCalories)}</span>
                  <span className="text-slate-400 text-sm ml-2">/ {calorieGoal} kcal</span>
                </div>
                <span className="text-slate-400 text-sm">{Math.round(caloriePercentage)}%</span>
              </div>
              <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-600 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${caloriePercentage}%` }}
                />
              </div>
            </div>

            {/* Macronutrientes com metas */}
            <div className="grid grid-cols-3 gap-3">
              {/* Proteína */}
              <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                <p className="text-blue-400 font-bold text-lg">{Math.round(todayProtein)}g</p>
                <p className="text-slate-500 text-xs mb-1">/ {proteinGoal}g</p>
                <p className="text-slate-400 text-xs">Proteína</p>
                <div className="relative h-1 bg-slate-800 rounded-full overflow-hidden mt-2">
                  <div
                    className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${proteinPercentageComplete}%` }}
                  />
                </div>
              </div>

              {/* Carboidratos */}
              <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                <p className="text-orange-400 font-bold text-lg">{Math.round(todayCarbs)}g</p>
                <p className="text-slate-500 text-xs mb-1">/ {carbsGoal}g</p>
                <p className="text-slate-400 text-xs">Carbos</p>
                <div className="relative h-1 bg-slate-800 rounded-full overflow-hidden mt-2">
                  <div
                    className="absolute inset-y-0 left-0 bg-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${carbsPercentageComplete}%` }}
                  />
                </div>
              </div>

              {/* Gordura */}
              <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                <p className="text-yellow-400 font-bold text-lg">{Math.round(todayFat)}g</p>
                <p className="text-slate-500 text-xs mb-1">/ {fatGoal}g</p>
                <p className="text-slate-400 text-xs">Gordura</p>
                <div className="relative h-1 bg-slate-800 rounded-full overflow-hidden mt-2">
                  <div
                    className="absolute inset-y-0 left-0 bg-yellow-500 rounded-full transition-all duration-500"
                    style={{ width: `${fatPercentageComplete}%` }}
                  />
                </div>
              </div>
            </div>

            {todayMeals.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-2">
                📸 Registre suas refeições para acompanhar
              </p>
            )}
          </CardContent>
        </Card>
      </Link>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          icon={Calendar}
          label="Esta Semana"
          value={thisWeekWorkouts.length}
          suffix="treinos"
          color="blue"
        />
        <StatsCard
          icon={Flame}
          label="Calorias"
          value={totalCalories}
          suffix="kcal"
          color="orange"
        />
        <StatsCard
          icon={Trophy}
          label="Sequência"
          value={thisWeekWorkouts.length >= 3 ? "3+" : thisWeekWorkouts.length}
          suffix="dias"
          color="yellow"
        />
        <StatsCard
          icon={TrendingUp}
          label="Peso Atual"
          value={currentWeight || "-"}
          suffix={currentWeight ? "kg" : ""}
          color="green"
        />
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-semibold">Meta Semanal</h3>
            </div>
            <span className="text-blue-400 font-bold">
              {thisWeekWorkouts.length}/{weeklyGoal}
            </span>
          </div>
          <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-slate-400 text-sm mt-2">
            {progress === 100 ? "🎉 Meta completa!" : `${(weeklyGoal - thisWeekWorkouts.length)} treinos restantes`}
          </p>
        </CardContent>
      </Card>

      {activeChallenge && (
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Desafio da Semana
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-xl font-bold text-white mb-2">
                {activeChallenge.title}
              </h4>
              <p className="text-slate-300 text-sm">
                {activeChallenge.description}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500" 
                  style={{ width: `${challengePercentage}%` }}
                />
              </div>
              <span className="text-slate-300 text-sm font-medium">
                {userProgress?.current_progress || 0}/{activeChallenge.target}
              </span>
            </div>

            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={`Quantas ${activeChallenge.unit}?`}
                value={challengeInput}
                onChange={(e) => setChallengeInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddProgress()}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <Button
                onClick={handleAddProgress}
                disabled={updateProgressMutation.isPending || !challengeInput}
                className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap px-6"
              >
                Registrar
              </Button>
            </div>

            {userProgress?.completed && (
              <p className="text-green-400 text-sm font-semibold">
                🎉 Desafio Completo! Parabéns!
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <NextWorkoutCard />

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Ações Rápidas</h3>
        <div className="grid grid-cols-2 gap-3">
          <QuickActionCard
            icon={Zap}
            title="Iniciar Treino"
            subtitle="Comece agora"
            link={createPageUrl("Workouts")}
            color="blue"
          />
          <QuickActionCard
            icon={TrendingUp}
            title="Registrar Progresso"
            subtitle="Peso e medidas"
            link={createPageUrl("Progress")}
            color="purple"
          />
        </div>
      </div>

      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white text-lg">Atividade Recente</CardTitle>
          <Link to={createPageUrl("Progress")}>
            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
              Ver Tudo
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {workoutLogs.slice(0, 3).map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{log.workout_title}</p>
                  <p className="text-sm text-slate-400">
                    {new Date(log.date).toLocaleDateString('pt-BR')} • {log.duration_minutes}min
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-blue-400 font-semibold">{log.calories_burned || 0}</p>
                <p className="text-xs text-slate-500">kcal</p>
              </div>
            </div>
          ))}
          {workoutLogs.length === 0 && (
            <p className="text-center text-slate-500 py-8">
              Nenhum treino registrado ainda. Que tal começar hoje?
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
