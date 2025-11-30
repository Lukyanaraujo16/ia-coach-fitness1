import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, Medal, Star } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PersonalRecords({ logs }) {
  // Calcular recordes pessoais
  const getPersonalRecords = () => {
    const records = {};

    logs.forEach(log => {
      (log.exercises_completed || []).forEach(ex => {
        const name = ex.exercise_name;
        if (!name) return;

        const maxWeight = ex.max_weight || Math.max(...(ex.weight || [0]));
        
        if (maxWeight > 0) {
          if (!records[name] || maxWeight > records[name].weight) {
            records[name] = {
              exercise: name,
              weight: maxWeight,
              date: log.date,
              sets: ex.sets_completed || 0,
              reps: ex.reps || []
            };
          }
        }
      });
    });

    return Object.values(records)
      .sort((a, b) => b.weight - a.weight);
  };

  // Recordes gerais
  const getOverallRecords = () => {
    if (logs.length === 0) return null;

    // Maior duração de treino
    const longestWorkout = logs.reduce((max, log) => 
      (log.duration_minutes || 0) > (max?.duration_minutes || 0) ? log : max, logs[0]);

    // Mais calorias em um treino
    const mostCalories = logs.reduce((max, log) => 
      (log.calories_burned || 0) > (max?.calories_burned || 0) ? log : max, logs[0]);

    // Mais exercícios em um treino
    const mostExercises = logs.reduce((max, log) => 
      (log.exercises_completed?.length || 0) > (max?.exercises_completed?.length || 0) ? log : max, logs[0]);

    // Maior série total em um dia
    const mostSets = logs.reduce((max, log) => {
      const totalSets = (log.exercises_completed || []).reduce((sum, ex) => sum + (ex.sets_completed || 0), 0);
      const maxSets = (max?.exercises_completed || []).reduce((sum, ex) => sum + (ex.sets_completed || 0), 0);
      return totalSets > maxSets ? log : max;
    }, logs[0]);

    return {
      longestWorkout,
      mostCalories,
      mostExercises,
      mostSets
    };
  };

  const personalRecords = getPersonalRecords();
  const overallRecords = getOverallRecords();

  const getMedalColor = (index) => {
    switch(index) {
      case 0: return "text-yellow-400";
      case 1: return "text-slate-300";
      case 2: return "text-amber-600";
      default: return "text-slate-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Recordes de Carga */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Recordes Pessoais de Carga
          </CardTitle>
        </CardHeader>
        <CardContent>
          {personalRecords.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              Nenhum recorde registrado ainda. Complete treinos para ver seus PRs!
            </p>
          ) : (
            <div className="space-y-3">
              {personalRecords.slice(0, 10).map((record, idx) => (
                <div 
                  key={record.exercise}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    idx < 3 ? 'bg-yellow-900/10 border border-yellow-700/30' : 'bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8">
                      {idx < 3 ? (
                        <Medal className={`w-5 h-5 ${getMedalColor(idx)}`} />
                      ) : (
                        <span className="text-slate-500 text-sm font-medium">{idx + 1}º</span>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{record.exercise}</p>
                      <p className="text-slate-400 text-xs">
                        {format(parseISO(record.date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-400">{record.weight}kg</p>
                    {record.reps.length > 0 && (
                      <p className="text-slate-400 text-xs">
                        {record.reps[0]} reps
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recordes Gerais */}
      {overallRecords && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-400" />
              Recordes Gerais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {overallRecords.longestWorkout?.duration_minutes > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-400 text-xs mb-1">Treino Mais Longo</p>
                  <p className="text-2xl font-bold text-green-400">
                    {overallRecords.longestWorkout.duration_minutes}min
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {overallRecords.longestWorkout.workout_title}
                  </p>
                  <p className="text-slate-600 text-xs">
                    {format(parseISO(overallRecords.longestWorkout.date), "dd/MM/yy")}
                  </p>
                </div>
              )}

              {overallRecords.mostCalories?.calories_burned > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-400 text-xs mb-1">Mais Calorias</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {overallRecords.mostCalories.calories_burned}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {overallRecords.mostCalories.workout_title}
                  </p>
                  <p className="text-slate-600 text-xs">
                    {format(parseISO(overallRecords.mostCalories.date), "dd/MM/yy")}
                  </p>
                </div>
              )}

              {overallRecords.mostExercises?.exercises_completed?.length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-400 text-xs mb-1">Mais Exercícios</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {overallRecords.mostExercises.exercises_completed.length}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {overallRecords.mostExercises.workout_title}
                  </p>
                  <p className="text-slate-600 text-xs">
                    {format(parseISO(overallRecords.mostExercises.date), "dd/MM/yy")}
                  </p>
                </div>
              )}

              {(() => {
                const totalSets = (overallRecords.mostSets?.exercises_completed || [])
                  .reduce((sum, ex) => sum + (ex.sets_completed || 0), 0);
                return totalSets > 0 && (
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-slate-400 text-xs mb-1">Mais Séries</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {totalSets}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      {overallRecords.mostSets.workout_title}
                    </p>
                    <p className="text-slate-600 text-xs">
                      {format(parseISO(overallRecords.mostSets.date), "dd/MM/yy")}
                    </p>
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}