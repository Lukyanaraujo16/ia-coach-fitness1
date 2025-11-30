import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Award, Zap, Calendar, Activity } from "lucide-react";
import { format, parseISO, differenceInDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PerformanceSummary({ logs, period }) {
  const getPeriodLabel = () => {
    switch (period) {
      case "week": return "últimos 7 dias";
      case "month": return "últimos 30 dias";
      case "3months": return "últimos 3 meses";
      case "year": return "último ano";
      default: return "período selecionado";
    }
  };

  // Calcular métricas
  const calculateMetrics = () => {
    if (logs.length === 0) {
      return {
        avgWorkoutsPerWeek: 0,
        consistency: 0,
        avgDuration: 0,
        totalVolume: 0,
        trend: "neutral",
        streak: 0
      };
    }

    // Média de treinos por semana
    const dates = logs.map(l => l.date).sort();
    const firstDate = parseISO(dates[0]);
    const lastDate = parseISO(dates[dates.length - 1]);
    const weeks = Math.max(1, differenceInDays(lastDate, firstDate) / 7);
    const avgWorkoutsPerWeek = (logs.length / weeks).toFixed(1);

    // Consistência (dias únicos treinados / dias no período)
    const uniqueDays = new Set(logs.map(l => l.date)).size;
    let totalDays;
    switch (period) {
      case "week": totalDays = 7; break;
      case "month": totalDays = 30; break;
      case "3months": totalDays = 90; break;
      case "year": totalDays = 365; break;
      default: totalDays = 30;
    }
    const consistency = Math.round((uniqueDays / totalDays) * 100);

    // Duração média
    const avgDuration = logs.length > 0 
      ? Math.round(logs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) / logs.length)
      : 0;

    // Volume total (séries x reps x peso)
    const totalVolume = logs.reduce((sum, log) => 
      sum + (log.exercises_completed || []).reduce((s, ex) => {
        const weights = ex.weight || [];
        const reps = ex.reps || [];
        return s + weights.reduce((w, weight, idx) => w + (weight * (reps[idx] || 0)), 0);
      }, 0), 0);

    // Tendência (comparar primeira metade com segunda metade do período)
    const midPoint = Math.floor(logs.length / 2);
    const firstHalf = logs.slice(0, midPoint);
    const secondHalf = logs.slice(midPoint);
    
    const firstHalfAvg = firstHalf.length > 0 
      ? firstHalf.reduce((sum, l) => sum + (l.exercises_completed?.length || 0), 0) / firstHalf.length
      : 0;
    const secondHalfAvg = secondHalf.length > 0 
      ? secondHalf.reduce((sum, l) => sum + (l.exercises_completed?.length || 0), 0) / secondHalf.length
      : 0;
    
    let trend = "neutral";
    if (secondHalfAvg > firstHalfAvg * 1.1) trend = "up";
    else if (secondHalfAvg < firstHalfAvg * 0.9) trend = "down";

    // Calcular streak atual
    const sortedDates = [...new Set(logs.map(l => l.date))].sort().reverse();
    let streak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    
    if (sortedDates[0] === today || sortedDates[0] === yesterday) {
      for (let i = 0; i < sortedDates.length; i++) {
        const expectedDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
        const prevExpectedDate = format(subDays(new Date(), i + 1), 'yyyy-MM-dd');
        
        if (sortedDates.includes(expectedDate) || sortedDates.includes(prevExpectedDate)) {
          streak++;
        } else {
          break;
        }
      }
    }

    return {
      avgWorkoutsPerWeek,
      consistency,
      avgDuration,
      totalVolume,
      trend,
      streak
    };
  };

  const metrics = calculateMetrics();

  const TrendIcon = metrics.trend === "up" ? TrendingUp : metrics.trend === "down" ? TrendingDown : Minus;
  const trendColor = metrics.trend === "up" ? "text-green-400" : metrics.trend === "down" ? "text-red-400" : "text-slate-400";
  const trendLabel = metrics.trend === "up" ? "Em alta" : metrics.trend === "down" ? "Em queda" : "Estável";

  return (
    <Card className="bg-gradient-to-r from-slate-900/80 to-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          Resumo de Desempenho
          <span className="text-slate-400 text-sm font-normal ml-2">({getPeriodLabel()})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Treinos/Semana */}
          <div className="text-center p-3 bg-slate-800/50 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{metrics.avgWorkoutsPerWeek}</p>
            <p className="text-slate-400 text-xs">treinos/semana</p>
          </div>

          {/* Consistência */}
          <div className="text-center p-3 bg-slate-800/50 rounded-lg">
            <Award className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{metrics.consistency}%</p>
            <p className="text-slate-400 text-xs">consistência</p>
          </div>

          {/* Duração Média */}
          <div className="text-center p-3 bg-slate-800/50 rounded-lg">
            <Zap className="w-5 h-5 text-orange-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{metrics.avgDuration}</p>
            <p className="text-slate-400 text-xs">min/treino</p>
          </div>

          {/* Volume Total */}
          <div className="text-center p-3 bg-slate-800/50 rounded-lg">
            <Activity className="w-5 h-5 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {metrics.totalVolume > 1000 
                ? `${(metrics.totalVolume / 1000).toFixed(1)}k` 
                : metrics.totalVolume.toLocaleString()}
            </p>
            <p className="text-slate-400 text-xs">kg volume</p>
          </div>

          {/* Streak */}
          <div className="text-center p-3 bg-slate-800/50 rounded-lg">
            <span className="text-2xl mb-1 block">🔥</span>
            <p className="text-2xl font-bold text-white">{metrics.streak}</p>
            <p className="text-slate-400 text-xs">dias seguidos</p>
          </div>

          {/* Tendência */}
          <div className="text-center p-3 bg-slate-800/50 rounded-lg">
            <TrendIcon className={`w-5 h-5 ${trendColor} mx-auto mb-2`} />
            <p className={`text-lg font-bold ${trendColor}`}>{trendLabel}</p>
            <p className="text-slate-400 text-xs">tendência</p>
          </div>
        </div>

        {logs.length === 0 && (
          <div className="mt-4 text-center py-4 bg-slate-800/30 rounded-lg">
            <p className="text-slate-400">
              Nenhum treino registrado neste período. Complete treinos para ver seu desempenho!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}