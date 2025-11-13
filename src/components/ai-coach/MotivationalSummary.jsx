
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Loader2, Sparkles, TrendingUp, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function MotivationalSummary({ workoutLogs, progressEntries, user }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    try {
      // Calcular estatísticas
      const totalWorkouts = workoutLogs.length;
      const totalDuration = workoutLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
      const totalCalories = workoutLogs.reduce((sum, log) => sum + (log.calories_burned || 0), 0);

      // Exercícios únicos
      const uniqueExercises = new Set(
        workoutLogs.flatMap(log => 
          log.exercises_completed?.map(ex => ex.exercise_name) || []
        )
      );

      // Progressão de peso
      const weightHistory = progressEntries
        .filter(e => e.weight)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      const weightChange = weightHistory.length >= 2
        ? weightHistory[weightHistory.length - 1].weight - weightHistory[0].weight
        : 0;

      // Melhor carga em cada exercício
      const bestLifts = {};
      workoutLogs.forEach(log => {
        log.exercises_completed?.forEach(ex => {
          if (ex.max_weight && (!bestLifts[ex.exercise_name] || ex.max_weight > bestLifts[ex.exercise_name])) {
            bestLifts[ex.exercise_name] = ex.max_weight;
          }
        });
      });

      const context = {
        user: {
          name: user.nome_completo, // Changed from user.full_name to user.nome_completo
          goal: user.fitness_goal,
          level: user.fitness_level,
        },
        stats: {
          total_workouts: totalWorkouts,
          total_duration_hours: Math.round(totalDuration / 60 * 10) / 10,
          total_calories: totalCalories,
          unique_exercises: uniqueExercises.size,
          weight_change_kg: weightChange,
          best_lifts: Object.entries(bestLifts).slice(0, 5),
        },
        first_workout_date: workoutLogs.length > 0 
          ? workoutLogs[workoutLogs.length - 1].date
          : null,
      };

      const prompt = `Você é um coach motivacional criando um resumo inspirador para seu aluno.

CONTEXTO:
${JSON.stringify(context, null, 2)}

Crie um resumo MOTIVACIONAL e PERSONALIZADO que:

1. Celebre as conquistas específicas do aluno (use números e fatos)
2. Destaque a evolução e progresso
3. Reconheça o esforço e dedicação
4. Inspire a continuar e superar desafios
5. Seja autêntico e energizante

Inclua:
- Um título impactante
- Conquistas principais (3-5 items específicos com dados)
- Recordes pessoais alcançados
- Mensagem motivacional personalizada
- Objetivo para os próximos 30 dias`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Título impactante do resumo"
            },
            opening_message: {
              type: "string",
              description: "Mensagem de abertura motivacional"
            },
            achievements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  icon: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  stat: { type: "string" }
                }
              },
              description: "Conquistas específicas com dados"
            },
            personal_records: {
              type: "array",
              items: { type: "string" },
              description: "Recordes pessoais alcançados"
            },
            motivational_message: {
              type: "string",
              description: "Mensagem motivacional poderosa"
            },
            next_goal: {
              type: "string",
              description: "Objetivo sugerido para próximos 30 dias"
            }
          }
        }
      });

      setSummary(response);
    } catch (error) {
      console.error("Error generating summary:", error);
      alert("Erro ao gerar resumo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!summary) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-12 text-center">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            Seu Resumo de Conquistas
          </h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Veja todas as suas conquistas, recordes pessoais e receba uma mensagem motivacional personalizada.
          </p>
          <Button
            onClick={generateSummary}
            disabled={loading || workoutLogs.length === 0}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Resumo Motivacional
              </>
            )}
          </Button>
          {workoutLogs.length === 0 && (
            <p className="text-slate-500 text-sm mt-4">
              Complete alguns treinos para ver seu resumo
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Title Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-700/50">
          <CardContent className="p-8 text-center">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-3">
              {summary.title}
            </h2>
            <p className="text-slate-300 text-lg leading-relaxed">
              {summary.opening_message}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Achievements Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {summary.achievements.map((achievement, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-1">
                      {achievement.title}
                    </h4>
                    <p className="text-slate-400 text-sm mb-2">
                      {achievement.description}
                    </p>
                    <div className="text-2xl font-bold text-blue-400">
                      {achievement.stat}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Personal Records */}
      {summary.personal_records && summary.personal_records.length > 0 && (
        <Card className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border-green-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Recordes Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.personal_records.map((record, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg"
                >
                  <div className="w-8 h-8 bg-green-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-400 font-bold">🏆</span>
                  </div>
                  <p className="text-slate-300 text-sm">{record}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Motivational Message */}
      <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Mensagem do Seu Coach
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-300 text-lg leading-relaxed">
            {summary.motivational_message}
          </p>
        </CardContent>
      </Card>

      {/* Next Goal */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Próximo Objetivo (30 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
            <div className="text-3xl">🎯</div>
            <p className="text-slate-300 leading-relaxed flex-1">
              {summary.next_goal}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Regenerate Button */}
      <Button
        onClick={generateSummary}
        disabled={loading}
        variant="outline"
        className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Regenerando...
          </>
        ) : (
          "Atualizar Resumo"
        )}
      </Button>
    </div>
  );
}
