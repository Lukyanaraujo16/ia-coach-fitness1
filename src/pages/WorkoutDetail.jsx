import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Zap, Play, Lock, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function WorkoutDetail() {
  const navigate = useNavigate();
  const [workout, setWorkout] = useState(null);
  const [user, setUser] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const workoutId = urlParams.get('id');

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

  const isPremium = user?.subscription_status === 'premium';
  const isLocked = workout?.is_premium && !isPremium;

  if (!workout) {
    return (
      <div className="py-6">
        <p className="text-slate-400 text-center">Carregando...</p>
      </div>
    );
  }

  const categoryColors = {
    strength: "bg-orange-500/20 text-orange-400",
    cardio: "bg-red-500/20 text-red-400",
    hiit: "bg-purple-500/20 text-purple-400",
    flexibility: "bg-green-500/20 text-green-400",
    full_body: "bg-blue-500/20 text-blue-400",
  };

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(createPageUrl("Workouts"))}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-bold text-white flex-1">Detalhes do Treino</h2>
      </div>

      {/* Hero Image */}
      {workout.image_url && (
        <div className="relative h-48 bg-gradient-to-br from-blue-900/30 to-slate-900 rounded-2xl overflow-hidden">
          <img
            src={workout.image_url}
            alt={workout.title}
            className="w-full h-full object-cover opacity-60"
          />
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

      {/* Info Card */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-6 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{workout.title}</h1>
            <p className="text-slate-300">{workout.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className={categoryColors[workout.category]}>
              {workout.category}
            </Badge>
            <Badge variant="outline" className="text-slate-400 border-slate-700">
              {workout.difficulty}
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
                <p className="text-white font-semibold">{workout.exercises?.length || 0}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercises List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Exercícios</h3>
        {workout.exercises && workout.exercises.length > 0 ? (
          workout.exercises.map((exercise, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`border-slate-800 ${isLocked ? 'bg-slate-900/30' : 'bg-slate-900/50'}`}>
                <CardContent className="p-4">
                  {isLocked && (
                    <div className="flex items-center justify-center py-8">
                      <Lock className="w-6 h-6 text-slate-600" />
                    </div>
                  )}
                  {!isLocked && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-400 font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">
                          Exercício {index + 1}
                        </h4>
                        <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                          <div className="flex items-center gap-1">
                            <span>Séries:</span>
                            <span className="text-white font-medium">{exercise.sets}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>Reps:</span>
                            <span className="text-white font-medium">{exercise.reps}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>Descanso:</span>
                            <span className="text-white font-medium">{exercise.rest_seconds}s</span>
                          </div>
                        </div>
                        {exercise.notes && (
                          <p className="text-slate-500 text-sm mt-2">{exercise.notes}</p>
                        )}
                      </div>
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

      {/* CTA */}
      {isLocked ? (
        <Button
          onClick={() => navigate(createPageUrl("Subscription"))}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-6"
        >
          <Lock className="w-5 h-5 mr-2" />
          Assinar Premium para Desbloquear
        </Button>
      ) : (
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6"
        >
          <Play className="w-5 h-5 mr-2" />
          Iniciar Treino
        </Button>
      )}
    </div>
  );
}