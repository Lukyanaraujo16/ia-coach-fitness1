import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Play, Pause, SkipForward, CheckCircle, Plus, Minus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function WorkoutExecution() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const workoutId = urlParams.get('id');

  const [workout, setWorkout] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [restTime, setRestTime] = useState(60);
  const [isResting, setIsResting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [weightUsed, setWeightUsed] = useState("");
  const [showCaloriesInput, setShowCaloriesInput] = useState(false);
  const [caloriesInput, setCaloriesInput] = useState("");

  const { data: exerciseLogs = [] } = useQuery({
    queryKey: ['exercise-logs'],
    queryFn: () => base44.entities.ExerciseLog.list('-date'),
  });

  const logExerciseMutation = useMutation({
    mutationFn: (data) => base44.entities.ExerciseLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['exercise-logs']);
    },
  });

  const createWorkoutLogMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkoutLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['workout-logs']);
      navigate(createPageUrl("Home"));
    },
  });

  useEffect(() => {
    const loadWorkout = async () => {
      if (workoutId) {
        const workouts = await base44.entities.Workout.list();
        const foundWorkout = workouts.find(w => w.id === workoutId);
        setWorkout(foundWorkout);
        if (foundWorkout?.exercises?.[0]?.rest_seconds) {
          setRestTime(foundWorkout.exercises[0].rest_seconds);
          setTimeRemaining(foundWorkout.exercises[0].rest_seconds);
        }
      }
    };
    loadWorkout();
  }, [workoutId]);

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

  if (!workout) {
    return (
      <div className="py-6">
        <p className="text-slate-400 text-center">Carregando...</p>
      </div>
    );
  }

  const currentExercise = workout.exercises?.[currentExerciseIndex];
  const isLastExercise = currentExerciseIndex === (workout.exercises?.length || 0) - 1;

  const handleStartRest = () => {
    setIsResting(true);
    setTimeRemaining(restTime);
  };

  const handleNextExercise = () => {
    if (weightUsed) {
      logExerciseMutation.mutate({
        exercise_name: `Exercício ${currentExerciseIndex + 1}`,
        date: new Date().toISOString().split('T')[0],
        weight_used: parseFloat(weightUsed),
        reps_completed: currentExercise?.sets || 0,
        sets_completed: currentExercise?.sets || 0,
      });
    }

    setWeightUsed("");
    setIsResting(false);
    
    if (isLastExercise) {
      setShowCaloriesInput(true);
    } else {
      const nextExercise = workout.exercises[currentExerciseIndex + 1];
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      if (nextExercise?.rest_seconds) {
        setRestTime(nextExercise.rest_seconds);
        setTimeRemaining(nextExercise.rest_seconds);
      }
    }
  };

  const handleFinishWorkout = () => {
    createWorkoutLogMutation.mutate({
      workout_id: workout.id,
      workout_title: workout.title,
      date: new Date().toISOString().split('T')[0],
      duration_minutes: workout.duration_minutes,
      calories_burned: caloriesInput ? parseInt(caloriesInput) : undefined,
      notes: "",
    });
  };

  const adjustRestTime = (delta) => {
    const newTime = Math.max(30, restTime + delta);
    setRestTime(newTime);
    if (!isResting) {
      setTimeRemaining(newTime);
    }
  };

  // Get history for current exercise
  const exerciseHistory = exerciseLogs
    .filter(log => log.exercise_name === `Exercício ${currentExerciseIndex + 1}`)
    .slice(0, 10)
    .reverse()
    .map(log => ({
      date: new Date(log.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      weight: log.weight_used,
    }));

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
              <p className="text-slate-400">Parabéns por completar o treino 🎉</p>
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
          <p className="text-slate-400 text-sm">Exercício</p>
          <p className="text-white font-bold">
            {currentExerciseIndex + 1} / {workout.exercises?.length || 0}
          </p>
        </div>
        <div className="w-10" />
      </div>

      {/* Current Exercise */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Exercício {currentExerciseIndex + 1}
            </h2>
            {currentExercise?.notes && (
              <p className="text-slate-400">{currentExercise.notes}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-lg">
            <div className="text-center">
              <p className="text-slate-400 text-sm">Séries</p>
              <p className="text-3xl font-bold text-white">{currentExercise?.sets}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-sm">Repetições</p>
              <p className="text-3xl font-bold text-white">{currentExercise?.reps}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Carga Utilizada (kg)</Label>
            <Input
              type="number"
              step="0.5"
              placeholder="Ex: 10"
              value={weightUsed}
              onChange={(e) => setWeightUsed(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
            />
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

      {/* Progress Chart */}
      {exerciseHistory.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <h3 className="text-white font-semibold mb-4">Evolução da Carga</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={exerciseHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Next Button */}
      <Button
        onClick={handleNextExercise}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6"
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
  );
}