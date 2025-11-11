
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar, Flame, Trophy, TrendingUp, ChevronRight, Zap, Target, Crown, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatsCard from "../components/home/StatsCard";
import QuickActionCard from "../components/home/QuickActionCard";
import NextWorkoutCard from "../components/home/NextWorkoutCard";
import PWAInstallPrompt from "../components/home/PWAInstallPrompt"; // Added import

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [challengeInput, setChallengeInput] = useState("");
  const [showPWAPrompt, setShowPWAPrompt] = useState(false); // Added state

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Verificar fluxo de onboarding
        if (!currentUser.onboarding_completed) {
          navigate(createPageUrl("Onboarding"));
        } else if (!currentUser.nutrition_setup_completed) {
          navigate(createPageUrl("NutritionSetup"));
        } else if (!currentUser.workout_setup_completed) {
          navigate(createPageUrl("WorkoutSetup"));
        } else {
          // Verificar se deve mostrar o prompt PWA
          // Mostrar apenas se:
          // 1. Nunca foi mostrado antes (pwa_prompt_shown não existe ou é false)
          // 2. Passou pelo onboarding completo
          const hasSeenPrompt = localStorage.getItem('pwa_prompt_shown');
          if (!hasSeenPrompt && currentUser.workout_setup_completed) {
            setTimeout(() => {
              setShowPWAPrompt(true);
            }, 1000); // Pequeno delay para melhor UX
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

  // Added handler functions for PWA prompt
  const handleClosePWAPrompt = () => {
    setShowPWAPrompt(false);
    localStorage.setItem('pwa_prompt_shown', 'true');
  };

  const handlePWAInstalled = () => {
    setShowPWAPrompt(false);
    localStorage.setItem('pwa_prompt_shown', 'true');
  };

  const thisWeekWorkouts = workoutLogs.filter(log => {
    const logDate = new Date(log.date + 'T00:00:00'); // Adicionar hora para evitar problema de fuso
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zerar horas para comparação precisa
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return logDate >= weekAgo && logDate <= today;
  });

  const totalCalories = thisWeekWorkouts.reduce((sum, log) => sum + (log.calories_burned || 0), 0);
  const currentWeight = progressEntries[0]?.weight || user?.current_weight || 0;
  const weeklyGoal = user?.weekly_goal || 3;
  const progress = Math.min((thisWeekWorkouts.length / weeklyGoal) * 100, 100);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const challengePercentage = activeChallenge 
    ? Math.min(((userProgress?.current_progress || 0) / activeChallenge.target) * 100, 100)
    : 0;

  if (!user) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      {/* PWA Install Prompt */}
      {showPWAPrompt && (
        <PWAInstallPrompt 
          onClose={handleClosePWAPrompt}
          onInstalled={handlePWAInstalled}
        />
      )}

      {/* Welcome Section */}
      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-white">
          {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Atleta'}! 👋
        </h2>
        <p className="text-slate-400">
          Pronto para superar seus limites hoje?
        </p>
      </div>

      {/* Premium Banner */}
      {user?.subscription_status !== 'premium' && (
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

      {/* AI Coach Card - Premium Only */}
      {user?.subscription_status === 'premium' && (
        <Link to={createPageUrl("AICoach")}>
          <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-700/50 hover:from-purple-900/60 hover:to-blue-900/60 transition-all cursor-pointer">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Treinador IA</h3>
                  <p className="text-slate-300 text-sm">Análises e conselhos personalizados</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* WhatsApp Coach Card - Only if enabled */}
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

      {/* Stats Grid */}
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

      {/* Weekly Goal Progress */}
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

      {/* Challenge of the Week */}
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

      {/* Next Workout */}
      <NextWorkoutCard />

      {/* Quick Actions */}
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

      {/* Recent Activity */}
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
