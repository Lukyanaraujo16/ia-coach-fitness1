
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Play, Pause, SkipForward, CheckCircle, Plus, Minus, AlertTriangle, Trophy, Clock, Zap, X, Lightbulb, Weight, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function WorkoutExecution() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const workoutId = urlParams.get('id');
  const dayNumber = parseInt(urlParams.get('day')) || 1;

  const [workout, setWorkout] = useState(null);
  const [currentDay, setCurrentDay] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exercisesData, setExercisesData] = useState([]);
  const [skippedExercises, setSkippedExercises] = useState([]);
  const [restTime, setRestTime] = useState(60);
  const [isResting, setIsResting] = useState(false);
  const [restStartTime, setRestStartTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [showCaloriesInput, setShowCaloriesInput] = useState(false);
  const [caloriesInput, setCaloriesInput] = useState("");
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [user, setUser] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [showAITips, setShowAITips] = useState(false);
  const [aiTips, setAiTips] = useState(null);
  const [showAISuggestion, setShowAISuggestion] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [isAnalyzingPerformance, setIsAnalyzingPerformance] = useState(false);
  const abortControllerRef = useRef(null);

  const isPremium = user?.subscription_status === 'premium';

  useEffect(() => {
    const loadWorkout = async () => {
      if (workoutId) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setStartTime(new Date());
        
        // Carregar histórico de treinos para análise
        const allLogs = await base44.entities.WorkoutLog.list('-date');
        const userLogs = allLogs.filter(log => log.created_by === currentUser.email);
        setWorkoutLogs(userLogs);
        
        const workouts = await base44.entities.Workout.list();
        const foundWorkout = workouts.find(w => w.id === workoutId);
        setWorkout(foundWorkout);
        
        if (foundWorkout?.days) {
          const day = foundWorkout.days.find(d => d.day_number === dayNumber);
          setCurrentDay(day);
          
          // Inicializar dados dos exercícios (apenas peso)
          if (day?.exercises) {
            const initialData = day.exercises.map(ex => ({
              exercise_id: ex.exercise_id || '',
              exercise_name: ex.exercise_name,
              exercise_category: ex.exercise_category || '',
              sets_completed: ex.sets.map((set, idx) => ({
                set_number: idx + 1,
                reps_completed: parseInt(set.reps) || 0,
                weight_used: 0,
                notes: ''
              }))
            }));
            setExercisesData(initialData);
          }
          
          if (day?.exercises?.[0]?.sets?.[0]?.rest_seconds) {
            const firstRest = day.exercises[0].sets[0].rest_seconds;
            setRestTime(firstRest);
            setTimeRemaining(firstRest);
          }
        }
      }
    };
    loadWorkout();
  }, [workoutId, dayNumber]);

  // Análise automática ao mudar de exercício - COM ABORT CONTROLLER
  useEffect(() => {
    const currentExercise = currentDay?.exercises?.[currentExerciseIndex];
    
    if (!currentExercise || !isPremium || workoutLogs.length === 0) {
      return;
    }

    // Cancelar análise anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Criar novo abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Delay de 800ms para evitar análises quando usuário muda rápido
    const timer = setTimeout(() => {
      if (!signal.aborted) {
        analyzeExercisePerformance(currentExercise, signal);
      }
    }, 800);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [currentExerciseIndex, isPremium, workoutLogs.length, currentDay]);


  // Timer com controle baseado em timestamp real
  useEffect(() => {
    let interval;
    
    if (isResting && restStartTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - restStartTime) / 1000);
        const remaining = restTime - elapsed;
        
        if (remaining <= 0) {
          setTimeRemaining(0);
          setIsResting(false);
          setRestStartTime(null);
        } else {
          setTimeRemaining(remaining);
        }
      }, 100); // Atualiza a cada 100ms para mais precisão
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isResting, restStartTime, restTime]);

  const analyzeExercisePerformance = async (exercise, signal) => {
    if (!exercise || isAnalyzingPerformance) {
      return;
    }

    setIsAnalyzingPerformance(true);
    
    try {
      // Verificar se foi abortado antes de começar
      if (signal?.aborted) {
        setIsAnalyzingPerformance(false);
        return;
      }

      // Encontrar histórico deste exercício
      const exerciseHistory = workoutLogs
        .flatMap(log => log.exercises_completed || [])
        .filter(ex => ex.exercise_name === exercise.exercise_name)
        .slice(0, 5); // Últimos 5 registros

      if (exerciseHistory.length < 2) {
        setShowAISuggestion(false); 
        setAiSuggestion(null);
        setIsAnalyzingPerformance(false);
        return; 
      }

      // Verificar novamente antes da chamada à API
      if (signal?.aborted) {
        setIsAnalyzingPerformance(false);
        return;
      }

      // Analisar progressão de carga
      const recentWeights = exerciseHistory.map(ex => {
        const maxWeight = ex.sets_completed?.reduce((max, set) => 
          set.weight_used > max ? set.weight_used : max, 0
        ) || 0;
        return maxWeight;
      });

      const lastWeight = recentWeights[0];
      const hasProgressedRecently = recentWeights[0] > recentWeights[1];
      const isStagnant = recentWeights.slice(0, 3).every(w => w === lastWeight && w > 0);

      const prompt = `Você é um personal trainer analisando o desempenho de um atleta no exercício "${exercise.exercise_name}".

**Histórico de cargas (últimas 5 execuções):**
${recentWeights.map((w, i) => `${i + 1}. ${w}kg`).join('\n')}

**Situação atual:**
- Última carga: ${lastWeight}kg
- Progrediu recentemente: ${hasProgressedRecently ? 'Sim' : 'Não'}
- Está estagnado: ${isStagnant ? 'Sim (mesma carga há 3+ treinos)' : 'Não'}

**Tarefa:**
Se houver uma sugestão importante (aumentar carga, mudar estratégia, parabéns por progresso), retorne em JSON:
{
  "show_suggestion": true/false,
  "type": "progress/stagnant/warning/congratulations",
  "title": "Título curto e motivador",
  "message": "Mensagem clara e específica (1-2 frases)",
  "suggestion": "Ação específica a tomar"
}

Se NÃO houver sugestão relevante, retorne: {"show_suggestion": false}

IMPORTE: Só mostre sugestão se for realmente relevante. Não seja repetitivo.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            show_suggestion: { type: "boolean" },
            type: { type: "string" },
            title: { type: "string" },
            message: { type: "string" },
            suggestion: { type: "string" }
          }
        }
      });

      // Verificar se foi abortado após a chamada
      if (signal?.aborted) {
        setIsAnalyzingPerformance(false);
        return;
      }

      if (response.show_suggestion) {
        setAiSuggestion(response);
        setShowAISuggestion(true);
      } else {
        setShowAISuggestion(false);
        setAiSuggestion(null);
      }
    } catch (error) {
      // Silenciosamente ignorar erros de abort
      if (error.message?.includes('aborted') || error.message?.includes('abort') || error.name === 'AbortError') {
        // Não fazer nada - é esperado
      } else {
        console.error("Error analyzing performance:", error);
      }
      setShowAISuggestion(false);
      setAiSuggestion(null);
    } finally {
      setIsAnalyzingPerformance(false);
    }
  };

  const createWorkoutLogMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkoutLog.create(data),
    onSuccess: async () => {
      queryClient.invalidateQueries(['workout-logs']);
      
      const completedDays = user?.completed_workout_days || [];
      if (!completedDays.includes(dayNumber)) {
        completedDays.push(dayNumber);
      }
      
      const totalDays = workout?.days?.length || 1;
      const nextDay = dayNumber >= totalDays ? 1 : dayNumber + 1;
      
      await base44.auth.updateMe({
        current_workout_day: nextDay,
        completed_workout_days: completedDays,
      });
      
      setEndTime(new Date());
    },
  });

  const updateSetData = (exerciseIndex, setIndex, field, value) => {
    const newData = [...exercisesData];
    if (newData[exerciseIndex] && newData[exerciseIndex].sets_completed[setIndex]) {
      newData[exerciseIndex].sets_completed[setIndex][field] = value;
      setExercisesData(newData);
    }
  };

  // Nova função para gerar dicas de IA
  const generateAITips = async (exercise) => {
    if (!exercise || !isPremium) return;
    
    try {
      const prompt = `Você é um personal trainer. Forneça dicas rápidas e práticas sobre o exercício "${exercise.exercise_name}".

Responda em JSON com:
{
  "dicas_execucao": ["dica 1", "dica 2", "dica 3"],
  "erros_comuns": ["erro 1", "erro 2"],
  "dica_rapida": "Uma frase motivacional sobre o exercício"
}

Seja direto, prático e motivador.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            dicas_execucao: { type: "array", items: { type: "string" } },
            erros_comuns: { type: "array", items: { type: "string" } },
            dica_rapida: { type: "string" }
          }
        }
      });

      setAiTips(response);
      setShowAITips(true);
    } catch (error) {
      console.error("Error generating AI tips:", error);
    }
  };

  if (!workout || !currentDay) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  const currentExercise = currentDay.exercises?.[currentExerciseIndex];
  const isLastExercise = currentExerciseIndex === (currentDay.exercises?.length || 0) - 1;

  const handleStartRest = () => {
    setIsResting(true);
    setRestStartTime(Date.now());
    setTimeRemaining(restTime);
  };

  const handlePauseRest = () => {
    if (isResting && restStartTime) {
      // Calcula quanto tempo já passou
      const now = Date.now();
      const elapsed = Math.floor((now - restStartTime) / 1000);
      const remaining = restTime - elapsed;
      
      // Atualiza o restTime para ser o tempo restante
      setRestTime(Math.max(remaining, 0));
      setTimeRemaining(Math.max(remaining, 0));
      setIsResting(false);
      setRestStartTime(null);
    }
  };

  const handleNextExercise = () => {
    setIsResting(false);
    setRestStartTime(null);
    setShowAISuggestion(false); // Close AI suggestion when moving to next exercise
    setAiSuggestion(null); // Clear suggestion

    if (isLastExercise) {
      if (skippedExercises.length > 0) {
        setShowSkipWarning(true);
      } else {
        setShowCaloriesInput(true);
      }
    } else {
      const nextExercise = currentDay.exercises[currentExerciseIndex + 1];
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      if (nextExercise?.sets?.[0]?.rest_seconds) {
        const nextRest = nextExercise.sets[0].rest_seconds; 
        setRestTime(nextRest);
        setTimeRemaining(nextRest);
      }
    }
  };

  const handleSkipExercise = () => {
    if (!skippedExercises.includes(currentExerciseIndex)) {
      setSkippedExercises([...skippedExercises, currentExerciseIndex]);
    }
    handleNextExercise();
  };

  const handleFinishWithSkipped = () => {
    setShowSkipWarning(false);
    setShowCaloriesInput(true);
  };

  const handleFinishWorkout = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const localDate = `${year}-${month}-${day}`;

    const durationMinutes = endTime && startTime 
      ? Math.round((endTime - startTime) / 1000 / 60)
      : workout.duration_minutes;

    // Filtrar exercícios completados (não pulados)
    const completedExercises = exercisesData.filter((_, idx) => !skippedExercises.includes(idx));

    createWorkoutLogMutation.mutate({
      workout_id: workout.id,
      workout_title: `${workout.title} - Dia ${dayNumber}`,
      date: localDate,
      duration_minutes: durationMinutes,
      calories_burned: caloriesInput ? parseInt(caloriesInput) : undefined,
      exercises_completed: completedExercises,
      notes: skippedExercises.length > 0 ? `${skippedExercises.length} exercícios pulados` : "",
    });
  };

  const adjustRestTime = (delta) => {
    const newTime = Math.max(30, restTime + delta);
    setRestTime(newTime);
    if (!isResting) {
      setTimeRemaining(newTime);
    }
  };

  const handleExitWorkout = () => {
    setShowExitConfirm(true);
  };

  const confirmExitWorkout = () => {
    navigate(createPageUrl("WorkoutDetail") + `?id=${workoutId}`);
  };

  // Exit Confirmation Modal
  if (showExitConfirm) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
        <Card className="bg-slate-900 border-slate-800 max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-orange-600/20 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                Interromper Treino?
              </h3>
              <p className="text-slate-400 text-sm">
                Você realmente deseja sair do treino? Seu progresso não será salvo.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700"
              >
                Continuar Treino
              </Button>
              <Button
                onClick={confirmExitWorkout}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Skip Warning Modal
  if (showSkipWarning) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="bg-slate-900/50 border-slate-800 max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-orange-600/20 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Atenção!</h2>
              <p className="text-slate-400 text-sm">
                Você pulou {skippedExercises.length} exercício(s). 
                Tem certeza que deseja finalizar?
              </p>
            </div>
            
            <div className="space-y-2">
              <Button
                onClick={() => setShowSkipWarning(false)}
                variant="outline"
                className="w-full border-slate-700 text-slate-300"
              >
                Voltar
              </Button>
              <Button
                onClick={handleFinishWithSkipped}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Finalizar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completion Screen
  if (showCaloriesInput && endTime) {
    const duration = Math.round((endTime - startTime) / 1000 / 60);
    const startTimeStr = startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const endTimeStr = endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const motivationalMessages = [
      "Você é incrível! Mais um treino concluído! 💪",
      "Parabéns guerreiro(a)! Cada treino te aproxima do seu objetivo! 🔥",
      "Sensacional! Você está destruindo! 🚀",
      "Que treino poderoso! Orgulho de você! 💯",
      "Imparável! Continue assim! ⚡",
    ];
    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border-green-700/50 max-w-md w-full">
            <CardContent className="p-6 text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center mx-auto"
              >
                <Trophy className="w-10 h-10 text-green-400" />
              </motion.div>
              
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Treino Concluído! 🎉</h2>
                <p className="text-green-400 font-semibold mb-2">{randomMessage}</p>
                <p className="text-slate-400 text-sm">Dia {dayNumber} - {workout.title}</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-900/50 rounded-lg p-2">
                  <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                  <p className="text-slate-400 text-xs">Início</p>
                  <p className="text-white font-bold text-sm">{startTimeStr}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mx-auto mb-1" />
                  <p className="text-slate-400 text-xs">Fim</p>
                  <p className="text-white font-bold text-sm">{endTimeStr}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2">
                  <Zap className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                  <p className="text-slate-400 text-xs">Duração</p>
                  <p className="text-white font-bold text-sm">{duration}min</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Calorias Gastas (opcional)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 350"
                  value={caloriesInput}
                  onChange={(e) => setCaloriesInput(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white text-center h-12"
                />
              </div>

              <Button
                onClick={handleFinishWorkout}
                disabled={createWorkoutLogMutation.isPending}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 h-12 font-bold"
              >
                {createWorkoutLogMutation.isPending ? "Salvando..." : "Finalizar e Salvar"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (showCaloriesInput && !endTime) {
    setEndTime(new Date());
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-slate-950 to-slate-900 z-[60]">
      {/* Header Fixo */}
      <div className="flex-shrink-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExitWorkout}
            className="text-slate-400 hover:text-white h-8 w-8"
          >
            <X className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <p className="text-slate-400 text-xs">Dia {dayNumber}</p>
            <p className="text-white font-bold text-xs">
              Exercício {currentExerciseIndex + 1}/{currentDay.exercises?.length || 0}
            </p>
          </div>
          {/* Botão de Dicas IA */}
          {user && isPremium ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => generateAITips(currentExercise)}
              className="text-purple-400 hover:text-purple-300 h-8 w-8"
            >
              <Lightbulb className="w-5 h-5" />
            </Button>
          ) : (
            <div className="w-8" />
          )}
        </div>
      </div>

      {/* Nome do Exercício - Fixo */}
      <div className="flex-shrink-0 text-center px-3 py-2 border-b border-slate-800 bg-slate-900/50">
        <h2 className="text-base font-bold text-white leading-tight">
          {currentExercise?.exercise_name}
        </h2>
        {currentExercise?.notes && (
          <p className="text-slate-400 text-xs mt-0.5">💡 {currentExercise.notes}</p>
        )}
      </div>

      {/* AI Suggestion Modal (Automático) */}
      {showAISuggestion && aiSuggestion && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={() => setShowAISuggestion(false)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full"
          >
            <Card className={`bg-slate-900 border-2 ${
              aiSuggestion.type === 'congratulations' ? 'border-green-600' :
              aiSuggestion.type === 'stagnant' ? 'border-orange-600' :
              aiSuggestion.type === 'warning' ? 'border-red-600' :
              'border-blue-600'
            }`}>
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  {aiSuggestion.type === 'congratulations' && <Trophy className="w-5 h-5 text-green-400" />}
                  {aiSuggestion.type === 'stagnant' && <TrendingUp className="w-5 h-5 text-orange-400" />}
                  {aiSuggestion.type === 'warning' && <AlertTriangle className="w-5 h-5 text-red-400" />}
                  {aiSuggestion.type === 'progress' && <Zap className="w-5 h-5 text-blue-400" />}
                  {aiSuggestion.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 text-sm leading-relaxed">
                  {aiSuggestion.message}
                </p>

                <div className={`p-3 rounded-lg ${
                  aiSuggestion.type === 'congratulations' ? 'bg-green-900/30 border border-green-700/50' :
                  aiSuggestion.type === 'stagnant' ? 'bg-orange-900/30 border border-orange-700/50' :
                  aiSuggestion.type === 'warning' ? 'bg-red-900/30 border border-red-700/50' :
                  'bg-blue-900/30 border border-blue-700/50'
                }`}>
                  <p className="text-white text-sm font-semibold mb-1">💡 Sugestão:</p>
                  <p className="text-slate-200 text-sm">{aiSuggestion.suggestion}</p>
                </div>

                <Button
                  onClick={() => setShowAISuggestion(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Entendi, vamos lá!
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* AI Tips Modal */}
      {showAITips && aiTips && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={() => setShowAITips(false)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full"
          >
            <Card className="bg-slate-900 border-purple-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  Dicas do Treinador IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Dicas de Execução */}
                <div>
                  <h4 className="text-green-400 font-semibold mb-2 text-sm">✓ Como Executar:</h4>
                  <ul className="space-y-1">
                    {aiTips.dicas_execucao?.map((dica, index) => (
                      <li key={index} className="text-slate-300 text-xs flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>{dica}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Erros Comuns */}
                <div>
                  <h4 className="text-orange-400 font-semibold mb-2 text-sm">⚠️ Evite:</h4>
                  <ul className="space-y-1">
                    {aiTips.erros_comuns?.map((erro, index) => (
                      <li key={index} className="text-slate-300 text-xs flex items-start gap-2">
                        <span className="text-orange-400 mt-0.5">•</span>
                        <span>{erro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Dica Rápida */}
                <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-3">
                  <p className="text-purple-300 text-sm italic text-center">
                    💪 {aiTips.dica_rapida}
                  </p>
                </div>

                <Button
                  onClick={() => setShowAITips(false)}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Entendi!
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Séries - Área Rolável APENAS COM PESO */}
      <div className="flex-1 overflow-y-auto px-3 py-2" style={{ minHeight: 0 }}>
        <div className="space-y-2 pb-2">
          {currentExercise?.sets?.map((set, index) => (
            <div
              key={index}
              className="w-full p-3 rounded-lg border-2 border-slate-700 bg-slate-800/50"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-bold text-sm">Série {index + 1}</span>
                  {set.times > 1 && (
                    <span className="text-yellow-400 text-xs font-bold bg-yellow-900/30 px-2 py-1 rounded">
                      Fazer {set.times}x
                    </span>
                  )}
                </div>
                
                {/* Info da Série */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div className="bg-slate-900/50 rounded px-2 py-1">
                    <p className="text-slate-400 text-xs">Repetições</p>
                    <p className="text-white font-bold text-sm">{set.reps}</p>
                  </div>
                  <div className="bg-slate-900/50 rounded px-2 py-1">
                    <p className="text-slate-400 text-xs">Descanso</p>
                    <p className="text-purple-400 font-bold text-sm">{set.rest_seconds}s</p>
                  </div>
                </div>

                {/* Registro APENAS de Peso */}
                <div className="space-y-1">
                  <Label className="text-slate-300 text-sm flex items-center gap-1">
                    <Weight className="w-4 h-4" />
                    Carga Utilizada (kg)
                  </Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={exercisesData[currentExerciseIndex]?.sets_completed[index]?.weight_used || ''}
                    onChange={(e) => updateSetData(currentExerciseIndex, index, 'weight_used', parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 20"
                    className="bg-slate-700 border-slate-600 text-white h-12 text-base text-center font-semibold"
                  />
                </div>
                
                {set.notes && (
                  <div className="bg-orange-900/30 border border-orange-700/50 rounded p-1.5">
                    <p className="text-orange-400 text-xs font-semibold mb-0.5">📌 Atenção:</p>
                    <p className="text-orange-200 text-xs leading-relaxed">{set.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timer de Descanso - Fixo */}
      <div className="flex-shrink-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 px-3 py-2">
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-700/50 rounded-lg p-2">
          <div className="text-center">
            <p className="text-slate-300 text-xs mb-0.5">Descanso</p>
            <div className="text-3xl font-bold text-white mb-1">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
            
            {!isResting && (
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustRestTime(-30)}
                  className="border-slate-700 text-slate-300 h-7 w-7"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-slate-300 text-xs min-w-[40px]">{restTime}s</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustRestTime(30)}
                  className="border-slate-700 text-slate-300 h-7 w-7"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>

          {!isResting ? (
            <Button
              onClick={handleStartRest}
              className="w-full bg-purple-600 hover:bg-purple-700 h-8 text-xs"
            >
              <Play className="w-3 h-3 mr-1" />
              Iniciar Descanso
            </Button>
          ) : (
            <Button
              onClick={handlePauseRest}
              variant="outline"
              className="w-full border-slate-700 text-slate-300 h-8 text-xs"
            >
              <Pause className="w-3 h-3 mr-1" />
              Pausar
            </Button>
          )}
        </div>
      </div>

      {/* Botões Fixos no Bottom */}
      <div className="flex-shrink-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 px-3 py-3 safe-area-inset-bottom">
        <div className="flex gap-2">
          <Button
            onClick={handleSkipExercise}
            variant="outline"
            className="flex-1 bg-slate-800 border-slate-600 text-slate-200 h-12 text-sm font-semibold"
          >
            Pular
          </Button>
          <Button
            onClick={handleNextExercise}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 font-semibold text-sm"
          >
            {isLastExercise ? (
              <>
                <CheckCircle className="w-4 h-4 mr-1" />
                Finalizar
              </>
            ) : (
              <>
                <SkipForward className="w-4 h-4 mr-1" />
                Próximo
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
