import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, AlertTriangle, Trophy, Clock, Zap, X, Weight, Video, Timer, Play, Pause, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AICoachAssistant from "../components/workout/AICoachAssistant";

export default function WorkoutExecution() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const workoutId = urlParams.get('id');
  const dayNumber = parseInt(urlParams.get('day')) || 1;

  const [workout, setWorkout] = useState(null);
  const [currentDay, setCurrentDay] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [currentSetRepetition, setCurrentSetRepetition] = useState(0);
  const [skippedExercises, setSkippedExercises] = useState([]);
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
  const [notificationSent, setNotificationSent] = useState(false);

  const setRefs = useRef({});

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
            setTimeRemaining(day.exercises[0].sets[0].rest_seconds);
          }
        }
      }
    };
    loadWorkout();
  }, [workoutId, dayNumber]);

  useEffect(() => {
    if (currentSetIndex !== null && setRefs.current[currentSetIndex]) {
      setRefs.current[currentSetIndex].scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [currentSetIndex]);

  useEffect(() => {
    let interval;
    
    if (isResting && restStartTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - restStartTime) / 1000);
        const currentExerciseInEffect = currentDay.exercises?.[currentExerciseIndex];
        const currentSetInEffect = currentExerciseInEffect?.sets?.[currentSetIndex];
        const restTime = currentSetInEffect?.rest_seconds || 60;
        const remaining = restTime - elapsed;
        
        // Notificação quando faltam 10 segundos
        if (remaining === 10 && !notificationSent && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('Descanso Terminando!', {
              body: 'Faltam 10 segundos para voltar ao treino',
              icon: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
              badge: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
              vibrate: [200, 100, 200],
              tag: 'rest-warning'
            });
            setNotificationSent(true);
          } catch (error) {
            console.log('Erro ao enviar notificação:', error);
          }
        }
        
        if (remaining <= 0) {
          setTimeRemaining(0);
          setIsResting(false);
          setRestStartTime(null);
          setNotificationSent(false);
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
          
          const timesToDo = currentSetInEffect?.times || 1;
          const isLastSetInEffect = currentSetIndex === (currentExerciseInEffect?.sets?.length || 0) - 1;
          
          // Se ainda tem repetições da mesma série
          if (currentSetRepetition + 1 < timesToDo) {
            setCurrentSetRepetition(currentSetRepetition + 1);
          } else if (!isLastSetInEffect) {
            // Completou todas as repetições, avançar para próxima série
            setCurrentSetRepetition(0);
            setCurrentSetIndex(currentSetIndex + 1);
            const nextSet = currentExerciseInEffect?.sets?.[currentSetIndex + 1];
            if (nextSet?.rest_seconds) {
              setTimeRemaining(nextSet.rest_seconds);
            }
          } else {
            // É a última série E última repetição - incrementa para sinalizar conclusão
            setCurrentSetRepetition(timesToDo);
          }
        } else {
          setTimeRemaining(remaining);
        }
      }, 100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isResting, restStartTime, currentExerciseIndex, currentSetIndex, currentDay, currentSetRepetition, notificationSent]);

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
  const currentSet = currentExercise?.sets?.[currentSetIndex];
  const isLastExercise = currentExerciseIndex === (currentDay.exercises?.length || 0) - 1;
  const isLastSet = currentSetIndex === (currentExercise?.sets?.length || 0) - 1;
  const nextExercise = !isLastExercise ? currentDay.exercises?.[currentExerciseIndex + 1] : null;
  const timesToDo = currentSet?.times || 1;
  
  // Verifica se completou todas as repetições da última série
  const completedAllRepsOfLastSet = isLastSet && (currentSetRepetition >= timesToDo);

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

  const formatTime = (seconds) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}min ${secs}s` : `${mins}min`;
  };

  const handleStartRest = () => {
    const restTime = currentSet?.rest_seconds || 60;
    setIsResting(true);
    setRestStartTime(Date.now());
    setTimeRemaining(restTime);
    setNotificationSent(false);
  };

  const handlePauseRest = () => {
    setIsResting(false);
    setRestStartTime(null);
    setNotificationSent(false);
  };

  const handleSkipRest = () => {
    setIsResting(false);
    setRestStartTime(null);
    setNotificationSent(false);
    
    // Se ainda tem repetições, avança a repetição
    if (currentSetRepetition + 1 < timesToDo) {
      setCurrentSetRepetition(currentSetRepetition + 1);
    } else if (!isLastSet) {
      // Se não é a última série, vai para a próxima
      setCurrentSetRepetition(0);
      setCurrentSetIndex(currentSetIndex + 1);
      const nextSet = currentExercise?.sets?.[currentSetIndex + 1];
      if (nextSet?.rest_seconds) {
        setTimeRemaining(nextSet.rest_seconds);
      }
    } else {
      // É a última série e última repetição
      setCurrentSetRepetition(timesToDo);
    }
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
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSetIndex(0);
      setCurrentSetRepetition(0);
      const nextExercise = currentDay.exercises[currentExerciseIndex + 1];
      if (nextExercise?.sets?.[0]?.rest_seconds) {
        setTimeRemaining(nextExercise.sets[0].rest_seconds);
      }
    }
  };

  const handleSkipExercise = () => {
    if (!skippedExercises.includes(currentExerciseIndex)) {
      setSkippedExercises([...skippedExercises, currentExerciseIndex]);
    }
    setCurrentSetIndex(0);
    setCurrentSetRepetition(0);
    handleNextExercise();
  };

  const handleGoBackToSkipped = () => {
    setShowSkipWarning(false);
    if (skippedExercises.length > 0) {
      setCurrentExerciseIndex(skippedExercises[0]);
      setCurrentSetIndex(0);
      setCurrentSetRepetition(0);
      setSkippedExercises(skippedExercises.slice(1));
    }
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
              <p className="text-slate-400 text-sm mb-3">
                Você pulou {skippedExercises.length} exercício(s). 
              </p>
              <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3">
                <p className="text-blue-300 text-sm">
                  Deseja voltar e concluir os exercícios pendentes?
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button
                onClick={handleGoBackToSkipped}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Voltar e Concluir
              </Button>
              <Button
                onClick={handleFinishWithSkipped}
                variant="outline"
                className="w-full border-slate-700 text-slate-300"
              >
                Finalizar Mesmo Assim
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
  const restTimeFormatted = currentSet?.rest_seconds ? formatTime(currentSet.rest_seconds) : "1min";

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-slate-950 to-slate-900 z-[10000]">
      {/* AI Coach Assistant */}
      {currentExercise && (
        <AICoachAssistant 
          exercise={currentExercise} 
          user={user}
          isResting={isResting}
          previousLogs={previousLogs}
        />
      )}

      {/* Header Fixo */}
      <div className="flex-shrink-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <img 
            src={user?.app_logo_url || "https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png"} 
            alt="Logo" 
            className="h-8"
          />
          <div className="text-center flex-1 mx-4">
            <p className="text-white font-bold text-sm">
              {currentExerciseIndex + 1}/{currentDay.exercises?.length || 0}
            </p>
            <p className="text-slate-400 text-xs">Dia {dayNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            {currentExercise?.video_url && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowVideoModal(true)}
                className="text-blue-400 hover:text-blue-300 h-9 w-9"
              >
                <Video className="w-5 h-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExitWorkout}
              className="text-slate-400 hover:text-white h-9 w-9"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
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
          <p className="text-slate-400 text-sm mb-2">💡 {currentExercise.notes}</p>
        )}
        {nextExercise && (
          <div className="flex items-center justify-center gap-2 text-slate-400 text-xs mt-2">
            <span>Próximo:</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-400 font-medium">{nextExercise.exercise_name}</span>
          </div>
        )}
      </div>

      {/* Séries - Área Rolável */}
      <div className="flex-1 overflow-y-auto px-4 py-3" style={{ minHeight: 0 }}>
        <div className="space-y-2.5">
          {currentExercise?.sets?.map((set, index) => (
            <motion.div
              key={index}
              ref={(el) => (setRefs.current[index] = el)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`w-full p-3 rounded-xl border-2 ${
                index === currentSetIndex 
                  ? 'border-blue-500 bg-gradient-to-br from-blue-900/40 to-slate-900/80 shadow-lg shadow-blue-900/50' 
                  : index < currentSetIndex
                  ? 'border-green-700/50 bg-gradient-to-br from-green-900/20 to-slate-900/80 opacity-60'
                  : 'border-slate-700 bg-gradient-to-br from-slate-800/80 to-slate-900/80'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-white font-bold text-sm">Série {index + 1}</div>
                  {index === currentSetIndex && timesToDo > 1 && (
                    <div className="px-2 py-0.5 bg-yellow-600/20 text-yellow-400 text-xs rounded-full font-semibold">
                      {currentSetRepetition + 1}/{timesToDo}
                    </div>
                  )}
                  {index < currentSetIndex && (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-slate-400 text-xs mb-1">Fazer</p>
                    <p className="text-white font-bold text-base">{set.times || 1}</p>
                  </div>

                  <div className="text-center">
                    <p className="text-slate-400 text-xs mb-1">Repetições</p>
                    <p className="text-white font-bold text-base">{set.reps}</p>
                  </div>

                  <div className="text-center">
                    <p className="text-slate-400 text-xs mb-1">Descanso</p>
                    <p className="text-purple-400 font-bold text-base">{formatTime(set.rest_seconds)}</p>
                  </div>
                </div>
                
                {set.notes && (
                  <div className="bg-orange-900/30 border border-orange-700/50 rounded-lg p-2 mt-2">
                    <p className="text-orange-400 text-xs font-semibold mb-0.5">📌 Importante:</p>
                    <p className="text-orange-200 text-xs leading-relaxed">{set.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Registro de Peso - Fixo e DESTACADO se última série */}
      <div className="flex-shrink-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 px-4 py-3">
        <div className={`rounded-xl p-3 border-2 transition-all ${
          completedAllRepsOfLastSet && !isResting
            ? 'bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border-yellow-600/60 shadow-lg shadow-yellow-900/50' 
            : 'bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-cyan-700/50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Weight className={`w-4 h-4 ${completedAllRepsOfLastSet && !isResting ? 'text-yellow-400' : 'text-cyan-400'}`} />
              <span className={`text-sm font-semibold ${completedAllRepsOfLastSet && !isResting ? 'text-yellow-300' : 'text-slate-300'}`}>
                Carga Máxima (kg) {completedAllRepsOfLastSet && !isResting && '⚡'}
              </span>
            </div>
            {lastWeight && (
              <span className={`text-xs font-semibold ${completedAllRepsOfLastSet && !isResting ? 'text-yellow-400' : 'text-cyan-400'}`}>
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
            className={`text-center h-12 text-lg font-bold ${
              completedAllRepsOfLastSet && !isResting
                ? 'bg-slate-800 border-yellow-600/50 text-yellow-100' 
                : 'bg-slate-800 border-slate-700 text-white'
            }`}
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
              <div className="flex items-center justify-center gap-2 mb-2">
                <Timer className="w-6 h-6 text-white animate-pulse" />
                <p className="text-white text-lg font-bold">DESCANSANDO</p>
              </div>
              {timesToDo > 1 && (
                <p className="text-white/80 text-sm mb-2">
                  Repetição {currentSetRepetition + 1} de {timesToDo}
                </p>
              )}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-7xl font-bold text-white mb-4 tabular-nums"
              >
                {formatTime(timeRemaining)}
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
            {!completedAllRepsOfLastSet ? (
              <Button
                onClick={handleStartRest}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white h-14 font-bold text-base shadow-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Iniciar Descanso ({restTimeFormatted})
              </Button>
            ) : (
              <Button
                onClick={handleNextExercise}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white h-14 font-bold text-base shadow-lg shadow-yellow-900/50 border-2 border-yellow-400"
              >
                {isLastExercise ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Finalizar Treino
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-5 h-5 mr-2" />
                    Próximo Exercício
                  </>
                )}
              </Button>
            )}
            
            <Button
              onClick={handleSkipExercise}
              variant="outline"
              className="w-full bg-slate-800 border-slate-600 text-slate-200 h-12 text-sm font-semibold"
            >
              Pular Exercício
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}