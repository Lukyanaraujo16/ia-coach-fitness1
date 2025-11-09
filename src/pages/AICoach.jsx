import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, Lightbulb, Dumbbell, Crown } from "lucide-react";
import WeeklyInsights from "../components/ai-coach/WeeklyInsights";
import PersonalizedAdvice from "../components/ai-coach/PersonalizedAdvice";
import ExerciseAlternatives from "../components/ai-coach/ExerciseAlternatives";
import MotivationalSummary from "../components/ai-coach/MotivationalSummary";

export default function AICoach() {
  const [activeTab, setActiveTab] = useState("insights");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin(createPageUrl("AICoach"));
      }
    };
    loadUser();
  }, []);

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
      const allEntries = await base44.entities.ProgressEntry.list('-date');
      return allEntries.filter(entry => entry.created_by === user.email);
    },
    enabled: !!user?.email,
  });

  if (!user) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  const isPremium = user?.subscription_status === 'premium';

  if (!isPremium) {
    return (
      <div className="py-6 space-y-6">
        <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-700/50">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-10 h-10 text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Treinador IA Premium
            </h2>
            <p className="text-slate-300 mb-6 max-w-md mx-auto">
              Obtenha análises personalizadas, conselhos adaptados ao seu progresso e recomendações inteligentes de exercícios.
            </p>
            <a href="/page/Subscription" className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-semibold">
              Assinar Premium
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white">Treinador IA</h2>
          <p className="text-slate-400">Análises e recomendações personalizadas</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <TrendingUp className="w-8 h-8 text-blue-400 mb-2" />
            <p className="text-slate-400 text-xs">Treinos Analisados</p>
            <p className="text-2xl font-bold text-white">{workoutLogs.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <Dumbbell className="w-8 h-8 text-green-400 mb-2" />
            <p className="text-slate-400 text-xs">Exercícios Únicos</p>
            <p className="text-2xl font-bold text-white">
              {new Set(workoutLogs.flatMap(log => 
                log.exercises_completed?.map(ex => ex.exercise_name) || []
              )).size}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <Lightbulb className="w-8 h-8 text-yellow-400 mb-2" />
            <p className="text-slate-400 text-xs">Insights Gerados</p>
            <p className="text-2xl font-bold text-white">
              {Math.min(workoutLogs.length * 3, 99)}+
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <Sparkles className="w-8 h-8 text-purple-400 mb-2" />
            <p className="text-slate-400 text-xs">Status</p>
            <p className="text-sm font-bold text-purple-400">Premium Ativo</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800 w-full grid grid-cols-4">
          <TabsTrigger value="insights" className="data-[state=active]:bg-blue-600">
            Insights
          </TabsTrigger>
          <TabsTrigger value="advice" className="data-[state=active]:bg-blue-600">
            Conselhos
          </TabsTrigger>
          <TabsTrigger value="alternatives" className="data-[state=active]:bg-blue-600">
            Exercícios
          </TabsTrigger>
          <TabsTrigger value="summary" className="data-[state=active]:bg-blue-600">
            Resumo
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === "insights" && (
        <WeeklyInsights 
          workoutLogs={workoutLogs} 
          progressEntries={progressEntries}
          user={user}
        />
      )}
      {activeTab === "advice" && (
        <PersonalizedAdvice 
          workoutLogs={workoutLogs}
          progressEntries={progressEntries}
          user={user}
        />
      )}
      {activeTab === "alternatives" && (
        <ExerciseAlternatives 
          workoutLogs={workoutLogs}
          user={user}
        />
      )}
      {activeTab === "summary" && (
        <MotivationalSummary 
          workoutLogs={workoutLogs}
          progressEntries={progressEntries}
          user={user}
        />
      )}
    </div>
  );
}