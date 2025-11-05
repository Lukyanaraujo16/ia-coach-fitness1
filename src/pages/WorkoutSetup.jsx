import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Loader2, Check, Sparkles, Clock, Zap, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WorkoutSetup() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingWorkout, setGeneratingWorkout] = useState(false);
  const [generatedWorkout, setGeneratedWorkout] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (!currentUser.nutrition_setup_completed) {
          navigate(createPageUrl("NutritionSetup"));
        } else if (currentUser.workout_setup_completed) {
          navigate(createPageUrl("Home"));
        }
      } catch (error) {
        base44.auth.redirectToLogin(createPageUrl("WorkoutSetup"));
      }
    };
    loadUser();
  }, [navigate]);

  const generateWorkoutPlan = async () => {
    setGeneratingWorkout(true);
    try {
      const goalLabels = {
        lose_weight: 'emagrecimento com foco em queima de gordura',
        gain_muscle: 'ganho de massa muscular e hipertrofia',
        maintain: 'manutenção e condicionamento físico'
      };

      const levelLabels = {
        beginner: 'iniciante (poucos meses de treino)',
        intermediate: 'intermediário (6-12 meses de treino)',
        advanced: 'avançado (mais de 1 ano de treino consistente)'
      };

      const locationLabels = {
        gym: 'academia com equipamentos completos',
        home: 'casa com equipamentos limitados',
        both: 'variando entre academia e casa'
      };

      const prompt = `Você é um personal trainer experiente criando um programa de treino COMPLETO para um novo aluno.

PERFIL DO ALUNO:
- Nome: ${user.full_name}
- Objetivo: ${goalLabels[user.fitness_goal]}
- Nível: ${levelLabels[user.fitness_level]}
- Local: ${locationLabels[user.training_location]}
- Meta semanal: ${user.weekly_goal} treinos/semana
- Peso atual: ${user.current_weight}kg
- Meta de peso: ${user.weight_goal}kg

Crie um programa de treino COMPLETO E ESTRUTURADO com:

1. Título atrativo e motivador
2. Descrição explicando a abordagem do treino
3. ${user.weekly_goal} dias de treino (estruturado por dia)
4. Para cada dia: 6-8 exercícios específicos com séries e repetições
5. Tempo de descanso entre séries apropriado
6. Notas técnicas para execução correta
7. Duração estimada de cada treino

IMPORTANTE:
- Use exercícios apropriados para ${user.training_location}
- Considere o nível ${user.fitness_level} nas cargas e volumes
- Foque no objetivo de ${user.fitness_goal}
- Seja ESPECÍFICO nos exercícios (nome exato, grupo muscular)
- Varie os exercícios entre os dias
- Inclua aquecimento e alongamento quando necessário`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Título do programa de treino"
            },
            description: {
              type: "string",
              description: "Descrição detalhada do programa"
            },
            duration_minutes: {
              type: "number",
              description: "Duração média de cada treino"
            },
            days: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day_number: { type: "number" },
                  title: { type: "string", description: "Nome do dia (ex: Peito e Tríceps)" },
                  exercises: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        exercise_name: { type: "string" },
                        exercise_category: {
                          type: "string",
                          enum: ["chest", "back", "legs", "shoulders", "arms", "core", "cardio", "full_body"]
                        },
                        sets: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              times: { type: "number", description: "Quantas vezes fazer" },
                              reps: { type: "string", description: "Repetições" },
                              rest_seconds: { type: "number" }
                            }
                          }
                        },
                        notes: { type: "string", description: "Dicas de execução" }
                      }
                    }
                  }
                }
              }
            },
            tips: {
              type: "array",
              items: { type: "string" },
              description: "Dicas gerais sobre o programa"
            }
          }
        }
      });

      setGeneratedWorkout(response);
    } catch (error) {
      console.error("Error generating workout:", error);
      alert("Erro ao gerar treino. Tente novamente.");
    } finally {
      setGeneratingWorkout(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Criar o treino no banco
      const createdWorkout = await base44.entities.Workout.create({
        title: generatedWorkout.title + " - Personalizado",
        description: generatedWorkout.description,
        category: user.fitness_goal === 'lose_weight' ? 'cardio' : 'strength',
        difficulty: user.fitness_level,
        training_location: user.training_location,
        duration_minutes: generatedWorkout.duration_minutes,
        days: generatedWorkout.days,
        is_premium: false,
      });

      // Selecionar este treino e marcar setup completo
      await base44.auth.updateMe({
        selected_workout_id: createdWorkout.id,
        current_workout_day: 1,
        completed_workout_days: [],
        workout_setup_completed: true,
      });

      navigate(createPageUrl("Home"));
    } catch (error) {
      console.error("Error saving workout:", error);
      alert("Erro ao salvar treino. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!generatedWorkout) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-12">
        <Card className="bg-slate-900/50 border-slate-800 max-w-2xl w-full">
          <CardContent className="p-12 text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
              <Dumbbell className="w-10 h-10 text-white" />
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-white mb-3">
                Configuração de Treino
              </h1>
              <p className="text-slate-300 text-lg mb-2">
                Olá, {user.full_name}! 👋
              </p>
              <p className="text-slate-400 max-w-md mx-auto">
                Agora vamos criar seu programa de treino personalizado com base no seu perfil e objetivos!
              </p>
            </div>

            <Card className="bg-slate-800/50 border-slate-700 max-w-md mx-auto text-left">
              <CardContent className="p-6 space-y-3">
                <p className="text-slate-400 text-sm font-semibold">Seu Perfil:</p>
                <div className="space-y-2 text-sm">
                  <p className="text-slate-300">
                    🎯 Objetivo: <strong>{user.fitness_goal === 'lose_weight' ? 'Emagrecimento' : user.fitness_goal === 'gain_muscle' ? 'Ganho de Massa' : 'Manutenção'}</strong>
                  </p>
                  <p className="text-slate-300">
                    📊 Nível: <strong className="capitalize">{user.fitness_level === 'beginner' ? 'Iniciante' : user.fitness_level === 'intermediate' ? 'Intermediário' : 'Avançado'}</strong>
                  </p>
                  <p className="text-slate-300">
                    📍 Local: <strong>{user.training_location === 'gym' ? 'Academia' : user.training_location === 'home' ? 'Casa' : 'Ambos'}</strong>
                  </p>
                  <p className="text-slate-300">
                    📅 Meta: <strong>{user.weekly_goal} treinos/semana</strong>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={generateWorkoutPlan}
              disabled={generatingWorkout}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-6 px-8 text-lg shadow-lg"
            >
              {generatingWorkout ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Gerando Seu Treino...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Gerar Programa com IA
                </>
              )}
            </Button>

            <p className="text-slate-500 text-sm">
              ⏱️ Isso pode levar 30-60 segundos
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/20 border-blue-700/50">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Seu Treino Foi Criado!
              </h2>
              <p className="text-slate-300 text-lg">
                Programa personalizado pronto para começar
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Workout Overview */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-2xl">{generatedWorkout.title}</CardTitle>
            <p className="text-slate-300 mt-2">{generatedWorkout.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-900/20 rounded-lg text-center">
                <Calendar className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{generatedWorkout.days.length}</p>
                <p className="text-slate-400 text-sm">Dias/semana</p>
              </div>
              <div className="p-4 bg-purple-900/20 rounded-lg text-center">
                <Clock className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{generatedWorkout.duration_minutes}</p>
                <p className="text-slate-400 text-sm">Minutos</p>
              </div>
              <div className="p-4 bg-green-900/20 rounded-lg text-center">
                <Zap className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {generatedWorkout.days.reduce((sum, day) => sum + day.exercises.length, 0)}
                </p>
                <p className="text-slate-400 text-sm">Exercícios</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Days Preview */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-white">📅 Programa de Treino</h3>
          {generatedWorkout.days.map((day, idx) => (
            <Card key={idx} className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-lg">
                  Dia {day.day_number}: {day.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {day.exercises.slice(0, 3).map((exercise, exIdx) => (
                    <div key={exIdx} className="flex items-center gap-3 text-sm">
                      <div className="w-6 h-6 bg-blue-600/20 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-400 text-xs font-bold">{exIdx + 1}</span>
                      </div>
                      <p className="text-slate-300 flex-1">{exercise.exercise_name}</p>
                      <p className="text-slate-500 text-xs">
                        {exercise.sets[0].times}x{exercise.sets[0].reps}
                      </p>
                    </div>
                  ))}
                  {day.exercises.length > 3 && (
                    <p className="text-slate-500 text-xs text-center pt-2">
                      + {day.exercises.length - 3} exercícios
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tips */}
        {generatedWorkout.tips && generatedWorkout.tips.length > 0 && (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-sm">💡 Dicas Importantes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {generatedWorkout.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Complete Button */}
        <Button
          onClick={handleComplete}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-6 text-lg shadow-lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Finalizando Configuração...
            </>
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Finalizar e Começar a Treinar!
            </>
          )}
        </Button>
      </div>
    </div>
  );
}