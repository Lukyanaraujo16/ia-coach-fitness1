import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Pause, SkipForward, CheckCircle, Plus, Minus, AlertTriangle, Trophy, Clock, Zap, X, Weight } from "lucide-react";
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
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const currentExercise = currentDay?.exercises?.[currentExerciseIndex];
  const isLastExercise = currentExerciseIndex === (currentDay?.exercises?.length || 0) - 1;

  useEffect(() => {
    const loadWorkout = async () => {
      if (!workoutId) {
        setLoadError("ID do treino não encontrado");
        setIsLoadingData(false);
        return;
      }

      try {
        setIsLoadingData(true);
        setLoadError(null);

        const currentUser = await base44.auth.me();
        if (!currentUser) {
          throw new Error("Usuário não encontrado");
        }
        setUser(currentUser);
        setStartTime(new Date());
        
        const workouts = await base44.entities.Workout.list();
        if (!workouts || workouts.length === 0) {
          throw new Error("Nenhum treino disponível");
        }

        const foundWorkout = workouts.find(w => w.id === workoutId);
        if (!foundWorkout) {
          throw new Error("Treino não encontrado");
        }
        setWorkout(foundWorkout);
        
        if (!foundWorkout.days || foundWorkout.days.length === 0) {
          throw new Error("Treino sem dias configurados");
        }

        const day = foundWorkout.days.find(d => d.day_number === dayNumber);
        if (!day) {
          throw new Error(`Dia ${dayNumber} não encontrado no treino`);
        }
        setCurrentDay(day);
        
        if (day.exercises && day.exercises.length > 0) {
          const initialData = day.exercises.map(ex => ({
            exercise_id: ex.exercise_id || '',
            exercise_name: ex.exercise_name || 'Exercício',
            exercise_category: ex.exercise_category || '',
            sets_completed: (ex.sets || []).map((set, idx) => ({
              set_number: idx + 1,
              reps_completed: parseInt(set.reps) || 0,
              weight_used: 0,
              notes: ''
            }))
          }));
          setExercisesData(initialData);

          if (day.exercises[0]?.sets?.[0]?.rest_seconds) {
            const firstRest = day.exercises[0].sets[0].rest_seconds;
            setRestTime(firstRest);
            setTimeRemaining(firstRest);
          }
        } else {
          throw new Error("Nenhum exercício encontrado para este dia");
        }

        setIsLoadingData(false);
      } catch (error) {
        console.error("Error loading workout:", error);
        setLoadError(error.message || "Erro ao carregar treino");
        setIsLoadingData(false);
      }
    };
    loadWorkout();
  }, [workoutId, dayNumber]);

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
      }, 100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isResting, restStartTime, restTime]);

  const createWorkoutLogMutation = useMutation({
    mutationFn: async (data) => {
      try {
        return await base44.entities.WorkoutLog.create(data);
      } catch (error) {
        console.error("Error creating workout log:", error);
        throw error;
      }
    },
    onSuccess: async () => {
      try {
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
        
        navigate(createPageUrl("Home"));
      } catch (error) {
        console.error("Error updating user progress:", error);
        navigate(createPageUrl("Home"));
      }
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      alert("Erro ao salvar treino. Tente novamente.");
    }
  });

  const updateSetData = (exerciseIndex, setIndex, field, value) => {
    try {
      const newData = [...exercisesData];
      if (newData[exerciseIndex]?.sets_completed?.[setIndex]) {
        newData[exerciseIndex].sets_completed[setIndex][field] = value;
        setExercisesData(newData);
      }
    } catch (error) {
      console.error("Error updating set data:", error);
    }
  };

  const handleStartRest = () => {
    setIsResting(true);
    setRestStartTime(Date.now());
    setTimeRemaining(restTime);
  };

  const handlePauseRest = () => {
    if (isResting && restStartTime) {
      const now = Date.now();
      const elapsed = Math.floor((now - restStartTime) / 1000);
      const remaining = restTime - elapsed;
      
      setRestTime(Math.max(remaining, 0));
      setTimeRemaining(Math.max(remaining, 0));
      setIsResting(false);
      setRestStartTime(null);
    }
  };

  const handleNextExercise = () => {
    setIsResting(false);
    setRestStartTime(null);

    if (isLastExercise) {
      if (skippedExercises.length > 0) {
        setShowSkipWarning(true);
      } else {
        setEndTime(new Date());
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
    setEndTime(new Date());
    setShowCaloriesInput(true);
  };

  const handleFinishWorkout = () => {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const localDate = `${year}-${month}-${day}`;

      const durationMinutes = endTime && startTime 
        ? Math.round((endTime - startTime) / 1000 / 60)
        : workout.duration_minutes;

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
    } catch (error) {
      console.error("Error finishing workout:", error);
      alert("Erro ao finalizar treino. Tente novamente.");
    }
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

  // Loading state
  if (isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando treino...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 p-4">
        <Card className="bg-slate-900 border-slate-800 max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Erro ao Carregar</h3>
              <p className="text-slate-400 text-sm">{loadError}</p>
            </div>
            <Button
              onClick={() => navigate(createPageUrl("Home"))}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Voltar para Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <h3 className="text-xl font-bold text-white mb-2">Interromper Treino?</h3>
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-950 to-slate-900">
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-950 to-slate-900">
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
              Exercício {currentExerciseIndex + 1}/{currentDay?.exercises?.length || 0}
            </p>
          </div>
          <div className="w-8" />
        </div>
      </div>

      {/* Nome do Exercício - Fixo */}
      <div className="flex-shrink-0 text-center px-3 py-2 border-b border-slate-800 bg-slate-900/50">
        <h2 className="text-base font-bold text-white leading-tight">
          {currentExercise?.exercise_name || 'Exercício'}
        </h2>
        {currentExercise?.notes && (
          <p className="text-slate-400 text-xs mt-0.5">💡 {currentExercise.notes}</p>
        )}
      </div>

      {/* Séries - Área Rolável */}
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

                {/* Registro de Peso */}
                <div className="space-y-1">
                  <Label className="text-slate-300 text-sm flex items-center gap-1">
                    <Weight className="w-4 h-4" />
                    Carga Utilizada (kg)
                  </Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={exercisesData[currentExerciseIndex]?.sets_completed?.[index]?.weight_used || ''}
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
      <div className="flex-shrink-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 px-3 py-3">
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