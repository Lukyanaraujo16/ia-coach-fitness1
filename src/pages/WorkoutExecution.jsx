import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Play, Pause, SkipForward, CheckCircle, Plus, Minus, AlertTriangle, Trophy, Clock, Zap } from "lucide-react";
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
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [skippedExercises, setSkippedExercises] = useState([]);
  const [restTime, setRestTime] = useState(60);
  const [isResting, setIsResting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [showCaloriesInput, setShowCaloriesInput] = useState(false);
  const [caloriesInput, setCaloriesInput] = useState("");
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const [user, setUser] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  useEffect(() => {
    const loadWorkout = async () => {
      if (workoutId) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Registrar hora de início
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
    if (isResting && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      setIsResting(false);
    }
    return () => clearInterval(interval);
  }, [isResting, timeRemaining]);

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
      
      // Registrar hora de término
      setEndTime(new Date());
    },
  });

  if (!workout || !currentDay) {
    return (
      <div className="py-6">
        <p className="text-slate-400 text-center">Carregando...</p>
      </div>
    );
  }

  const currentExercise = currentDay.exercises?.[currentExerciseIndex];
  const currentSet = currentExercise?.sets?.[currentSetIndex];
  const isLastExercise = currentExerciseIndex === (currentDay.exercises?.length || 0) - 1;
  const isLastSet = currentSetIndex === (currentExercise?.sets?.length || 0) - 1;

  const handleStartRest = () => {
    setIsResting(true);
    setTimeRemaining(currentSet?.rest_seconds || restTime);
  };

  const handleNextSet = () => {
    setIsResting(false);
    
    if (!isLastSet) {
      setCurrentSetIndex(currentSetIndex + 1);
      const nextSet = currentExercise.sets[currentSetIndex + 1];
      if (nextSet?.rest_seconds) {
        setRestTime(nextSet.rest_seconds);
        setTimeRemaining(nextSet.rest_seconds);
      }
    } else {
      handleNextExercise();
    }
  };

  const handleSkipExercise = () => {
    if (!skippedExercises.includes(currentExerciseIndex)) {
      setSkippedExercises([...skippedExercises, currentExerciseIndex]);
    }
    handleNextExercise();
  };

  const handleNextExercise = () => {
    setIsResting(false);
    setCurrentSetIndex(0);
    
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

    // Calcular duração real
    const durationMinutes = endTime && startTime 
      ? Math.round((endTime - startTime) / 1000 / 60)
      : workout.duration_minutes;

    createWorkoutLogMutation.mutate({
      workout_id: workout.id,
      workout_title: `${workout.title} - Dia ${dayNumber}`,
      date: localDate,
      duration_minutes: durationMinutes,
      calories_burned: caloriesInput ? parseInt(caloriesInput) : undefined,
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

  // Skip Warning Modal
  if (showSkipWarning) {
    return (
      <div className="py-6 space-y-6">
        <Card className="bg-slate-900/50 border-slate-800 max-w-md mx-auto">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-orange-600/20 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-orange-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Atenção!</h2>
              <p className="text-slate-400">
                Você pulou {skippedExercises.length} exercício(s). 
                Tem certeza que deseja finalizar o treino assim mesmo?
              </p>
            </div>
            
            <div className="space-y-2">
              <Button
                onClick={() => setShowSkipWarning(false)}
                variant="outline"
                className="w-full border-slate-700 text-slate-300"
              >
                Voltar e Completar
              </Button>
              <Button
                onClick={handleFinishWithSkipped}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Finalizar Mesmo Assim
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completion Screen with Stats
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
      <div className="py-6 space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border-green-700/50 max-w-md mx-auto overflow-hidden">
            <CardContent className="p-8 text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-24 h-24 bg-green-600/20 rounded-full flex items-center justify-center mx-auto"
              >
                <Trophy className="w-12 h-12 text-green-400" />
              </motion.div>
              
              <div>
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  Treino Concluído! 🎉
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-green-400 text-lg font-semibold mb-4"
                >
                  {randomMessage}
                </motion.p>
                <p className="text-slate-400 text-sm">Dia {dayNumber} - {workout.title}</p>
              </div>

              {/* Estatísticas do Treino */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-3 gap-3"
              >
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                  <p className="text-slate-400 text-xs mb-1">Início</p>
                  <p className="text-white font-bold text-sm">{startTimeStr}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
                  <p className="text-slate-400 text-xs mb-1">Fim</p>
                  <p className="text-white font-bold text-sm">{endTimeStr}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <Zap className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                  <p className="text-slate-400 text-xs mb-1">Duração</p>
                  <p className="text-white font-bold text-sm">{duration}min</p>
                </div>
              </motion.div>

              {/* Input de Calorias */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-2"
              >
                <Label className="text-slate-300">Calorias Gastas (opcional)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 350"
                  value={caloriesInput}
                  onChange={(e) => setCaloriesInput(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white text-center text-lg h-12"
                />
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  onClick={handleFinishWorkout}
                  disabled={createWorkoutLogMutation.isPending}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 py-6 text-lg font-bold"
                >
                  {createWorkoutLogMutation.isPending ? "Salvando..." : "Finalizar e Salvar"}
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Mostrar apenas na primeira renderização
  if (showCaloriesInput && !endTime) {
    setEndTime(new Date());
  }

  const totalSets = currentExercise?.sets?.length || 0;
  const progress = ((currentSetIndex + 1) / totalSets) * 100;

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(createPageUrl("WorkoutDetail") + `?id=${workoutId}`)}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <p className="text-slate-400 text-sm">Dia {dayNumber}</p>
          <p className="text-white font-bold">
            Exercício {currentExerciseIndex + 1}/{currentDay.exercises?.length || 0}
          </p>
        </div>
        <div className="w-10" />
      </div>

      {/* Current Exercise */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {currentExercise?.exercise_name}
            </h2>
            {currentExercise?.notes && (
              <p className="text-slate-400 text-sm">💡 {currentExercise.notes}</p>
            )}
          </div>

          {/* Progress Bar das Séries */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Progresso das Séries</span>
              <span className="text-blue-400 font-semibold">
                {currentSetIndex + 1}/{totalSets}
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Série Atual em Destaque */}
          <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold text-lg">
                  Série {currentSetIndex + 1} de {totalSets}
                </h3>
                {currentSet?.times > 1 && (
                  <span className="text-blue-400 text-sm font-medium">
                    {currentSet.times}x
                  </span>
                )}
              </div>
              
              <div className="space-y-3">
                {/* Repetições */}
                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <span className="text-slate-300 text-sm">Repetições</span>
                  <span className="text-white font-bold text-2xl">{currentSet?.reps}</span>
                </div>

                {/* Descanso */}
                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <span className="text-slate-300 text-sm">Descanso</span>
                  <span className="text-purple-400 font-bold text-xl">
                    {currentSet?.rest_seconds}s
                  </span>
                </div>

                {/* Observações da Série */}
                {currentSet?.notes && (
                  <div className="p-3 bg-yellow-900/20 border border-yellow-800/50 rounded-lg">
                    <p className="text-yellow-400 text-sm font-medium mb-1">📌 Observação:</p>
                    <p className="text-slate-300 text-sm">{currentSet.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Todas as Séries (Preview) */}
          <div className="space-y-2">
            <h4 className="text-slate-400 text-sm font-semibold">Todas as Séries:</h4>
            <div className="grid grid-cols-2 gap-2">
              {currentExercise?.sets?.map((set, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-lg text-center transition-all ${
                    index === currentSetIndex
                      ? 'bg-blue-600/30 border-2 border-blue-500'
                      : index < currentSetIndex
                      ? 'bg-green-900/20 border border-green-700/50'
                      : 'bg-slate-800/50 border border-slate-700'
                  }`}
                >
                  <p className={`text-xs mb-1 ${
                    index === currentSetIndex ? 'text-blue-400' : 
                    index < currentSetIndex ? 'text-green-400' : 
                    'text-slate-500'
                  }`}>
                    Série {index + 1}
                  </p>
                  <p className={`font-bold ${
                    index === currentSetIndex ? 'text-white' : 
                    index < currentSetIndex ? 'text-green-300' : 
                    'text-slate-400'
                  }`}>
                    {set.times > 1 && `${set.times}x `}{set.reps} reps
                  </p>
                  {index < currentSetIndex && (
                    <CheckCircle className="w-4 h-4 text-green-400 mx-auto mt-1" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rest Timer */}
      <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-700/50">
        <CardContent className="p-6 space-y-4">
          <div className="text-center">
            <p className="text-slate-300 mb-2">Tempo de Descanso</p>
            <div className="text-6xl font-bold text-white mb-4">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
            
            {!isResting && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustRestTime(-30)}
                  className="border-slate-700 text-slate-300"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-slate-300 text-sm">{restTime}s</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustRestTime(30)}
                  className="border-slate-700 text-slate-300"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {!isResting ? (
            <Button
              onClick={handleStartRest}
              className="w-full bg-purple-600 hover:bg-purple-700 py-6"
            >
              <Play className="w-5 h-5 mr-2" />
              Iniciar Descanso
            </Button>
          ) : (
            <Button
              onClick={() => setIsResting(false)}
              variant="outline"
              className="w-full border-slate-700 text-slate-300 py-6"
            >
              <Pause className="w-5 h-5 mr-2" />
              Pausar
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleSkipExercise}
          variant="outline"
          className="flex-1 bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white py-6"
        >
          Pular Exercício
        </Button>
        <Button
          onClick={handleNextSet}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-6 font-semibold"
        >
          {isLastSet ? (
            isLastExercise ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Finalizar
              </>
            ) : (
              <>
                <SkipForward className="w-5 h-5 mr-2" />
                Próximo
              </>
            )
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Concluir Série
            </>
          )}
        </Button>
      </div>
    </div>
  );
}