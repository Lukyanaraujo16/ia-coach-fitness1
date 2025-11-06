
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Loader2, Check, Sparkles, AlertTriangle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function WorkoutSetup() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [generatingWorkout, setGeneratingWorkout] = useState(false);
  const [generatedWorkout, setGeneratedWorkout] = useState(null);
  const [error, setError] = useState(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [shouldRetry, setShouldRetry] = useState(false);
  const MAX_ATTEMPTS = 3;

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (!currentUser.onboarding_completed) {
          navigate(createPageUrl("Onboarding"));
        } else if (!currentUser.nutrition_setup_completed) {
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

  // Auto-retry quando shouldRetry for true
  useEffect(() => {
    if (shouldRetry && attemptCount < MAX_ATTEMPTS) {
      const timer = setTimeout(() => {
        setShouldRetry(false);
        generateWorkoutPlan();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [shouldRetry, attemptCount]);

  const generateWorkoutPlan = async () => {
    if (!user) return;
    
    setGeneratingWorkout(true);
    setError(null);
    const currentAttempt = attemptCount + 1;
    setAttemptCount(currentAttempt);

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

      const daysOfWeek = user.weekly_goal;
      const userGender = user.gender || 'male';

      // Divisões específicas por gênero
      const maleDivisions = {
        3: [
          "Dia 1: Peito + Ombros + Tríceps",
          "Dia 2: Costas + Bíceps + Core",
          "Dia 3: Pernas + Posteriores + Core"
        ],
        4: [
          "Dia 1: Peito + Tríceps + Core",
          "Dia 2: Pernas + Ombros",
          "Dia 3: Costas + Bíceps + Core",
          "Dia 4: Posteriores + Core"
        ],
        5: [
          "Dia 1: Peito + Ombros + Tríceps",
          "Dia 2: Pernas + Core",
          "Dia 3: Costas + Bíceps",
          "Dia 4: Posteriores + Core",
          "Dia 5: Peito + Costas + Bíceps + Tríceps"
        ],
        6: [
          "Dia 1: Peito",
          "Dia 2: Costas",
          "Dia 3: Pernas",
          "Dia 4: Ombros",
          "Dia 5: Bíceps + Tríceps",
          "Dia 6: Posteriores + Core"
        ],
        7: [
          "Dia 1: Peito",
          "Dia 2: Costas",
          "Dia 3: Pernas",
          "Dia 4: Ombros",
          "Dia 5: Bíceps + Tríceps",
          "Dia 6: Posteriores",
          "Dia 7: Core + Cardio"
        ]
      };

      const femaleDivisions = {
        3: [
          "Dia 1: Peito + Ombros + Pernas",
          "Dia 2: Costas + Posteriores + Core",
          "Dia 3: Bíceps + Tríceps + Pernas + Posteriores"
        ],
        4: [
          "Dia 1: Peito + Pernas + Core",
          "Dia 2: Costas + Posteriores",
          "Dia 3: Bíceps + Ombros + Tríceps + Core",
          "Dia 4: Pernas + Posteriores + Core"
        ],
        5: [
          "Dia 1: Pernas + Core",
          "Dia 2: Peito + Ombros + Tríceps",
          "Dia 3: Posteriores + Core",
          "Dia 4: Costas + Bíceps",
          "Dia 5: Pernas + Posteriores + Core"
        ],
        6: [
          "Dia 1: Pernas + Core",
          "Dia 2: Peito + Tríceps",
          "Dia 3: Posteriores + Core",
          "Dia 4: Costas + Bíceps",
          "Dia 5: Ombros",
          "Dia 6: Pernas + Posteriores"
        ],
        7: [
          "Dia 1: Pernas + Core",
          "Dia 2: Peito + Tríceps",
          "Dia 3: Posteriores + Core",
          "Dia 4: Costas + Bíceps",
          "Dia 5: Ombros",
          "Dia 6: Pernas + Posteriores",
          "Dia 7: Core + Cardio"
        ]
      };

      const divisions = userGender === 'female' ? femaleDivisions : maleDivisions;
      const divisionList = divisions[daysOfWeek] || divisions[5];

      const prompt = `Você é um personal trainer experiente criando um programa de treino COMPLETO para um novo aluno.

PERFIL DO ALUNO:
- Nome: ${user.full_name}
- Gênero: ${userGender === 'male' ? 'Masculino' : userGender === 'female' ? 'Feminino' : 'Outro'}
- Objetivo: ${goalLabels[user.fitness_goal]}
- Nível: ${levelLabels[user.fitness_level]}
- Local: ${locationLabels[user.training_location]}
- Meta semanal: ${daysOfWeek} treinos/semana
- Peso atual: ${user.current_weight}kg
- Meta de peso: ${user.weight_goal}kg

⚠️⚠️⚠️ REGRA ABSOLUTAMENTE CRÍTICA ⚠️⚠️⚠️
Você DEVE criar EXATAMENTE ${daysOfWeek} dias de treino.
O array "days" DEVE ter EXATAMENTE ${daysOfWeek} elementos.
Cada dia DEVE ter day_number de 1 até ${daysOfWeek}.
NÃO GERE MENOS DIAS. NÃO GERE MAIS DIAS.
Se você gerar quantidade diferente de ${daysOfWeek} dias, o treino será REJEITADO.

DISTRIBUIÇÃO OBRIGATÓRIA (para ${userGender === 'female' ? 'MULHERES' : 'HOMENS'}):
${divisionList.map((day, i) => `${day} (day_number: ${i + 1})`).join('\n')}

INSTRUÇÕES OBRIGATÓRIAS:
1. Crie EXATAMENTE ${daysOfWeek} objetos no array "days"
2. Cada dia DEVE ter day_number sequencial: 1, 2, 3... até ${daysOfWeek}
3. Cada dia DEVE ter 6-8 exercícios
4. Cada exercício DEVE ter:
   - exercise_name (nome completo)
   - exercise_category (categoria)
   - sets: array com 3-4 objetos contendo reps e rest_seconds
   - notes (opcional)
5. Siga RIGOROSAMENTE a divisão muscular especificada
6. Use exercícios para ${user.training_location}
7. Considere nível ${user.fitness_level}
${userGender === 'female' ? '8. Para mulheres: ÊNFASE em pernas, glúteos e posteriores' : '8. Para homens: equilibre push/pull'}

LEMBRE-SE: ${daysOfWeek} dias, numerados de 1 a ${daysOfWeek}, SEM EXCEÇÃO!`;

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: geração demorou mais de 2 minutos')), 120000)
      );

      const generatePromise = base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Título motivador do programa"
            },
            description: {
              type: "string",
              description: "Descrição explicando a abordagem"
            },
            days: {
              type: "array",
              minItems: daysOfWeek,
              maxItems: daysOfWeek,
              items: {
                type: "object",
                properties: {
                  day_number: {
                    type: "number",
                    minimum: 1,
                    maximum: daysOfWeek,
                    description: "Número do dia (1, 2, 3, etc.)"
                  },
                  title: {
                    type: "string",
                    description: "Título do dia (ex: Peito e Tríceps)"
                  },
                  focus: {
                    type: "string",
                    description: "Foco do treino do dia"
                  },
                  exercises: {
                    type: "array",
                    minItems: 6,
                    maxItems: 8,
                    items: {
                      type: "object",
                      properties: {
                        exercise_name: {
                          type: "string",
                          description: "Nome completo do exercício"
                        },
                        exercise_category: {
                          type: "string",
                          description: "Categoria do exercício"
                        },
                        sets: {
                          type: "array",
                          minItems: 3,
                          maxItems: 4,
                          items: {
                            type: "object",
                            properties: {
                              reps: {
                                type: "string",
                                description: "Repetições (ex: 12, 10-12, máximo)"
                              },
                              rest_seconds: {
                                type: "number",
                                description: "Descanso em segundos"
                              },
                              notes: {
                                type: "string",
                                description: "Notas sobre a série (opcional)"
                              }
                            },
                            required: ["reps", "rest_seconds"]
                          }
                        },
                        notes: {
                          type: "string",
                          description: "Observações sobre execução"
                        }
                      },
                      required: ["exercise_name", "exercise_category", "sets"]
                    },
                    description: "Lista de exercícios do dia"
                  }
                },
                required: ["day_number", "title", "focus", "exercises"]
              },
              description: `Array com EXATAMENTE ${daysOfWeek} dias de treino`
            }
          },
          required: ["title", "description", "days"]
        }
      });

      const response = await Promise.race([generatePromise, timeoutPromise]);

      // Validações críticas com mensagens detalhadas
      if (!response) {
        throw new Error('Resposta vazia da IA');
      }

      if (!response.days || !Array.isArray(response.days)) {
        throw new Error('Resposta inválida: days não é um array');
      }

      if (response.days.length !== daysOfWeek) {
        throw new Error(`Erro crítico: IA gerou ${response.days.length} dias, mas você pediu ${daysOfWeek} dias. Tentativa ${currentAttempt}/${MAX_ATTEMPTS}.`);
      }

      // Validar que cada dia tem exercícios suficientes
      for (let i = 0; i < response.days.length; i++) {
        const day = response.days[i];
        if (!day.exercises || day.exercises.length < 6) {
          throw new Error(`Dia ${i + 1} incompleto: tem apenas ${day.exercises?.length || 0} exercícios (mínimo 6)`);
        }
        if (day.day_number !== i + 1) {
          day.day_number = i + 1; // Corrigir numeração se necessário
        }
      }

      console.log("✅ Treino gerado com sucesso:", response);
      setGeneratedWorkout(response);
      setAttemptCount(0);
      setError(null);
    } catch (error) {
      console.error("❌ Erro ao gerar treino:", error);
      const errorMessage = error.message || 'Erro desconhecido';
      setError(errorMessage);
      
      // Auto-retry se ainda tiver tentativas
      if (currentAttempt < MAX_ATTEMPTS) {
        setShouldRetry(true);
      }
    } finally {
      setGeneratingWorkout(false);
    }
  };

  const handleReset = () => {
    setError(null);
    setAttemptCount(0);
    setShouldRetry(false);
    setGeneratedWorkout(null);
  };

  const handleComplete = async () => {
    setGeneratingWorkout(true);
    try {
      const createdWorkout = await base44.entities.Workout.create({
        title: generatedWorkout.title,
        description: generatedWorkout.description,
        category: "full_body",
        difficulty: user.fitness_level,
        training_location: user.training_location,
        duration_minutes: 50,
        days: generatedWorkout.days,
        is_premium: false,
        is_public: false,
        created_for_user: user.email,
      });

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
      setGeneratingWorkout(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        {!generatedWorkout ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <Dumbbell className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-white text-3xl text-center mb-2">
                  Configuração de Treino
                </CardTitle>
                <p className="text-slate-400 text-center text-lg">
                  Vamos criar seu programa de treino personalizado com IA
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/20 border-blue-700/50">
                  <CardContent className="p-6">
                    <h3 className="text-white font-semibold mb-4                       text-center">
                      📊 Seu Perfil de Treino
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Objetivo</p>
                        <p className="text-white font-semibold">
                          {user.fitness_goal === 'lose_weight' ? '🔥 Emagrecimento' : 
                           user.fitness_goal === 'gain_muscle' ? '💪 Ganho de Massa' : 
                           '⚡ Manutenção'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Nível</p>
                        <p className="text-white font-semibold capitalize">
                          {user.fitness_level === 'beginner' ? '🌱 Iniciante' :
                           user.fitness_level === 'intermediate' ? '🚀 Intermediário' :
                           '🏆 Avançado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Local</p>
                        <p className="text-white font-semibold">
                          {user.training_location === 'gym' ? '🏋️ Academia' :
                           user.training_location === 'home' ? '🏠 Casa' :
                           '🔄 Ambos'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Frequência</p>
                        <p className="text-white font-semibold">
                          {user.weekly_goal}x por semana
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                  <p className="text-blue-400 text-sm font-semibold mb-2">✨ O que será criado:</p>
                  <ul className="space-y-1 text-slate-300                       text-sm">
                    <li>• {user.weekly_goal} dias de treino completos</li>
                    <li>• 6-8 exercícios por dia</li>
                    <li>• Séries, repetições e descanso personalizados</li>
                    <li>• Divisão otimizada para seus objetivos</li>
                    <li>• Exercícios adequados para {user.training_location === 'gym' ? 'academia' : user.training_location === 'home' ? 'casa' : 'ambos locais'}</li>
                  </ul>
                </div>

                {error && (
                  <Card className="bg-red-900/20 border-red-800/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-red-400 font-semibold text-sm mb-1">Erro na Geração</p>
                          <p className="text-slate-300 text-sm mb-2">{error}</p>
                          {attemptCount < MAX_ATTEMPTS && shouldRetry ? (
                            <div className="flex items-center gap-2 text-orange-400 text-xs">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Tentando novamente em 2 segundos... (Tentativa {attemptCount + 1}/{MAX_ATTEMPTS})</span>
                            </div>
                          ) : attemptCount >= MAX_ATTEMPTS ? (
                            <div className="flex gap-2 mt-3">
                              <Button
                                onClick={handleReset}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <RefreshCw className="w-3 h-3 mr-2" />
                                Tentar Novamente
                              </Button>
                              <Button
                                onClick={() => navigate(createPageUrl("Home"))}
                                size="sm"
                                variant="outline"
                                className="border-slate-700 text-slate-300"
                              >
                                Configurar Depois
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button
                  onClick={generateWorkoutPlan}
                  disabled={generatingWorkout || (shouldRetry && attemptCount < MAX_ATTEMPTS)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-8 text-xl font-bold shadow-lg"
                >
                  {generatingWorkout || shouldRetry ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-base">
                        {shouldRetry 
                          ? `Tentativa ${attemptCount}/${MAX_ATTEMPTS} - Aguarde...`
                          : 'Gerando seu treino personalizado...'}
                      </span>
                    </div>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6 mr-2" />
                      Gerar Meu Treino com IA
                    </>
                  )}
                </Button>

                <p className="text-slate-500 text-xs text-center">
                  ⏱️ A geração leva cerca de 30-90 segundos. Aguarde!
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/20 border-blue-700/50">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-blue-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  🎉 Treino Criado!
                </h2>
                <p className="text-slate-300 text-lg">
                  Seu programa personalizado está pronto
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-2xl">{generatedWorkout.title}</CardTitle>
                <p className="text-slate-400">{generatedWorkout.description}</p>
              </CardHeader>
            </Card>

            {generatedWorkout.days.map((day, idx) => (
              <Card key={idx} className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white text-lg">
                        📅 Dia {day.day_number} - {day.title}
                      </CardTitle>
                      <p className="text-slate-400 text-sm">{day.focus}</p>
                    </div>
                    <Badge className="bg-blue-600/20 text-blue-400">
                      {day.exercises.length} exercícios
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {day.exercises.map((ex, exIdx) => (
                      <div key={exIdx} className="bg-slate-800/50 p-3 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-blue-600/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-blue-400 text-xs font-bold">{exIdx + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium mb-1">{ex.exercise_name}</p>
                            <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                              {ex.sets.map((set, setIdx) => (
                                <span key={setIdx} className="bg-slate-700/50 px-2 py-1 rounded">
                                  {setIdx + 1}x{set.reps} ({set.rest_seconds}s)
                                </span>
                              ))}
                            </div>
                            {ex.notes && (
                              <p className="text-slate-500 text-xs mt-2">💡 {ex.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              onClick={handleComplete}
              disabled={generatingWorkout}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 py-8 text-xl font-bold"
            >
              {generatingWorkout ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-6 h-6 mr-2" />
                  Começar Meu Treino!
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
