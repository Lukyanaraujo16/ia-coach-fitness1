import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Loader2, Check, Sparkles, AlertTriangle, RefreshCw, ArrowLeftRight } from "lucide-react";
import { motion } from "framer-motion";

export default function WorkoutSetup() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [generatingWorkout, setGeneratingWorkout] = useState(false);
  const [generatedWorkout, setGeneratedWorkout] = useState(null);
  const [error, setError] = useState(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [shouldRetry, setShouldRetry] = useState(false);
  const [swappingExercise, setSwappingExercise] = useState(null); // {dayIndex, exerciseIndex}
  const [swapLoading, setSwapLoading] = useState(false);
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
          navigate(createPageUrl("Dashboard"));
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
      const userLevel = user.fitness_level || 'intermediate';

      // Técnicas por nível
      const techniquesByLevel = {
        beginner: {
          allowed: ["feeder_set", "working_set", "back_off_set"],
          forbidden: ["drop_set", "cluster_set", "muscle_round", "top_set"],
          description: "Use apenas Feeder Sets, Working Sets e opcionalmente Back Off Sets. PROIBIDO usar Drop Set, Cluster Set, Muscle Round ou Top Set."
        },
        intermediate: {
          allowed: ["feeder_set", "working_set", "back_off_set", "drop_set", "cluster_set", "muscle_round"],
          forbidden: ["top_set"],
          description: "Use Feeder Sets, Working Sets, Back Off Sets. Pode usar Drop Set (máx 1 por treino) e Cluster Set OU Muscle Round (máx 1 por treino). PROIBIDO usar Top Set."
        },
        advanced: {
          allowed: ["feeder_set", "working_set", "back_off_set", "drop_set", "cluster_set", "muscle_round", "top_set"],
          forbidden: [],
          description: "Pode usar todas as técnicas. Use máximo 2 técnicas avançadas por treino para não ultrapassar capacidade de recuperação."
        }
      };

      const levelTechniques = techniquesByLevel[userLevel] || techniquesByLevel.intermediate;

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

      const userObservations = user.workout_observations || "";

      const prompt = `Você é um personal trainer experiente criando um programa de treino COMPLETO usando metodologia avançada de periodização.

  PERFIL DO ALUNO:
  - Nome: ${user.nome_completo}
  - Gênero: ${userGender === 'male' ? 'Masculino' : userGender === 'female' ? 'Feminino' : 'Outro'}
  - Objetivo: ${goalLabels[user.fitness_goal]}
  - Nível: ${levelLabels[userLevel]}
  - Local: ${locationLabels[user.training_location]}
  - Meta semanal: ${daysOfWeek} treinos/semana
  - Peso atual: ${user.current_weight}kg
  - Meta de peso: ${user.weight_goal}kg
  ${userObservations ? `\n⚠️ OBSERVAÇÕES IMPORTANTES DO ALUNO:\n${userObservations}\n\nVocê DEVE respeitar estas observações! Se o aluno tem lesão, NÃO inclua exercícios que afetem essa região.` : ''}

  ═══════════════════════════════════════════════════════════════
  🏋️ METODOLOGIA DE TREINO - REGRAS OBRIGATÓRIAS
  ═══════════════════════════════════════════════════════════════

  📌 DEFINIÇÕES DAS TÉCNICAS:

  1. FEEDER SET (Série de Reconhecimento) - OBRIGATÓRIA EM TODO EXERCÍCIO
  - Séries preparatórias, LONGE da falha
  - Primeiro exercício do dia: 3 feeder sets
  - Demais exercícios: 2 feeder sets
  - Reps: Feeder 1 = 8-10 reps, Feeder 2 = 5-7 reps, Feeder 3 = 3-5 reps
  - Descanso: 60-90 segundos
  - set_type: "feeder"
  - notes: "Série de reconhecimento - avalie se pode progredir carga hoje"

  2. WORKING SET (Série de Trabalho)
  - 4 a 9 repetições
  - Deixe 1-2 reps na reserva
  - set_type: "working"
  - notes: "Série principal - tente progredir carga semanalmente"

  3. BACK OFF SET
  - 20% menos carga que working set
  - 10-15 repetições
  - set_type: "back_off"
  - notes: "Back off: reduza 20% da carga do working set"

  4. CLUSTER SET
  - Mesma carga do working set
  - 12-15 reps totais em blocos de 3 reps com 10s descanso
  - set_type: "cluster"
  - notes: "Cluster: 3 reps, 10s descanso, repita até 12-15 total"

  5. MUSCLE ROUND
  - 24 reps totais: 6 blocos de 4 reps com 10s descanso
  - set_type: "muscle_round"
  - notes: "Muscle Round: 4 reps, 10s descanso, 6 blocos = 24 total"

  6. TOP SET
  - ~80% do 1RM, 2-4 reps (APENAS AVANÇADO)
  - set_type: "top_set"
  - notes: "Top Set: carga alta, só faça se estiver bem descansado"

  7. DROP SET
  - Falha, reduz carga, falha, repete 2-3x
  - set_type: "drop_set"
  - notes: "Drop Set: vá até a falha, reduza carga e repita"

  📌 REGRAS PARA NÍVEL ${userLevel.toUpperCase()}:
  ${levelTechniques.description}
  - Técnicas permitidas: ${levelTechniques.allowed.join(", ")}
  ${levelTechniques.forbidden.length > 0 ? `- PROIBIDO: ${levelTechniques.forbidden.join(", ")}` : ''}

  📌 DESCANSO:
  - Feeder sets: 60-90 segundos
  - Músculo pequeno (bíceps, tríceps, ombros, core): 120-180 segundos
  - Músculo grande (peito, costas, pernas): 180-300 segundos

  📌 ESTRUTURA OBRIGATÓRIA DE CADA EXERCÍCIO:
  - PRIMEIRO exercício do dia: 3 Feeder Sets + Working Sets + outras técnicas
  - DEMAIS exercícios: 2 Feeder Sets + Working Sets + outras técnicas
  - Escolha no máximo 3 técnicas diferentes (além de feeder e working) para o treino INTEIRO
  - Use as MESMAS técnicas em todos os dias para o aluno aprender

  📌 PROGRESSÃO DE CARGA:
  - TODA série de trabalho deve ter orientação de progressão no campo notes
  - Ex: "Tente aumentar 1-2kg esta semana" ou "Mantenha carga e melhore execução"

  ═══════════════════════════════════════════════════════════════

  ⚠️ REGRA CRÍTICA: Crie EXATAMENTE ${daysOfWeek} dias de treino.

  DISTRIBUIÇÃO (para ${userGender === 'female' ? 'MULHERES' : 'HOMENS'}):
  ${divisionList.map((day, i) => `${day} (day_number: ${i + 1})`).join('\n')}

  EXEMPLO DE ESTRUTURA DE UM EXERCÍCIO (primeiro do dia):
  {
  "exercise_name": "Supino Reto",
  "exercise_category": "chest",
  "sets": [
  {"times": 1, "reps": "9", "rest_seconds": 90, "set_type": "feeder", "notes": "Feeder 1 - carga leve, avalie o dia"},
  {"times": 1, "reps": "6", "rest_seconds": 90, "set_type": "feeder", "notes": "Feeder 2 - aumente carga progressivamente"},
  {"times": 1, "reps": "4", "rest_seconds": 90, "set_type": "feeder", "notes": "Feeder 3 - próximo da carga de trabalho"},
  {"times": 1, "reps": "6-8", "rest_seconds": 180, "set_type": "working", "notes": "Working Set - tente progredir 1-2kg"},
  {"times": 2, "reps": "12-15", "rest_seconds": 180, "set_type": "back_off", "notes": "Back Off - reduza 20% da carga"}
  ]
  }

  EXEMPLO DE EXERCÍCIO (demais exercícios do dia):
  {
  "exercise_name": "Crucifixo",
  "exercise_category": "chest",
  "sets": [
  {"times": 1, "reps": "9", "rest_seconds": 90, "set_type": "feeder", "notes": "Feeder 1 - reconhecimento de carga"},
  {"times": 1, "reps": "5", "rest_seconds": 90, "set_type": "feeder", "notes": "Feeder 2 - prepare para working set"},
  {"times": 1, "reps": "6-8", "rest_seconds": 180, "set_type": "working", "notes": "Working Set - progrida carga se possível"},
  {"times": 2, "reps": "12-15", "rest_seconds": 180, "set_type": "back_off", "notes": "Back Off - 20% menos carga"}
  ]
  }

  IMPORTANTE:
  - Cada dia deve ter 5-7 exercícios
  - set_type é OBRIGATÓRIO em cada série
  - notes é OBRIGATÓRIO em cada série com orientação clara
  - ${daysOfWeek} dias, numerados de 1 a ${daysOfWeek}, SEM EXCEÇÃO!`;

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
              description: "Descrição explicando a abordagem e as técnicas utilizadas"
            },
            techniques_used: {
              type: "array",
              items: { type: "string" },
              description: "Lista das técnicas utilizadas no treino (ex: back_off_set, drop_set, cluster_set)"
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
                    minItems: 5,
                    maxItems: 7,
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
                          maxItems: 7,
                          items: {
                            type: "object",
                            properties: {
                              times: {
                                type: "number",
                                minimum: 1,
                                maximum: 5,
                                description: "Quantas vezes fazer esta série"
                              },
                              reps: {
                                type: "string",
                                description: "Repetições (ex: 12, 10-12, máximo)"
                              },
                              rest_seconds: {
                                type: "number",
                                description: "Descanso em segundos"
                              },
                              set_type: {
                                type: "string",
                                enum: ["feeder", "working", "back_off", "cluster", "muscle_round", "top_set", "drop_set"],
                                description: "Tipo da série"
                              },
                              notes: {
                                type: "string",
                                description: "Orientação sobre a série e progressão"
                              }
                            },
                            required: ["times", "reps", "rest_seconds", "set_type", "notes"]
                          }
                        },
                        notes: {
                          type: "string",
                          description: "Observações sobre execução do exercício"
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
          required: ["title", "description", "techniques_used", "days"]
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

  const handleSwapExercise = async (dayIndex, exerciseIndex) => {
    const day = generatedWorkout.days[dayIndex];
    const exercise = day.exercises[exerciseIndex];
    
    // Lista de todos os exercícios do dia atual para evitar repetição
    const exercisesInDay = day.exercises.map(ex => ex.exercise_name);
    
    setSwapLoading(true);
    try {
      const userObservations = user.workout_observations || "";
      
      const prompt = `Você é um personal trainer. Preciso de um exercício ALTERNATIVO para substituir "${exercise.exercise_name}" no treino.

CONTEXTO:
- Dia do treino: ${day.title}
- Foco do dia: ${day.focus}
- Categoria do exercício atual: ${exercise.exercise_category}
- Local de treino: ${user.training_location === 'gym' ? 'academia' : 'casa'}
- Nível do aluno: ${user.fitness_level}
${userObservations ? `- Observações do aluno: ${userObservations}` : ''}

EXERCÍCIOS JÁ EXISTENTES NO TREINO (NÃO PODE REPETIR NENHUM DELES NEM VARIAÇÕES):
${exercisesInDay.map(name => `- ${name}`).join('\n')}

REGRAS OBRIGATÓRIAS:
1. O exercício alternativo DEVE trabalhar o mesmo grupo muscular que "${exercise.exercise_name}"
2. PROIBIDO: Não pode ser igual ou similar a nenhum exercício já listado acima
3. PROIBIDO: Variações do mesmo exercício (ex: se tem "Cadeira Extensora", não pode sugerir "Cadeira Extensora Unipodal")
4. Deve ser um exercício COMPLETAMENTE DIFERENTE mas que trabalhe os mesmos músculos
5. Deve ser adequado para ${user.training_location === 'gym' ? 'academia' : 'casa'}
6. Mantenha a mesma estrutura de séries

Retorne APENAS o novo exercício no formato JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
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
                  rest_seconds: { type: "number" }
                },
                required: ["times", "reps", "rest_seconds"]
              }
            },
            notes: { type: "string" }
          },
          required: ["exercise_name", "exercise_category", "sets"]
        }
      });

      // Atualizar o treino gerado com o novo exercício
      const updatedWorkout = { ...generatedWorkout };
      updatedWorkout.days[dayIndex].exercises[exerciseIndex] = response;
      setGeneratedWorkout(updatedWorkout);
      setSwappingExercise(null);
    } catch (error) {
      console.error("Erro ao trocar exercício:", error);
      alert("Erro ao gerar exercício alternativo. Tente novamente.");
    } finally {
      setSwapLoading(false);
    }
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

      // Sincronizar UserProfile para o agente WhatsApp
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
                  <p className="text-blue-400 text-sm font-semibold mb-2">✨ O que será criado:</p>
                  <ul className="space-y-1 text-slate-300 text-sm">
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
                            <div className="flex items-start justify-between">
                              <p className="text-white font-medium mb-1">{ex.exercise_name}</p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSwappingExercise({ dayIndex: idx, exerciseIndex: exIdx })}
                                className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/30 h-7 px-2"
                              >
                                <ArrowLeftRight className="w-3 h-3 mr-1" />
                                <span className="text-xs">Trocar</span>
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                              {ex.sets.map((set, setIdx) => (
                                <span key={setIdx} className="bg-slate-700/50 px-2 py-1 rounded">
                                  {set.times || 1}x {set.reps} ({set.rest_seconds}s)
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

        {/* Modal de Troca de Exercício */}
        {swappingExercise && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="bg-slate-900 border-slate-800 max-w-md w-full">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto">
                  <ArrowLeftRight className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Trocar Exercício?</h3>
                  <p className="text-slate-400 text-sm mb-2">
                    Exercício atual:
                  </p>
                  <p className="text-white font-semibold">
                    {generatedWorkout.days[swappingExercise.dayIndex].exercises[swappingExercise.exerciseIndex].exercise_name}
                  </p>
                </div>
                <p className="text-slate-500 text-sm">
                  A IA vai sugerir um exercício alternativo que trabalha o mesmo grupo muscular.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSwappingExercise(null)}
                    disabled={swapLoading}
                    className="flex-1 border-slate-700 text-slate-300"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => handleSwapExercise(swappingExercise.dayIndex, swappingExercise.exerciseIndex)}
                    disabled={swapLoading}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {swapLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Trocar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}