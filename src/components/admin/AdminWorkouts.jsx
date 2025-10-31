import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Lock } from "lucide-react";
import WorkoutFormModal from "./WorkoutFormModal";

export default function AdminWorkouts({ workouts = [] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const queryClient = useQueryClient();

  const deleteWorkoutMutation = useMutation({
    mutationFn: (workoutId) => base44.entities.Workout.delete(workoutId),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-workouts']);
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

  const categoryColors = {
    strength: "bg-orange-500/20 text-orange-400",
    cardio: "bg-red-500/20 text-red-400",
    hiit: "bg-purple-500/20 text-purple-400",
    flexibility: "bg-green-500/20 text-green-400",
    full_body: "bg-blue-500/20 text-blue-400",
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Gerenciar Treinos</CardTitle>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Treino
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {workouts.map((workout) => (
              <Card key={workout.id} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-white font-semibold">{workout.title}</h4>
                        {workout.is_premium && (
                          <Lock className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                      <p className="text-slate-400 text-sm line-clamp-2">
                        {workout.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className={categoryColors[workout.category]}>
                      {workout.category}
                    </Badge>
                    <Badge variant="outline" className="text-slate-400 border-slate-600">
                      {workout.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-slate-400 border-slate-600">
                      {workout.duration_minutes}min
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(workout)}
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(workout.id)}
                      className="flex-1 border-red-900/50 text-red-400 hover:bg-red-950/50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {workouts.length === 0 && (
            <p className="text-slate-400 text-center py-12">
              Nenhum treino cadastrado ainda
            </p>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <WorkoutFormModal
          workout={editingWorkout}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}