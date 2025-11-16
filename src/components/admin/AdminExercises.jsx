
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2, Upload } from "lucide-react";
import ExerciseFormModal from "./ExerciseFormModal";
import ImportExercisesModal from "./ImportExercisesModal";

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

const categoryLabels = {
  chest: "Peito",
  back: "Costas",
  legs: "Pernas",
  shoulders: "Ombros",
  arms: "Braços",
  core: "Core",
  cardio: "Cardio",
  full_body: "Corpo Inteiro",
};

export default function AdminExercises({ exercises = [] }) {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
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

  const filteredExercises = categoryFilter === "all" 
    ? exercises 
    : exercises.filter(ex => ex.category === categoryFilter);

  // Group by category
  const exercisesByCategory = filteredExercises.reduce((acc, exercise) => {
    const cat = exercise.category || 'full_body';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(exercise);
    return acc;
  }, {});

  // Sort exercises alphabetically within each category
  Object.keys(exercisesByCategory).forEach(category => {
    exercisesByCategory[category].sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  });

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-white">Gerenciar Exercícios</CardTitle>
            <div className="flex items-center gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Filtrar categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  <SelectItem value="chest">Peito</SelectItem>
                  <SelectItem value="back">Costas</SelectItem>
                  <SelectItem value="legs">Pernas</SelectItem>
                  <SelectItem value="shoulders">Ombros</SelectItem>
                  <SelectItem value="arms">Braços</SelectItem>
                  <SelectItem value="core">Core</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                  <SelectItem value="full_body">Corpo Inteiro</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => setShowImport(true)}
                variant="outline"
                className="bg-purple-900/20 border-purple-700 text-purple-400 hover:bg-purple-900/40 hover:text-purple-300"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </Button>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Exercício
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(exercisesByCategory).map(([category, categoryExercises]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Badge className={categoryColors[category]}>
                  {categoryLabels[category] || category}
                </Badge>
                <span className="text-slate-500 text-sm">({categoryExercises.length})</span>
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {categoryExercises.map((exercise) => (
                  <Card key={exercise.id} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold mb-1 truncate">{exercise.name}</h4>
                          <p className="text-slate-400 text-sm line-clamp-2 mb-2">
                            {exercise.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-slate-400 border-slate-600 text-xs">
                              {exercise.difficulty === 'beginner' ? 'Iniciante' : 
                               exercise.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
                            </Badge>
                            <Badge variant="outline" className="text-slate-400 border-slate-600 text-xs">
                              {exercise.equipment}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(exercise)}
                            className="h-8 w-8 bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 hover:text-blue-300"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(exercise.id)}
                            className="h-8 w-8 bg-red-900/20 text-red-400 hover:bg-red-900/40 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {filteredExercises.length === 0 && (
            <p className="text-slate-400 text-center py-12">
              Nenhum exercício encontrado
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

      {showImport && (
        <ImportExercisesModal
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
