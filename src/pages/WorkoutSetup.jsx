import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Loader2, Check, Sparkles, AlertTriangle, RefreshCw, ArrowLeftRight } from "lucide-react";
import { motion } from "framer-motion";

const LoadingProgress = ({ message }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        const increment = prev < 50 ? Math.random() * 5 : prev < 90 ? Math.random() * 2 : Math.random() * 0.5;
        return Math.min(prev + increment, 98);
      });
    }, 400);

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-blue-400 text-center font-medium">{message}</p>
      
      <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      <p className="text-slate-500 text-sm text-center">
        {Math.round(progress)}% completo
      </p>
    </div>
  );
};

export default function WorkoutSetup() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1); // 1: inicial, 2: selecionando, 3: exercícios selecionados, 4: aplicando técnicas, 5: completo
  const [selectedExercises, setSelectedExercises] = useState(null);
  const [generatedWorkout, setGeneratedWorkout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
          navigate(createPageUrl("Dashboard"));
        }
      } catch (error) {
        base44.auth.redirectToLogin(createPageUrl("WorkoutSetup"));
      }
    };
    loadUser();
  }, [navigate]);

  // ETAPA 1: Selecionar exercícios
  const selectExercises = async () => {
    if (!user) return;

    setLoading(true);
    setStep(2);
    setError(null);

    try {
      const daysOfWeek = user.weekly_goal;
      const userGender = user.gender || 'male';

      const maleDivisions = {
        3: ["Peito + Ombros + Tríceps", "Costas + Bíceps + Core", "Pernas + Posteriores + Core"],
        4: ["Peito + Tríceps + Core", "Pernas + Ombros", "Costas + Bíceps + Core", "Posteriores + Core"],
        5: ["Peito + Ombros + Tríceps", "Pernas + Core", "Costas + Bíceps", "Posteriores + Core", "Peito + Costas + Bíceps + Tríceps"],
        6: ["Peito", "Costas", "Pernas", "Ombros", "Bíceps + Tríceps", "Posteriores + Core"],
        7: ["Peito", "Costas", "Pernas", "Ombros", "Bíceps + Tríceps", "Posteriores", "Core + Cardio"]
      };

      const femaleDivisions = {
        3: ["Peito + Ombros + Pernas", "Costas + Posteriores + Core", "Bíceps + Tríceps + Pernas + Posteriores"],
        4: ["Peito + Pernas + Core", "Costas + Posteriores", "Bíceps + Ombros + Tríceps + Core", "Pernas + Posteriores + Core"],
        5: ["Pernas + Core", "Peito + Ombros + Tríceps", "Posteriores + Core", "Costas + Bíceps", "Pernas + Posteriores + Core"],
        6: ["Pernas + Core", "Peito + Tríceps", "Posteriores + Core", "Costas + Bíceps", "Ombros", "Pernas + Posteriores"],
        7: ["Pernas + Core", "Peito + Tríceps", "Posteriores + Core", "Costas + Bíceps", "Ombros", "Pernas + Posteriores", "Core + Cardio"]
      };

      const divisions = userGender === 'female' ? femaleDivisions : maleDivisions;
      const divisionList = divisions[daysOfWeek] || divisions[5];

      const prompt = `Selecione exercícios para treino ${daysOfWeek}x/semana.

Perfil: ${user.fitness_level}, ${user.training_location === 'gym' ? 'academia' : 'casa'}
${user.workout_observations ? `Obs: ${user.workout_observations}` : ''}

Divisão:
${divisionList.map((day, i) => `Dia ${i+1}: ${day}`).join('\n')}

Para cada dia, escolha 5-6 exercícios adequados.
Retorne apenas nomes dos exercícios, SEM séries.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            days: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day_number: { type: "number" },
                  title: { type: "string" },
                  focus: { type: "string" },
                  exercises: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        exercise_name: { type: "string" },
                        exercise_category: { type: "string" }
                      },
                      required: ["exercise_name", "exercise_category"]
                    }
                  }
                },
                required: ["day_number", "title", "focus", "exercises"]
              }
            }
          },
          required: ["days"]
        }
      });

      if (!response?.days || response.days.length !== daysOfWeek) {
        throw new Error(`Esperado ${daysOfWeek} dias, recebeu ${response?.days?.length || 0}`);
      }

      setSelectedExercises(response);
      setStep(3);
    } catch (error) {
      console.error("Erro ao selecionar exercícios:", error);
      setError(error.message || 'Erro ao selecionar exercícios');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  // ETAPA 2: Aplicar técnicas
  const applyTechniques = async () => {
    if (!selectedExercises) return;

    setLoading(true);
    setStep(4);
    setError(null);

    try {
      const userLevel = user.fitness_level || 'intermediate';

      // Opções de técnicas por nível
      let techniqueOptions = '';
      
      if (userLevel === 'beginner') {
        techniqueOptions = `OPÇÕES DE TÉCNICAS - MÁXIMO 3 TÉCNICAS (feeder + 2 outras):

Opção 1: feeder + back_off (2 técnicas)
- Feeders (1º ex: 3, demais: 2)
- 2 back_off (12-15 reps, 120s cada)

Opção 2: feeder + working + back_off (3 técnicas)
- Feeders (1º ex: 3, demais: 2)
- 1 working (6-8 reps, 180s)
- 1 back_off (12-15 reps, 120s)

Opção 3: feeder + working (2 técnicas)
- Feeders (1º ex: 3, demais: 2)
- 2 working (6-8 reps, 180s cada)`;
      } else if (userLevel === 'intermediate') {
        techniqueOptions = `OPÇÕES DE TÉCNICAS - MÁXIMO 3 TÉCNICAS (feeder + 2 outras):

Opção 1: feeder + working + back_off (3 técnicas)
- Feeders (1º ex: 3, demais: 2)
- 1 working (6-8 reps, 180s)
- 1 back_off (12-15 reps, 120s)

Opção 2: feeder + working + drop_set (3 técnicas)
- Feeders (1º ex: 3, demais: 2)
- 1 working (6-8 reps, 180s)
- 1 drop_set (até falha, 120s)

Opção 3: feeder + cluster (2 técnicas)
- Feeders (1º ex: 3, demais: 2)
- 2 cluster (4-6 reps, 180s cada)

Opção 4: feeder + working + cluster (3 técnicas)
- Feeders (1º ex: 3, demais: 2)
- 1 working (6-8 reps, 180s)
- 1 cluster (4-6 reps, 180s)

Opção 5: feeder + muscle_round (2 técnicas)
- Feeders (1º ex: 3, demais: 2)
- 1 muscle_round (24 reps totais, 180s)`;
      } else { // advanced
        techniqueOptions = `OPÇÕES DE TÉCNICAS - MÁXIMO 3 TÉCNICAS (feeder + 2 outras):

Opção 1: feeder + top_set + back_off (3 técnicas)
- Feeders (1º ex: 3, demais: 2)
- 1 top_set (3-5 reps, 240s)
- 1 back_off (12-15 reps, 120s)

Opção 2: feeder + working + drop_set (3 técnicas)
- Feeders (1º ex: 3, demais: 2)
- 1 working (6-8 reps, 180s)
- 1 drop_set (até falha, 120s)

Opção 3: feeder + cluster + back_off (3 técnicas)
- Feeders (1º ex: 3, demais: 2)
- 1 cluster (4-6 reps, 180s)
- 1 back_off (12-15 reps, 120s)

Opção 4: feeder + top_set + cluster (3 técnicas)
- Feeders (1º ex: 3, demais: 2)
- 1 top_set (3-5 reps, 240s)
- 1 cluster (4-6 reps, 180s)

Opção 5: feeder + muscle_round + back_off (3 técnicas)
- Feeders (1º ex: 3, demais: 2)
- 1 muscle_round (24 reps totais, 180s)
- 1 back_off (12-15 reps, 120s)

Opção 6: feeder + working + muscle_round (3 técnicas)
- Feeders (1º ex: 3, demais: 2)
- 1 working (6-8 reps, 180s)
- 1 muscle_round (24 reps totais, 180s)

Opção 7: feeder + top_set + drop_set (3 técnicas)
- Feeders (1º ex: 3, demais: 2)
- 1 top_set (3-5 reps, 240s)
- 1 drop_set (até falha, 120s)`;
      }

      const prompt = `Aplique técnicas de treino aos exercícios.

NÍVEL: ${userLevel}

${techniqueOptions}

⚠️ REGRAS CRÍTICAS:
1. Título e descrição do treino devem ser em PORTUGUÊS
2. Escolha UMA opção de técnica para o TREINO INTEIRO (máximo 3 técnicas diferentes incluindo feeder e working)
3. MESMA estrutura de técnicas em TODOS os exercícios de TODOS os dias - o usuário precisa aprender fazendo repetidamente
4. DIFERENÇA NOS FEEDERS:
   - Exercício 1 de cada dia: 3 feeders (8-10, 5-7, 4-6)
   - Exercícios 2, 3, 4, 5, 6... de cada dia: 2 feeders (8-10, 5-7)
5. PROGRESSÃO DE CARGA: Todo exercício deve ter progressão de carga em cada série working/top/cluster

📋 EXEMPLO CORRETO - Treino com "feeder + 1 working + 1 drop_set + 1 back_off":

DIA 1 - Peito:
Ex 1 (PRIMEIRO DO DIA = 3 FEEDERS):
{"exercise_name":"Supino Reto","sets":[{"times":1,"reps":"8-10","rest_seconds":60,"set_type":"feeder"},{"times":1,"reps":"5-7","rest_seconds":60,"set_type":"feeder"},{"times":1,"reps":"4-6","rest_seconds":60,"set_type":"feeder"},{"times":1,"reps":"6-8","rest_seconds":180,"set_type":"working"},{"times":1,"reps":"8-12","rest_seconds":120,"set_type":"drop_set"},{"times":1,"reps":"12-15","rest_seconds":120,"set_type":"back_off"}]}

Ex 2 (DEMAIS = 2 FEEDERS):
{"exercise_name":"Supino Inclinado","sets":[{"times":1,"reps":"8-10","rest_seconds":60,"set_type":"feeder"},{"times":1,"reps":"5-7","rest_seconds":60,"set_type":"feeder"},{"times":1,"reps":"6-8","rest_seconds":180,"set_type":"working"},{"times":1,"reps":"8-12","rest_seconds":120,"set_type":"drop_set"},{"times":1,"reps":"12-15","rest_seconds":120,"set_type":"back_off"}]}

Ex 3 (DEMAIS = 2 FEEDERS):
{"exercise_name":"Crucifixo","sets":[{"times":1,"reps":"8-10","rest_seconds":60,"set_type":"feeder"},{"times":1,"reps":"5-7","rest_seconds":60,"set_type":"feeder"},{"times":1,"reps":"6-8","rest_seconds":180,"set_type":"working"},{"times":1,"reps":"8-12","rest_seconds":120,"set_type":"drop_set"},{"times":1,"reps":"12-15","rest_seconds":120,"set_type":"back_off"}]}

DIA 2 - Pernas:
Ex 1 (PRIMEIRO DO DIA = 3 FEEDERS):
{"exercise_name":"Agachamento","sets":[{"times":1,"reps":"8-10","rest_seconds":60,"set_type":"feeder"},{"times":1,"reps":"5-7","rest_seconds":60,"set_type":"feeder"},{"times":1,"reps":"4-6","rest_seconds":60,"set_type":"feeder"},{"times":1,"reps":"6-8","rest_seconds":180,"set_type":"working"},{"times":1,"reps":"8-12","rest_seconds":120,"set_type":"drop_set"},{"times":1,"reps":"12-15","rest_seconds":120,"set_type":"back_off"}]}

Ex 2 (DEMAIS = 2 FEEDERS):
{"exercise_name":"Leg Press","sets":[{"times":1,"reps":"8-10","rest_seconds":60,"set_type":"feeder"},{"times":1,"reps":"5-7","rest_seconds":60,"set_type":"feeder"},{"times":1,"reps":"6-8","rest_seconds":180,"set_type":"working"},{"times":1,"reps":"8-12","rest_seconds":120,"set_type":"drop_set"},{"times":1,"reps":"12-15","rest_seconds":120,"set_type":"back_off"}]}

Exercícios para aplicar:
${JSON.stringify(selectedExercises.days)}

Retorne em PORTUGUÊS.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            techniques_used: { type: "array", items: { type: "string" } },
            days: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day_number: { type: "number" },
                  title: { type: "string" },
                  focus: { type: "string" },
                  exercises: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        exercise_name: { type: "string" },
                        exercise_category: { type: "string" },
                        sets: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              times: { type: "number" },
                              reps: { type: "string" },
                              rest_seconds: { type: "number" },
                              set_type: { type: "string" },
                              notes: { type: "string" }
                            },
                            required: ["times", "reps", "rest_seconds", "set_type"]
                          }
                        },
                        notes: { type: "string" }
                      },
                      required: ["exercise_name", "exercise_category", "sets"]
                    }
                  }
                },
                required: ["day_number", "title", "focus", "exercises"]
              }
            }
          },
          required: ["title", "description", "techniques_used", "days"]
        }
      });

      setGeneratedWorkout(response);
      setStep(5);
    } catch (error) {
      console.error("Erro ao aplicar técnicas:", error);
      setError(error.message || 'Erro ao aplicar técnicas');
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setError(null);
    setSelectedExercises(null);
    setGeneratedWorkout(null);
    setStep(1);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const createdWorkout = await base44.entities.Workout.create({
        title: generatedWorkout.title,
        description: generatedWorkout.description,
        category: "full_body",
        difficulty: user.fitness_level,
        training_location: user.training_location,
        duration_minutes: 50,
        days: generatedWorkout.days,
        techniques_used: generatedWorkout.techniques_used || [],
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

      try {
        await base44.functions.invoke('syncUserProfile');
      } catch (e) {
        console.error('Erro ao sincronizar UserProfile:', e);
      }

      navigate(createPageUrl("Dashboard"));
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        
        {/* ETAPA 1: Tela inicial */}
        {step === 1 && (
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
                    <h3 className="text-white font-semibold mb-4 text-center">
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
                  <p className="text-blue-400 text-sm font-semibold mb-2">✨ Processo de Criação:</p>
                  <ul className="space-y-1 text-slate-300 text-sm">
                    <li>• Etapa 1: Seleção inteligente de exercícios</li>
                    <li>• Etapa 2: Aplicação de técnicas avançadas</li>
                    <li>• Resultado: Treino 100% personalizado</li>
                  </ul>
                </div>

                {error && (
                  <Card className="bg-red-900/20 border-red-800/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-red-400 font-semibold text-sm mb-1">Erro</p>
                          <p className="text-slate-300 text-sm">{error}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button
                  onClick={selectExercises}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-8 text-xl font-bold shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6 mr-2" />
                      Gerar Meu Treino com IA
                    </>
                  )}
                </Button>

                <p className="text-slate-500 text-xs text-center">
                  ⏱️ Processo em 2 etapas para máxima precisão
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ETAPA 2: Loading - Selecionando exercícios */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <Dumbbell className="w-10 h-10 text-white animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-white text-center mb-3">
                  Selecionando Exercícios
                </h3>
                <LoadingProgress message="🔍 Analisando seu perfil e escolhendo os melhores exercícios..." />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ETAPA 3: Exercícios selecionados - Revisar */}
        {step === 3 && selectedExercises && (
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
                  ✅ Exercícios Selecionados!
                </h2>
                <p className="text-slate-300 text-lg">
                  Revise os exercícios antes de aplicar as técnicas
                </p>
              </CardContent>
            </Card>

            {selectedExercises.days.map((day, idx) => (
              <Card key={idx} className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white text-lg">
                    📅 Dia {day.day_number} - {day.title}
                  </CardTitle>
                  <p className="text-slate-400 text-sm">{day.focus}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {day.exercises.map((ex, exIdx) => (
                      <div key={exIdx} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                        <div className="w-6 h-6 bg-blue-600/20 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-400 text-xs font-bold">{exIdx + 1}</span>
                        </div>
                        <p className="text-white font-medium">{ex.exercise_name}</p>
                        <Badge variant="outline" className="ml-auto text-slate-400 text-xs">
                          {ex.exercise_category}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={loading}
                className="flex-1 border-slate-700 text-slate-300 py-6"
              >
                Refazer Seleção
              </Button>
              <Button
                onClick={applyTechniques}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 py-6 text-lg font-bold"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Aplicar Técnicas
              </Button>
            </div>
          </motion.div>
        )}

        {/* ETAPA 4: Loading - Aplicando técnicas */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <Dumbbell className="w-10 h-10 text-white animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-white text-center mb-3">
                  Aplicando Técnicas de Treino
                </h3>
                <LoadingProgress message="🎯 Configurando séries, repetições e descanso ideais..." />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ETAPA 5: Treino completo */}
        {step === 5 && generatedWorkout && (
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
                {generatedWorkout.techniques_used?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-slate-500 text-sm">Técnicas:</span>
                    {generatedWorkout.techniques_used.map((tech, i) => {
                      const techLabels = {
                        back_off_set: "Back Off",
                        drop_set: "Drop Set",
                        cluster_set: "Cluster",
                        muscle_round: "Muscle Round",
                        top_set: "Top Set"
                      };
                      return (
                        <Badge key={i} variant="outline" className="text-purple-400 border-purple-700">
                          {techLabels[tech] || tech}
                        </Badge>
                      );
                    })}
                  </div>
                )}
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
                    {day.exercises.map((ex, exIdx) => {
                      const setTypeLabels = {
                        feeder: "🎯 Feeder",
                        working: "💪 Working",
                        back_off: "⬇️ Back Off",
                        cluster: "🔗 Cluster",
                        muscle_round: "🔄 M.Round",
                        top_set: "🏆 Top",
                        drop_set: "🔥 Drop"
                      };
                      const setTypeColors = {
                        feeder: "bg-yellow-900/50 text-yellow-300 border-yellow-700/50",
                        working: "bg-blue-900/50 text-blue-300 border-blue-700/50",
                        back_off: "bg-green-900/50 text-green-300 border-green-700/50",
                        cluster: "bg-purple-900/50 text-purple-300 border-purple-700/50",
                        muscle_round: "bg-pink-900/50 text-pink-300 border-pink-700/50",
                        top_set: "bg-red-900/50 text-red-300 border-red-700/50",
                        drop_set: "bg-orange-900/50 text-orange-300 border-orange-700/50"
                      };

                      return (
                        <div key={exIdx} className="bg-slate-800/50 p-3 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-600/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-blue-400 text-xs font-bold">{exIdx + 1}</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-medium mb-1">{ex.exercise_name}</p>
                              <div className="flex flex-wrap gap-1.5 text-xs">
                                {ex.sets.map((set, setIdx) => (
                                  <span 
                                    key={setIdx} 
                                    className={`px-2 py-1 rounded border ${
                                      set.set_type 
                                        ? setTypeColors[set.set_type] || "bg-slate-700/50 text-slate-300"
                                        : "bg-slate-700/50 text-slate-300"
                                    }`}
                                  >
                                    {set.set_type && setTypeLabels[set.set_type] ? `${setTypeLabels[set.set_type]} ` : ''}
                                    {set.times || 1}x{set.reps}
                                  </span>
                                ))}
                              </div>
                              {ex.notes && (
                                <p className="text-slate-500 text-xs mt-2">💡 {ex.notes}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              onClick={handleComplete}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 py-8 text-xl font-bold"
            >
              {loading ? (
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