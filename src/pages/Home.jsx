import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar, Flame, Trophy, TrendingUp, ChevronRight, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatsCard from "../components/home/StatsCard";
import QuickActionCard from "../components/home/QuickActionCard";
import NextWorkoutCard from "../components/home/NextWorkoutCard";

export default function Home() {
  const [user, setUser] = useState(null);

  const { data: workoutLogs = [] } = useQuery({
    queryKey: ['workout-logs'],
    queryFn: () => base44.entities.WorkoutLog.list('-date'),
  });

  const { data: progressEntries = [] } = useQuery({
    queryKey: ['progress-entries'],
    queryFn: () => base44.entities.ProgressEntry.list('-date', 1),
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const thisWeekWorkouts = workoutLogs.filter(log => {
    const logDate = new Date(log.date);
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return logDate >= weekAgo;
  });

  const totalCalories = thisWeekWorkouts.reduce((sum, log) => sum + (log.calories_burned || 0), 0);
  const currentWeight = progressEntries[0]?.weight || user?.current_weight || 0;
  const weightGoal = user?.weight_goal || 0;

  return (
    <div className="py-6 space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white">
          Olá, {user?.full_name?.split(' ')[0] || 'Atleta'}! 👋
        </h2>
        <p className="text-slate-400">
          Pronto para superar seus limites hoje?
        </p>
      </div>

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
          value={currentWeight}
          suffix="kg"
          color="green"
        />
      </div>

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