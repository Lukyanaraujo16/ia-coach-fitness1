import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dumbbell, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function ExerciseAlternatives({ workoutLogs, user }) {
  const [selectedExercise, setSelectedExercise] = useState("");
  const [alternatives, setAlternatives] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => base44.entities.Exercise.list(),
  });

  // Extrair exercícios únicos dos logs
  const uniqueExercises = [...new Set(
    workoutLogs.flatMap(log => 
      log.exercises_completed?.map(ex => ex.exercise_name) || []
    )
  )];

  const findAlternatives = async () => {
    if (!selectedExercise) return;

    setLoading(true);
    try {
      // Encontrar o exercício original nos logs
      const exerciseLogs = workoutLogs
        .flatMap(log => log.exercises_completed || [])
        .filter(ex => ex.exercise_name === selectedExercise);

      const avgWeight = exerciseLogs.length > 0
        ? exerciseLogs.reduce((sum, ex) => sum + (ex.max_weight || 0), 0) / exerciseLogs.length
        : 0;

      const prompt = `Você é um especialista em treino físico sugerindo exercícios alternativos.

EXERCÍCIO ATUAL: ${selectedExercise}
PERFIL DO ALUNO:
- Objetivo: ${user.fitness_goal}
- Nível: ${user.fitness_level}
- Local de treino: ${user.training_location}
- Carga média usada: ${avgWeight > 0 ? avgWeight + 'kg' : 'Peso corporal'}

Sugira 5 exercícios alternativos que:
1. Trabalhem os mesmos grupos musculares
2. Sejam apropriados para o nível e local de treino do aluno
3. Ofereçam variação e progressão
4. Incluam opções mais fáceis e mais difíceis

Para cada alternativa, explique:
- Por que é uma boa substituta
- Diferenças de execução
- Quando usar cada uma`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            original_exercise_info: {
              type: "object",
              properties: {
                muscle_groups: {
                  type: "array",
                  items: { type: "string" }
                },
                difficulty: { type: "string" },
                equipment_needed: { type: "string" }
              }
            },
            alternatives: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  difficulty: {
                    type: "string",
                    enum: ["easier", "similar", "harder"]
                  },
                  why_good_substitute: { type: "string" },
                  execution_differences: { type: "string" },
                  when_to_use: { type: "string" },
                  equipment: { type: "string" }
                }
              }
            },
            progression_tips: {
              type: "string",
              description: "Dicas de como progredir entre as variações"
            }
          }
        }
      });

      setAlternatives({ exercise: selectedExercise, ...response });
    } catch (error) {
      console.error("Error finding alternatives:", error);
      alert("Erro ao buscar alternativas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const difficultyColors = {
    easier: "bg-green-500/20 text-green-400",
    similar: "bg-blue-500/20 text-blue-400",
    harder: "bg-red-500/20 text-red-400",
  };

  const difficultyLabels = {
    easier: "Mais Fácil",
    similar: "Similar",
    harder: "Mais Difícil",
  };

  return (
    <div className="space-y-4">
      {/* Exercise Selection */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-blue-400" />
            Encontrar Exercícios Alternativos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-slate-300 text-sm">Selecione um exercício:</label>
            <Select value={selectedExercise} onValueChange={setSelectedExercise}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Escolha um exercício" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {uniqueExercises.map(exercise => (
                  <SelectItem key={exercise} value={exercise} className="text-white hover:bg-slate-700">
                    {exercise}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={findAlternatives}
            disabled={loading || !selectedExercise}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Buscando alternativas...
              </>
            ) : (
              "Buscar Alternativas"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Alternatives Display */}
      {alternatives && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Original Exercise Info */}
          <Card className="bg-blue-900/20 border-blue-700/50">
            <CardHeader>
              <CardTitle className="text-white text-base">📊 Exercício Original</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xl font-bold text-white mb-2">{alternatives.exercise}</p>
                <div className="flex flex-wrap gap-2">
                  {alternatives.original_exercise_info.muscle_groups.map((muscle, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Dificuldade:</p>
                  <p className="text-white font-semibold capitalize">
                    {alternatives.original_exercise_info.difficulty}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Equipamento:</p>
                  <p className="text-white font-semibold">
                    {alternatives.original_exercise_info.equipment_needed}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alternatives */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold">🔄 Alternativas Recomendadas</h3>
            {alternatives.alternatives.map((alt, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-white font-semibold mb-1">{alt.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${difficultyColors[alt.difficulty]}`}>
                            {difficultyLabels[alt.difficulty]}
                          </span>
                          <span className="text-slate-500 text-xs">• {alt.equipment}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-slate-400 text-xs mb-1">Por que é boa substituta:</p>
                        <p className="text-slate-300">{alt.why_good_substitute}</p>
                      </div>

                      <div>
                        <p className="text-slate-400 text-xs mb-1">Diferenças de execução:</p>
                        <p className="text-slate-300">{alt.execution_differences}</p>
                      </div>

                      <div className="bg-blue-900/20 border border-blue-700/30 rounded p-2">
                        <p className="text-blue-400 text-xs mb-1">⏰ Quando usar:</p>
                        <p className="text-slate-300 text-xs">{alt.when_to_use}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Progression Tips */}
          <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-700/50">
            <CardHeader>
              <CardTitle className="text-white text-base">📈 Dicas de Progressão</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 leading-relaxed">
                {alternatives.progression_tips}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}