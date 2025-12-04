import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Zap, Lock, CheckCircle, Play } from "lucide-react";
import { motion } from "framer-motion";

const categoryLabels = {
  strength: "Força",
  cardio: "Cardio",
  hiit: "HIIT",
  flexibility: "Flexibilidade",
  full_body: "Corpo Inteiro",
};

const categoryColors = {
  strength: "bg-orange-500/20 text-orange-400",
  cardio: "bg-red-500/20 text-red-400",
  hiit: "bg-purple-500/20 text-purple-400",
  flexibility: "bg-green-500/20 text-green-400",
  full_body: "bg-blue-500/20 text-blue-400",
};

const difficultyLabels = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

export default function WorkoutDetail() {
  const navigate = useNavigate();
  const [workout, setWorkout] = useState(null);
  const [user, setUser] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const workoutId = urlParams.get('id');
  const fromSelection = urlParams.get('from') === 'selection';

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        if (workoutId) {
          const workouts = await base44.entities.Workout.list();
          const foundWorkout = workouts.find(w => w.id === workoutId);
          setWorkout(foundWorkout);
        }
      } catch (error) {
        console.error("Error loading workout:", error);
      }
    };
    loadData();
  }, [workoutId]);

  const isPremium = user?.subscription_status === 'premium' || user?.subscription_status === 'trial';
  const isLocked = workout?.is_premium && !isPremium;

  const handleSelectWorkout = async () => {
    if (isLocked) {
      navigate(createPageUrl("Subscription"));
      return;
    }

    try {
      await base44.auth.updateMe({
        selected_workout_id: workout.id,
        current_workout_day: 1,
        completed_workout_days: [],
      });
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Error selecting workout:", error);
    }
  };

  const handleStartWorkout = (dayNumber = null) => {
    const day = dayNumber || (user?.selected_workout_id === workout?.id ? user.current_workout_day || 1 : 1);
    navigate(createPageUrl("WorkoutExecution") + `?id=${workout.id}&day=${day}`);
  };

  if (!workout) {
    return (
      <div className="py-6">
        <p className="text-slate-400 text-center">Carregando...</p>
      </div>
    );
  }

  const totalExercises = workout.days?.reduce((sum, day) => sum + (day.exercises?.length || 0), 0) || 0;
  const hasMultipleDays = workout.days && workout.days.length > 1;

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(fromSelection ? createPageUrl("WorkoutSelection") : createPageUrl("Workouts"))}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-bold text-white flex-1">Detalhes do Treino</h2>
      </div>

      {workout.image_url && (
        <div className="relative h-48 bg-gradient-to-br from-blue-900/30 to-slate-900 rounded-2xl overflow-hidden">
          <img src={workout.image_url} alt={workout.title} className="w-full h-full object-cover opacity-60" />
          {isLocked && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <Lock className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                <p className="text-white font-semibold">Conteúdo Premium</p>
              </div>
            </div>
          )}
        </div>
      )}

      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-6 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{workout.title}</h1>
            <p className="text-slate-300">{workout.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className={categoryColors[workout.category]}>
              {categoryLabels[workout.category] || workout.category}
            </Badge>
            <Badge variant="outline" className="text-slate-400 border-slate-700 capitalize">
              {difficultyLabels[workout.difficulty]}
            </Badge>
            <Badge variant="outline" className="text-slate-400 border-slate-700">
              {workout.days?.length || 0} dias
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-slate-400 text-xs">Duração</p>
                <p className="text-white font-semibold">{workout.duration_minutes} min</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-slate-400 text-xs">Exercícios</p>
                <p className="text-white font-semibold">{totalExercises}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dias do Treino */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Dias do Treino</h3>
        {workout.days && workout.days.length > 0 ? (
          workout.days.map((day, dayIndex) => (
            <motion.div key={dayIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: dayIndex * 0.1 }}>
              <Card className={`border-slate-800 ${isLocked ? 'bg-slate-900/30' : 'bg-slate-900/50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-semibold">📅 Dia {day.day_number}</h4>
                      {user?.selected_workout_id === workout.id && user?.completed_workout_days?.includes(day.day_number) && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-sm">{day.exercises?.length || 0} exercícios</span>
                      {!isLocked && hasMultipleDays && (
                        <Button
                          size="sm"
                          onClick={() => handleStartWorkout(day.day_number)}
                          className="bg-blue-600 hover:bg-blue-700 h-8 px-3"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Treinar
                        </Button>
                      )}
                    </div>
                  </div>

                  {isLocked ? (
                      <div className="flex items-center justify-center py-8">
                        <Lock className="w-6 h-6 text-slate-600" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {day.exercises?.map((exercise, exIndex) => {
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
                            <div key={exIndex} className="bg-slate-800/50 p-3 rounded-lg">
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-blue-600/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-blue-400 text-xs font-bold">{exIndex + 1}</span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-white font-medium mb-1">{exercise.exercise_name}</p>
                                  <div className="flex flex-wrap gap-1.5 text-xs">
                                    {exercise.sets?.map((set, setIndex) => (
                                      <span 
                                        key={setIndex} 
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
                                  {exercise.notes && (
                                    <p className="text-slate-500 text-xs mt-2">💡 {exercise.notes}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <p className="text-slate-400 text-center py-8">Nenhum exercício configurado</p>
        )}
      </div>

      {/* Botões de Ação */}
      {fromSelection ? (
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("WorkoutSelection"))}
            className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 py-6"
          >
            Ver Outros Treinos
          </Button>
          <Button
            onClick={handleSelectWorkout}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-6"
          >
            {isLocked ? 'Assinar Premium' : 'Selecionar Este Treino'}
          </Button>
        </div>
      ) : (
        <>
          {isLocked ? (
            <Button
              onClick={() => navigate(createPageUrl("Subscription"))}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-6"
            >
              <Lock className="w-5 h-5 mr-2" />
              Assinar Premium para Desbloquear
            </Button>
          ) : (
            !hasMultipleDays && (
              <Button onClick={() => handleStartWorkout()} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6">
                <Play className="w-5 h-5 mr-2" />
                Iniciar Treino
              </Button>
            )
          )}
        </>
      )}
    </div>
  );
}