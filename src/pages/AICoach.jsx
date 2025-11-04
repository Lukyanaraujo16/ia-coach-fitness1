import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, TrendingUp, MessageSquare, Zap, Target, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PerformanceAnalysis from "../components/ai-coach/PerformanceAnalysis";
import AIChat from "../components/ai-coach/AIChat";
import WorkoutGenerator from "../components/ai-coach/WorkoutGenerator";

export default function AICoach() {
  const [activeTab, setActiveTab] = useState("chat");
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoadingUser(true);
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setIsLoadingUser(false);
      }
    };
    loadUser();
  }, []);

  const { data: workoutLogs = [] } = useQuery({
    queryKey: ['workout-logs', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        const allLogs = await base44.entities.WorkoutLog.list('-date');
        return (allLogs || []).filter(log => log.created_by === user.email);
      } catch (error) {
        console.error("Error loading workout logs:", error);
        return [];
      }
    },
    enabled: !!user?.email && !isLoadingUser,
  });

  const { data: selectedWorkout } = useQuery({
    queryKey: ['selected-workout', user?.selected_workout_id],
    queryFn: async () => {
      if (!user?.selected_workout_id) return null;
      try {
        const workouts = await base44.entities.Workout.list();
        return (workouts || []).find(w => w.id === user.selected_workout_id);
      } catch (error) {
        console.error("Error loading workout:", error);
        return null;
      }
    },
    enabled: !!user?.selected_workout_id && !isLoadingUser,
  });

  const isPremium = user?.subscription_status === 'premium';

  if (isLoadingUser) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[400px]">
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="py-6">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-700/50">
            <CardContent className="p-12 text-center space-y-6">
              <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-10 h-10 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  Treinador de IA - Exclusivo Premium
                </h2>
                <p className="text-slate-300 mb-2">
                  Desbloqueie o poder da inteligência artificial para:
                </p>
                <ul className="text-left max-w-md mx-auto space-y-2 text-slate-300 mb-6">
                  <li className="flex items-start gap-2">
                    <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Análise inteligente do seu desempenho</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>Chat 24/7 com seu treinador virtual</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Target className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Planos personalizados gerados por IA</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <span>Sugestões em tempo real durante treinos</span>
                  </li>
                </ul>
              </div>
              <Link to={createPageUrl("Subscription")}>
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-8 py-6 text-lg">
                  <Crown className="w-5 h-5 mr-2" />
                  Assinar Premium Agora
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">Treinador IA</h2>
            <p className="text-slate-400">Seu assistente pessoal inteligente</p>
          </div>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-700/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Olá, {user?.full_name?.split(' ')[0]}! 👋
              </h3>
              <p className="text-slate-300 text-sm">
                Estou aqui para te ajudar a alcançar seus objetivos. Posso analisar seu desempenho, 
                criar treinos personalizados e responder suas dúvidas sobre fitness!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800 w-full grid grid-cols-3">
          <TabsTrigger value="chat" className="data-[state=active]:bg-purple-600">
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="analysis" className="data-[state=active]:bg-purple-600">
            <TrendingUp className="w-4 h-4 mr-2" />
            Análise
          </TabsTrigger>
          <TabsTrigger value="generator" className="data-[state=active]:bg-purple-600">
            <Zap className="w-4 h-4 mr-2" />
            Criar Treino
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === "chat" && <AIChat user={user} />}
      {activeTab === "analysis" && (
        <PerformanceAnalysis 
          user={user} 
          workoutLogs={workoutLogs}
          currentWorkout={selectedWorkout}
        />
      )}
      {activeTab === "generator" && <WorkoutGenerator user={user} />}
    </div>
  );
}