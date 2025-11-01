import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2 } from "lucide-react";
import ExerciseFormModal from "./ExerciseFormModal";

const categoryColors = {
  chest: "bg-red-500/20 text-red-400",
  back: "bg-blue-500/20 text-blue-400",
  legs: "bg-green-500/20 text-green-400",
  shoulders: "bg-yellow-500/20 text-yellow-400",
  arms: "bg-purple-500/20 text-purple-400",
  core: "bg-orange-500/20 text-orange-400",
  cardio: "bg-pink-500/20 text-pink-400",
  full_body: "bg-indigo-500/20 text-indigo-400",
};

export default function AdminExercises({ exercises = [] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const queryClient = useQueryClient();

  const deleteExerciseMutation = useMutation({
    mutationFn: (exerciseId) => base44.entities.Exercise.delete(exerciseId),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-exercises']);
      queryClient.invalidateQueries(['exercises']);
    },
  });

  const handleEdit = (exercise) => {
    setEditingExercise(exercise);
    setShowForm(true);
  };

  const handleDelete = (exerciseId) => {
    if (confirm('Tem certeza que deseja excluir este exercício?')) {
      deleteExerciseMutation.mutate(exerciseId);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingExercise(null);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Gerenciar Exercícios</CardTitle>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Exercício
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {exercises.map((exercise) => (
              <Card key={exercise.id} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-2">{exercise.name}</h4>
                      <p className="text-slate-400 text-sm line-clamp-2">
                        {exercise.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className={categoryColors[exercise.category]}>
                      {exercise.category}
                    </Badge>
                    <Badge variant="outline" className="text-slate-400 border-slate-600 capitalize">
                      {exercise.difficulty === 'beginner' ? 'Iniciante' : 
                       exercise.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
                    </Badge>
                    <Badge variant="outline" className="text-slate-400 border-slate-600">
                      {exercise.equipment}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(exercise)}
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(exercise.id)}
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

          {exercises.length === 0 && (
            <p className="text-slate-400 text-center py-12">
              Nenhum exercício cadastrado ainda
            </p>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <ExerciseFormModal
          exercise={editingExercise}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}