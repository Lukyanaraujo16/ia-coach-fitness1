
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Check, Clock, Zap } from "lucide-react";
import { motion } from "framer-motion";

const categoryLabels = {
  strength: "Força",
  cardio: "Cardio",
  hiit: "HIIT",
  flexibility: "Flexibilidade",
  full_body: "Corpo Inteiro",
};

const difficultyLabels = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

const locationLabels = {
  gym: "Academia",
  home: "Casa",
  both: "Ambos",
};

export default function WorkoutSelection() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [checkedUser, setCheckedUser] = useState(false); // Added state

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ['workouts'],
    queryFn: () => base44.entities.Workout.list(),
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Só redireciona se já tem treino selecionado E ainda não checou
        if (currentUser.selected_workout_id && !checkedUser) {
          setCheckedUser(true); // Mark as checked to prevent re-navigation
          navigate(createPageUrl("Home"), { replace: true });
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    
    // Only load user if not already checked to prevent infinite loop or unnecessary calls
    if (!checkedUser) {
      loadUser();
    }
  }, []); // Array vazio - só executa uma vez

  const filteredWorkouts = workouts.filter(workout => {
    const matchesLevel = workout.difficulty === user?.fitness_level;
    const matchesLocation = workout.training_location === user?.training_location || workout.training_location === 'both';
    return matchesLevel && matchesLocation;
  });

  const handleSelectWorkout = async () => {
    if (!selectedWorkout) return;
    
    try {
      await base44.auth.updateMe({
        selected_workout_id: selectedWorkout.id,
        current_workout_day: 1,
        completed_workout_days: [],
      });
      navigate(createPageUrl("Home"));
    } catch (error) {
      console.error("Error selecting workout:", error);
    }
  };

  const handleViewDetails = (workout) => {
    navigate(createPageUrl("WorkoutDetail") + `?id=${workout.id}&from=selection`);
  };

  if (isLoading || !user || !checkedUser) { // Include checkedUser in loading state to prevent flickering
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Escolha seu Treino
          </h1>
          <p className="text-slate-400 mb-2">
            Selecionamos os melhores treinos para você com base no seu perfil
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Badge variant="outline" className="text-slate-300 border-slate-700">
              Nível: {difficultyLabels[user.fitness_level]}
            </Badge>
            <Badge variant="outline" className="text-slate-300 border-slate-700">
              Local: {locationLabels[user.training_location]}
            </Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {filteredWorkouts.map((workout) => (
            <motion.div
              key={workout.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card
                className={`cursor-pointer transition-all duration-300 overflow-hidden ${
                  selectedWorkout?.id === workout.id
                    ? "border-blue-600 bg-blue-600/10"
                    : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                }`}
                onClick={() => setSelectedWorkout(workout)}
              >
                {workout.image_url && (
                  <div className="h-32 bg-gradient-to-br from-blue-900/30 to-slate-900 relative overflow-hidden">
                    <img
                      src={workout.image_url}
                      alt={workout.title}
                      className="w-full h-full object-cover opacity-60"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white mb-2">{workout.title}</CardTitle>
                      <p className="text-slate-400 text-sm line-clamp-2">{workout.description}</p>
                    </div>
                    {selectedWorkout?.id === workout.id && (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-500/20 text-blue-400">
                      {categoryLabels[workout.category]}
                    </Badge>
                    <Badge variant="outline" className="text-slate-400 border-slate-700">
                      {workout.days?.length || 0} dias
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-slate-300 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{workout.duration_minutes}min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      <span>{workout.days?.reduce((sum, day) => sum + (day.exercises?.length || 0), 0)} exercícios</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(workout);
                    }}
                    className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Ver Detalhes
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredWorkouts.length === 0 && (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-12 text-center">
              <p className="text-slate-400 mb-4">
                Nenhum treino encontrado para seu perfil
              </p>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("Workouts"))}
                className="border-slate-700 text-slate-300"
              >
                Ver Todos os Treinos
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("Workouts"))}
            className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 py-6"
          >
            Ver Outros Treinos
          </Button>
          <Button
            onClick={handleSelectWorkout}
            disabled={!selectedWorkout}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-6"
          >
            Selecionar Treino
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
