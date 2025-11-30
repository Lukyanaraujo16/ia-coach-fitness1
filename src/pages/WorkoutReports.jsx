import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  Trophy, 
  Dumbbell, 
  Calendar,
  Flame,
  Clock,
  Target,
  Award
} from "lucide-react";
import { format, subDays, subMonths, subYears, isAfter, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import VolumeChart from "../components/reports/VolumeChart";
import WeightProgressChart from "../components/reports/WeightProgressChart";
import BodyPartChart from "../components/reports/BodyPartChart";
import PersonalRecords from "../components/reports/PersonalRecords";
import PerformanceSummary from "../components/reports/PerformanceSummary";

export default function WorkoutReports() {
  const [user, setUser] = useState(null);
  const [period, setPeriod] = useState("month");
  const [selectedExercise, setSelectedExercise] = useState("all");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: workoutLogs = [], isLoading } = useQuery({
    queryKey: ['workout-logs-reports', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allLogs = await base44.entities.WorkoutLog.list('-date');
      return allLogs.filter(log => log.user_email === user.email || log.created_by === user.email);
    },
    enabled: !!user?.email,
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises-list'],
    queryFn: () => base44.entities.Exercise.list(),
  });

  // Filtrar logs por período
  const getFilteredLogs = () => {
    const now = new Date();
    let startDate;
    
    switch (period) {
      case "week":
        startDate = subDays(now, 7);
        break;
      case "month":
        startDate = subMonths(now, 1);
        break;
      case "3months":
        startDate = subMonths(now, 3);
        break;
      case "year":
        startDate = subYears(now, 1);
        break;
      default:
        startDate = subMonths(now, 1);
    }

    return workoutLogs.filter(log => {
      const logDate = parseISO(log.date);
      return isAfter(logDate, startDate);
    });
  };

  const filteredLogs = getFilteredLogs();

  // Extrair lista única de exercícios dos logs
  const uniqueExercises = [...new Set(
    workoutLogs.flatMap(log => 
      (log.exercises_completed || []).map(ex => ex.exercise_name)
    )
  )].filter(Boolean).sort();

  // Calcular estatísticas gerais
  const calculateStats = () => {
    const logs = filteredLogs;
    
    const totalWorkouts = logs.length;
    const totalDuration = logs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
    const totalCalories = logs.reduce((sum, log) => sum + (log.calories_burned || 0), 0);
    const totalExercises = logs.reduce((sum, log) => sum + (log.exercises_completed?.length || 0), 0);
    const totalSets = logs.reduce((sum, log) => 
      sum + (log.exercises_completed || []).reduce((s, ex) => s + (ex.sets_completed || 0), 0), 0
    );
    
    const avgDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;
    const avgDifficulty = totalWorkouts > 0 
      ? (logs.reduce((sum, log) => sum + (log.difficulty_rating || 0), 0) / logs.filter(l => l.difficulty_rating).length).toFixed(1)
      : 0;

    return {
      totalWorkouts,
      totalDuration,
      totalCalories,
      totalExercises,
      totalSets,
      avgDuration,
      avgDifficulty: isNaN(avgDifficulty) ? 0 : avgDifficulty
    };
  };

  const stats = calculateStats();

  if (!user) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-400" />
            Relatórios de Treino
          </h1>
          <p className="text-slate-400 text-sm mt-1">Acompanhe seu progresso detalhado</p>
        </div>
        
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-white">
              <Calendar className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">7 dias</SelectItem>
              <SelectItem value="month">30 dias</SelectItem>
              <SelectItem value="3months">3 meses</SelectItem>
              <SelectItem value="year">1 ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/30 rounded-xl flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Treinos</p>
                <p className="text-xl font-bold text-white">{stats.totalWorkouts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600/30 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Tempo Total</p>
                <p className="text-xl font-bold text-white">{Math.round(stats.totalDuration / 60)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 border-orange-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600/30 rounded-xl flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Calorias</p>
                <p className="text-xl font-bold text-white">{stats.totalCalories.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600/30 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Séries</p>
                <p className="text-xl font-bold text-white">{stats.totalSets}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <PerformanceSummary logs={filteredLogs} period={period} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume Chart */}
        <VolumeChart logs={filteredLogs} period={period} />
        
        {/* Body Part Distribution */}
        <BodyPartChart logs={filteredLogs} exercises={exercises} />
      </div>

      {/* Weight Progress */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Evolução de Carga
            </CardTitle>
            <Select value={selectedExercise} onValueChange={setSelectedExercise}>
              <SelectTrigger className="w-full sm:w-56 bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Selecione um exercício" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os exercícios</SelectItem>
                {uniqueExercises.map(exercise => (
                  <SelectItem key={exercise} value={exercise}>{exercise}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <WeightProgressChart 
            logs={workoutLogs} 
            selectedExercise={selectedExercise}
            period={period}
          />
        </CardContent>
      </Card>

      {/* Personal Records */}
      <PersonalRecords logs={workoutLogs} />
    </div>
  );
}