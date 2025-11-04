import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Weight, Calendar } from "lucide-react";

export default function ExerciseWeightProgress({ logs = [] }) {
  const [selectedExercise, setSelectedExercise] = useState("");

  // Extrair todos os exercícios únicos dos logs
  const availableExercises = useMemo(() => {
    const exerciseSet = new Set();
    logs.forEach(log => {
      if (log.exercises_completed && Array.isArray(log.exercises_completed)) {
        log.exercises_completed.forEach(exercise => {
          if (exercise.exercise_name && exercise.max_weight) {
            exerciseSet.add(exercise.exercise_name);
          }
        });
      }
    });
    return Array.from(exerciseSet).sort();
  }, [logs]);

  // Selecionar primeiro exercício automaticamente
  React.useEffect(() => {
    if (!selectedExercise && availableExercises.length > 0) {
      setSelectedExercise(availableExercises[0]);
    }
  }, [availableExercises, selectedExercise]);

  // Preparar dados do gráfico para o exercício selecionado
  const chartData = useMemo(() => {
    if (!selectedExercise) return [];

    const data = [];
    logs.forEach(log => {
      if (log.exercises_completed && Array.isArray(log.exercises_completed)) {
        const exercise = log.exercises_completed.find(ex => ex.exercise_name === selectedExercise);
        if (exercise && exercise.max_weight) {
          data.push({
            date: new Date(log.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
            fullDate: log.date,
            weight: exercise.max_weight,
            sets: exercise.sets_completed || 0,
          });
        }
      }
    });

    // Ordenar por data e inverter para mostrar mais antigos primeiro
    return data.sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
  }, [logs, selectedExercise]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return { maxWeight: 0, minWeight: 0, progress: 0, totalWorkouts: 0 };
    }

    const weights = chartData.map(d => d.weight);
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);
    const firstWeight = weights[0];
    const lastWeight = weights[weights.length - 1];
    const progress = firstWeight ? ((lastWeight - firstWeight) / firstWeight * 100) : 0;

    return {
      maxWeight,
      minWeight,
      progress,
      totalWorkouts: chartData.length,
      currentWeight: lastWeight,
    };
  }, [chartData]);

  if (availableExercises.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-12 text-center">
          <Weight className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-2">Nenhum exercício com carga registrada ainda</p>
          <p className="text-slate-500 text-sm">
            Registre a carga máxima durante seus treinos para acompanhar sua evolução
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Seletor de Exercício */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4">
          <div className="space-y-2">
            <label className="text-slate-300 text-sm font-medium">Selecione o Exercício</label>
            <Select value={selectedExercise} onValueChange={setSelectedExercise}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Escolha um exercício" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {availableExercises.map(exercise => (
                  <SelectItem key={exercise} value={exercise} className="text-white hover:bg-slate-700">
                    {exercise}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {selectedExercise && chartData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Carga Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{stats.currentWeight}</p>
              <p className="text-slate-500 text-sm">kg</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Carga Máxima</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-400">{stats.maxWeight}</p>
              <p className="text-slate-500 text-sm">kg</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Evolução</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {stats.progress !== 0 && (
                  <TrendingUp className={`w-5 h-5 ${stats.progress > 0 ? 'text-green-400' : 'text-red-400'}`} />
                )}
                <p className={`text-3xl font-bold ${stats.progress > 0 ? 'text-green-400' : stats.progress < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {stats.progress > 0 ? '+' : ''}{stats.progress.toFixed(1)}
                </p>
              </div>
              <p className="text-slate-500 text-sm">%</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400">Treinos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{stats.totalWorkouts}</p>
              <p className="text-slate-500 text-sm">registros</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart */}
      {selectedExercise && chartData.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Evolução de Carga - {selectedExercise}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  style={{ fontSize: '12px' }}
                  label={{ value: 'kg', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value, name) => {
                    if (name === 'weight') return [`${value} kg`, 'Carga'];
                    if (name === 'sets') return [value, 'Séries'];
                    return [value, name];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* History Table */}
      {selectedExercise && chartData.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Histórico de Treinos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {chartData.slice().reverse().map((record, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">{record.date}</p>
                      <p className="text-slate-400 text-sm">{record.sets} séries</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-400">{record.weight}</p>
                    <p className="text-xs text-slate-500">kg</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}