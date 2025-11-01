import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Play, Pause, SkipForward, CheckCircle, Plus, Minus, AlertTriangle } from "lucide-react";

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
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [showCaloriesInput, setShowCaloriesInput] = useState(false);
  const [caloriesInput, setCaloriesInput] = useState("");
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadWorkout = async () => {
      if (workoutId) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
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
      
      // Atualizar dia completado
      const completedDays = user?.completed_workout_days || [];
      if (!completedDays.includes(dayNumber)) {
        completedDays.push(dayNumber);
      }
      
      // Calcular próximo dia
      const totalDays = workout?.days?.length || 1;
      const nextDay = dayNumber >= totalDays ? 1 : dayNumber + 1;
      
      await base44.auth.updateMe({
        current_workout_day: nextDay,
        completed_workout_days: completedDays,
      });
      
      navigate(createPageUrl("Home"));
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
  const isLastExercise = currentExerciseIndex === (currentDay.exercises?.length || 0) - 1;

  const handleStartRest = () => {
    setIsResting(true);
    setTimeRemaining(restTime);
  };

  const handleSkipExercise = () => {
    if (!skippedExercises.includes(currentExerciseIndex)) {
      setSkippedExercises([...skippedExercises, currentExerciseIndex]);
    }
    handleNextExercise();
  };

  const handleNextExercise = () => {
    setIsResting(false);
    
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
    createWorkoutLogMutation.mutate({
      workout_id: workout.id,
      workout_title: `${workout.title} - Dia ${dayNumber}`,
      date: new Date().toISOString().split('T')[0],
      duration_minutes: workout.duration_minutes,
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

  // Calories Input
  if (showCaloriesInput) {
    return (
      <div className="py-6 space-y-6">
        <Card className="bg-slate-900/50 border-slate-800 max-w-md mx-auto">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Treino Concluído!</h2>
              <p className="text-slate-400">Parabéns por completar o Dia {dayNumber}! 🎉</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">Calorias Gastas (opcional)</Label>
              <Input
                type="number"
                placeholder="Ex: 350"
                value={caloriesInput}
                onChange={(e) => setCaloriesInput(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <Button
              onClick={handleFinishWorkout}
              disabled={createWorkoutLogMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 py-6"
            >
              {createWorkoutLogMutation.isPending ? "Salvando..." : "Finalizar"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <p className="text-slate-400 text-sm">Dia {dayNumber} - Exercício</p>
          <p className="text-white font-bold">
            {currentExerciseIndex + 1} / {currentDay.exercises?.length || 0}
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
              <p className="text-slate-400">💡 {currentExercise.notes}</p>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-white font-semibold">Séries:</h3>
            {currentExercise?.sets?.map((set, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-slate-300">{index + 1}ª Série</span>
                <div className="flex items-center gap-4">
                  <span className="text-white font-bold">{set.reps} reps</span>
                  <span className="text-slate-400 text-sm">{set.rest_seconds}s descanso</span>
                </div>
              </div>
            ))}
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
          className="flex-1 border-slate-700 text-slate-300 py-6"
        >
          Pular Exercício
        </Button>
        <Button
          onClick={handleNextExercise}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-6"
        >
          {isLastExercise ? (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Finalizar Treino
            </>
          ) : (
            <>
              <SkipForward className="w-5 h-5 mr-2" />
              Próximo Exercício
            </>
          )}
        </Button>
      </div>
    </div>
  );
}