import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, AlertTriangle, Trophy, Clock, Zap, X, Weight, Video, Timer, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WorkoutExecution() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const workoutId = urlParams.get('id');
  const dayNumber = parseInt(urlParams.get('day')) || 1;

  const [workout, setWorkout] = useState(null);
  const [currentDay, setCurrentDay] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [skippedExercises, setSkippedExercises] = useState([]);
  const [restTime, setRestTime] = useState(60);
  const [isResting, setIsResting] = useState(false);
  const [restStartTime, setRestStartTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [showCaloriesInput, setShowCaloriesInput] = useState(false);
  const [caloriesInput, setCaloriesInput] = useState("");
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [user, setUser] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [exerciseWeights, setExerciseWeights] = useState({});

  const { data: previousLogs = [] } = useQuery({
    queryKey: ['previous-exercise-logs', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const logs = await base44.entities.WorkoutLog.list('-date', 50);
      return logs.filter(log => log.user_email === user.email);
    },
    enabled: !!user?.email,
  });

  useEffect(() => {
    const loadWorkout = async () => {
      if (workoutId) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setStartTime(new Date());
        
        const workouts = await base44.entities.Workout.list();
        const foundWorkout = workouts.find(w => w.id === workoutId);
        setWorkout(foundWorkout);
        
        if (foundWorkout?.days) {
          const day = foundWorkout.days.find(d => d.day_number === dayNumber);
          setCurrentDay(day);
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
          // Vibrar quando o tempo acabar (se disponível)
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
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
      
      navigate(createPageUrl("Dashboard"));
    },
  });

  if (!workout || !currentDay) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  const currentExercise = currentDay.exercises?.[currentExerciseIndex];
  const isLastExercise = currentExerciseIndex === (currentDay.exercises?.length || 0) - 1;

  // Buscar última carga do exercício atual
  const getLastWeight = (exerciseName) => {
    for (const log of previousLogs) {
      const exercise = log.exercises_completed?.find(ex => ex.exercise_name === exerciseName);
      if (exercise?.max_weight) {
        return exercise.max_weight;
      }
    }
    return null;
  };

  const lastWeight = currentExercise ? getLastWeight(currentExercise.exercise_name) : null;

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

  const handleSkipRest = () => {
    setIsResting(false);
    setRestStartTime(null);
    setTimeRemaining(restTime);
  };

  const handleNextExercise = () => {
    setIsResting(false);
    setRestStartTime(null);
    
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

    const exercisesCompleted = [];
    currentDay.exercises?.forEach((exercise, originalIdx) => {
      if (!skippedExercises.includes(originalIdx)) {
        const maxWeight = exerciseWeights[originalIdx];
        exercisesCompleted.push({
          exercise_name: exercise.exercise_name,
          sets_completed: exercise.sets?.length || 0,
          max_weight: maxWeight && maxWeight > 0 ? maxWeight : undefined,
        });
      }
    });

    createWorkoutLogMutation.mutate({
      user_email: user.email,
      workout_id: workout.id,
      workout_title: `${workout.title} - Dia ${dayNumber}`,
      date: localDate,
      duration_minutes: durationMinutes,
      calories_burned: caloriesInput ? parseInt(caloriesInput) : undefined,
      notes: skippedExercises.length > 0 ? `${skippedExercises.length} exercícios pulados` : "",
      exercises_completed: exercisesCompleted,
    });
  };

  const handleExitWorkout = () => {
    setShowExitConfirm(true);
  };

  const confirmExitWorkout = () => {
    navigate(createPageUrl("WorkoutDetail") + `?id=${workoutId}`);
  };

  const handleWeightChange = (value) => {
    setExerciseWeights({
      ...exerciseWeights,
      [currentExerciseIndex]: value ? parseFloat(value) : "",
    });
  };

  const currentExerciseWeight = exerciseWeights[currentExerciseIndex] || "";

  // Video Modal
  if (showVideoModal && currentExercise?.video_url) {
    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-xl font-bold">{currentExercise.exercise_name}</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowVideoModal(false)}
              className="text-white hover:bg-white/10"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
          <div className="relative pt-[56.25%] bg-slate-900 rounded-xl overflow-hidden">
            <iframe
              src={currentExercise.video_url}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Exercise Video"
            />
          </div>
          {currentExercise.notes && (
            <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
              <p className="text-slate-300 text-sm">💡 {currentExercise.notes}</p>
            </div>
          )}
        </div>
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
    return null;
  }

  const progressPercentage = ((currentExerciseIndex + 1) / (currentDay.exercises?.length || 1)) * 100;

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-slate-950 to-slate-900 z-[60]">
      {/* Header Fixo */}
      <div className="flex-shrink-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExitWorkout}
            className="text-slate-400 hover:text-white h-9 w-9"
          >
            <X className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <p className="text-white font-bold text-sm">
              {currentExerciseIndex + 1}/{currentDay.exercises?.length || 0}
            </p>
            <p className="text-slate-400 text-xs">Dia {dayNumber}</p>
          </div>
          {currentExercise?.video_url ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowVideoModal(true)}
              className="text-blue-400 hover:text-blue-300 h-9 w-9"
            >
              <Video className="w-5 h-5" />
            </Button>
          ) : (
            <div className="w-9" />
          )}
        </div>
        <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Nome do Exercício - Fixo */}
      <div className="flex-shrink-0 text-center px-4 py-4 border-b border-slate-800 bg-slate-900/50">
        <h2 className="text-xl font-bold text-white leading-tight mb-1">
          {currentExercise?.exercise_name}
        </h2>
        {currentExercise?.notes && (
          <p className="text-slate-400 text-sm">💡 {currentExercise.notes}</p>
        )}
      </div>

      {/* Séries - Área Rolável */}
      <div className="flex-1 overflow-y-auto px-4 py-3" style={{ minHeight: 0 }}>
        <div className="space-y-2.5">
          {currentExercise?.sets?.map((set, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="w-full p-3 rounded-xl border-2 border-slate-700 bg-gradient-to-br from-slate-800/80 to-slate-900/80"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-sm">Série {index + 1}</span>
                  {set.times > 1 && (
                    <span className="px-2 py-0.5 bg-yellow-600/20 text-yellow-400 text-xs rounded-full font-semibold">
                      Fazer {set.times}x
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-900/30 rounded-lg px-3 py-2 border border-blue-700/30">
                    <p className="text-blue-400 text-xs mb-0.5">Repetições</p>
                    <p className="text-white font-bold text-lg">{set.reps}</p>
                  </div>
                  
                  <div className="bg-purple-900/30 rounded-lg px-3 py-2 border border-purple-700/30">
                    <p className="text-purple-400 text-xs mb-0.5">Descanso</p>
                    <p className="text-white font-bold text-lg">{set.rest_seconds}s</p>
                  </div>
                </div>
                
                {set.notes && (
                  <div className="bg-orange-900/30 border border-orange-700/50 rounded-lg p-2">
                    <p className="text-orange-400 text-xs font-semibold mb-0.5">📌 Importante:</p>
                    <p className="text-orange-200 text-xs leading-relaxed">{set.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Registro de Peso - Fixo */}
      <div className="flex-shrink-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 px-4 py-3">
        <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border border-cyan-700/50 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Weight className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-300 text-sm font-semibold">Carga Máxima (kg)</span>
            </div>
            {lastWeight && (
              <span className="text-cyan-400 text-xs font-semibold">
                Última: {lastWeight}kg
              </span>
            )}
          </div>
          <Input
            type="number"
            step="0.5"
            placeholder={lastWeight ? `Última: ${lastWeight}kg` : "Ex: 40"}
            value={currentExerciseWeight}
            onChange={(e) => handleWeightChange(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white text-center h-12 text-lg font-bold"
          />
        </div>
      </div>

      {/* Timer de Descanso - Fixo e MAIOR */}
      <AnimatePresence>
        {isResting && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-shrink-0 bg-gradient-to-br from-purple-600 to-blue-600 border-t-4 border-purple-400 px-4 py-6 overflow-hidden"
          >
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Timer className="w-6 h-6 text-white animate-pulse" />
                <p className="text-white text-lg font-bold">DESCANSANDO</p>
              </div>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-7xl font-bold text-white mb-4 tabular-nums"
              >
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </motion.div>
              
              <div className="flex gap-3">
                <Button
                  onClick={handlePauseRest}
                  variant="outline"
                  className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20 h-12 text-base font-semibold backdrop-blur"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Pausar
                </Button>
                <Button
                  onClick={handleSkipRest}
                  className="flex-1 bg-white text-purple-600 hover:bg-white/90 h-12 text-base font-semibold"
                >
                  Pular Descanso
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botões Fixos no Bottom */}
      <div className="flex-shrink-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 px-4 py-4 safe-area-inset-bottom">
        {!isResting ? (
          <div className="space-y-3">
            <Button
              onClick={handleStartRest}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white h-14 font-bold text-base shadow-lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Iniciar Descanso ({restTime}s)
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleSkipExercise}
                variant="outline"
                className="bg-slate-800 border-slate-600 text-slate-200 h-12 text-sm font-semibold"
              >
                Pular Exercício
              </Button>
              <Button
                onClick={handleNextExercise}
                className="bg-green-600 hover:bg-green-700 text-white h-12 font-semibold text-sm"
              >
                {isLastExercise ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Finalizar
                  </>
                ) : (
                  <>
                    Próximo Exercício
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleNextExercise}
            className="w-full bg-green-600 hover:bg-green-700 text-white h-14 font-bold text-base"
          >
            {isLastExercise ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Finalizar Treino
              </>
            ) : (
              <>
                Próximo Exercício
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}