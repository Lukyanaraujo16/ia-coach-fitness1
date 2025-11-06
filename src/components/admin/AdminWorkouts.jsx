
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Lock } from "lucide-react";
import WorkoutFormModal from "./WorkoutFormModal";
import AIWorkoutGenerator from "./AIWorkoutGenerator";
import { Label } from "@/components/ui/label"; // Added Label import

export default function AdminWorkouts({ workouts = [], exercises = [] }) {
  const [showForm, setShowForm] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [workoutToCopy, setWorkoutToCopy] = useState(null);
  const [targetUserEmail, setTargetUserEmail] = useState("");
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const deleteWorkoutMutation = useMutation({
    mutationFn: (workoutId) => base44.entities.Workout.delete(workoutId),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-workouts']);
      queryClient.invalidateQueries(['workouts']);
    },
  });

  const copyWorkoutMutation = useMutation({
    mutationFn: async ({ workout, userEmail }) => {
      const newWorkout = {
        ...workout,
        id: undefined, // Remove ID to create a new entry
        title: `${workout.title} (Cópia)`,
        is_public: false, // Copied workouts should be private by default for the target user
        created_for_user: userEmail,
      };
      // Remove fields that should not be copied or are auto-generated
      delete newWorkout.created_date;
      delete newWorkout.updated_date;
      delete newWorkout.created_by;
      return base44.entities.Workout.create(newWorkout);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-workouts']);
      queryClient.invalidateQueries(['workouts']);
      setShowCopyModal(false);
      setWorkoutToCopy(null);
      setTargetUserEmail("");
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

  const handleCopy = (workout) => {
    setWorkoutToCopy(workout);
    setShowCopyModal(true);
  };

  const handleConfirmCopy = () => {
    if (!targetUserEmail) {
      alert("Selecione um usuário");
      return;
    }
    if (workoutToCopy) {
      copyWorkoutMutation.mutate({ workout: workoutToCopy, userEmail: targetUserEmail });
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

  const categoryLabels = {
    strength: "Força",
    cardio: "Cardio",
    hiit: "HIIT",
    flexibility: "Flexibilidade",
    full_body: "Corpo Inteiro",
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-white">Gerenciar Treinos</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAIGenerator(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <span className="text-xl mr-2">✨</span>
                Gerar com IA
              </Button>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Treino
              </Button>
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-2">
            Use a IA para gerar treinos completos automaticamente ou crie manualmente
          </p>
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
                        {workout.created_for_user && (
                          <Badge className="bg-blue-500/20 text-blue-400 text-xs">Privado</Badge>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm line-clamp-2">
                        {workout.description}
                      </p>
                      {workout.created_for_user && (
                        <p className="text-slate-500 text-xs mt-1">
                          Para: {workout.created_for_user}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className={categoryColors[workout.category]}>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(workout)}
                      className="flex-1 bg-purple-900/20 border-purple-700 text-purple-400 hover:bg-purple-900/40 hover:text-purple-300"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Copiar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(workout)}
                      className="flex-1 bg-blue-900/20 border-blue-700 text-blue-400 hover:bg-blue-900/40 hover:text-blue-300"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(workout.id)}
                      className="bg-red-900/20 border-red-700 text-red-400 hover:bg-red-900/40 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
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
          exercises={exercises}
          onClose={handleCloseForm}
        />
      )}

      {showAIGenerator && (
        <AIWorkoutGenerator onClose={() => setShowAIGenerator(false)} />
      )}

      {/* Copy Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-slate-800 max-w-md w-full">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-white">Copiar Treino para Usuário</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-slate-300 mb-2">Treino: <span className="font-semibold">{workoutToCopy?.title}</span></p>
                <p className="text-slate-400 text-sm">Selecione o usuário que receberá uma cópia deste treino</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-select" className="text-slate-300">Usuário</Label>
                <select
                  id="user-select"
                  value={targetUserEmail}
                  onChange={(e) => setTargetUserEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
                >
                  <option value="">Selecione um usuário...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.email}>
                      {user.full_name || user.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCopyModal(false);
                    setWorkoutToCopy(null);
                    setTargetUserEmail("");
                  }}
                  className="flex-1 border-slate-700 text-slate-300"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmCopy}
                  disabled={copyWorkoutMutation.isPending || !targetUserEmail}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {copyWorkoutMutation.isPending ? "Copiando..." : "Copiar Treino"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
