import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Lock, Dumbbell } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import WorkoutFormModal from "../components/admin/WorkoutFormModal";

export default function MyWorkouts() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const { data: myWorkouts = [] } = useQuery({
    queryKey: ['my-custom-workouts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allWorkouts = await base44.entities.Workout.list();
      return allWorkouts.filter(w => w.created_for_user === user.email && w.is_public === false);
    },
    enabled: !!user?.email,
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => base44.entities.Exercise.list(),
  });

  const deleteWorkoutMutation = useMutation({
    mutationFn: (workoutId) => base44.entities.Workout.delete(workoutId),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-custom-workouts']);
      queryClient.invalidateQueries(['workouts']);
    },
  });

  const handleEdit = (workout) => {
    setEditingWorkout(workout);
    setShowForm(true);
  };

  const handleDelete = (workoutId) => {
    if (confirm('Tem certeza que deseja excluir este treino?')) {
      deleteWorkoutMutation.mutate(workoutId);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingWorkout(null);
  };

  const categoryLabels = {
    strength: "Força",
    cardio: "Cardio",
    hiit: "HIIT",
    flexibility: "Flexibilidade",
    full_body: "Corpo Inteiro",
  };

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Meus Treinos</h2>
          <p className="text-slate-400 mt-1">Crie e gerencie seus próprios treinos</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Treino
        </Button>
      </div>

      {myWorkouts.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {myWorkouts.map((workout) => (
            <Card key={workout.id} className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-white font-semibold">{workout.title}</h4>
                      <Lock className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-slate-400 text-sm line-clamp-2">
                      {workout.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge className="bg-blue-500/20 text-blue-400">
                    {categoryLabels[workout.category] || workout.category}
                  </Badge>
                  <Badge variant="outline" className="text-slate-400 border-slate-600">
                    {workout.difficulty === 'beginner' ? 'Iniciante' : 
                     workout.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
                  </Badge>
                  <Badge variant="outline" className="text-slate-400 border-slate-600">
                    {workout.days?.length || 0} dias
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Link to={createPageUrl("WorkoutDetail") + `?id=${workout.id}`} className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-slate-800 border-slate-600 text-slate-200"
                    >
                      Ver Detalhes
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(workout)}
                    className="bg-blue-900/20 border-blue-700 text-blue-400 hover:bg-blue-900/40"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(workout.id)}
                    className="bg-red-900/20 border-red-700 text-red-400 hover:bg-red-900/40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="py-24 text-center">
            <Dumbbell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              Nenhum treino criado ainda
            </h3>
            <p className="text-slate-400 mb-6">
              Crie seus próprios treinos personalizados
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Meu Primeiro Treino
            </Button>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <WorkoutFormModal
          workout={editingWorkout}
          exercises={exercises}
          onClose={handleCloseForm}
          isUserCreated={true}
          userEmail={user?.email}
        />
      )}
    </div>
  );
}