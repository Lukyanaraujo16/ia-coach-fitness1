import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Trash2 } from "lucide-react";

export default function WorkoutFormModal({ workout, onClose }) {
  const queryClient = useQueryClient();
  
  // Carregar exercícios diretamente aqui
  const { data: exercises = [], isLoading: loadingExercises } = useQuery({
    queryKey: ['all-exercises'],
    queryFn: () => base44.entities.Exercise.list(),
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'full_body',
    difficulty: 'beginner',
    training_location: 'both',
    duration_minutes: '',
    is_premium: false,
    image_url: '',
    days: [{ day_number: 1, title: 'Dia 1', exercises: [] }],
  });

  const [numDays, setNumDays] = useState(1);

  useEffect(() => {
    if (workout) {
      setFormData({
        title: workout.title || '',
        description: workout.description || '',
        category: workout.category || 'full_body',
        difficulty: workout.difficulty || 'beginner',
        training_location: workout.training_location || 'both',
        duration_minutes: workout.duration_minutes || '',
        is_premium: workout.is_premium || false,
        image_url: workout.image_url || '',
        days: workout.days && workout.days.length > 0 ? workout.days : [{ day_number: 1, title: 'Dia 1', exercises: [] }],
      });
      setNumDays(workout.days?.length || 1);
    }
  }, [workout]);

  useEffect(() => {
    const currentDays = formData.days.length;
    if (numDays > currentDays) {
      const newDays = [...formData.days];
      for (let i = currentDays; i < numDays; i++) {
        newDays.push({
          day_number: i + 1,
          title: `Dia ${i + 1}`,
          exercises: [],
        });
      }
      setFormData(prev => ({ ...prev, days: newDays }));
    } else if (numDays < currentDays) {
      setFormData(prev => ({ ...prev, days: prev.days.slice(0, numDays) }));
    }
  }, [numDays]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (workout) {
        return base44.entities.Workout.update(workout.id, data);
      }
      return base44.entities.Workout.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-workouts']);
      queryClient.invalidateQueries(['workouts']);
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      ...formData,
      duration_minutes: parseInt(formData.duration_minutes) || 0,
    });
  };

  const addExerciseToDay = (dayIndex) => {
    const newDays = [...formData.days];
    newDays[dayIndex].exercises.push({
      exercise_id: '',
      exercise_name: '',
      sets: [{ reps: '10', rest_seconds: 60 }],
      notes: '',
    });
    setFormData({ ...formData, days: newDays });
  };

  const removeExerciseFromDay = (dayIndex, exerciseIndex) => {
    const newDays = [...formData.days];
    newDays[dayIndex].exercises.splice(exerciseIndex, 1);
    setFormData({ ...formData, days: newDays });
  };

  const updateExercise = (dayIndex, exerciseIndex, field, value) => {
    const newDays = [...formData.days];
    newDays[dayIndex].exercises[exerciseIndex][field] = value;
    
    if (field === 'exercise_id') {
      const selectedEx = exercises.find(ex => ex.id === value);
      newDays[dayIndex].exercises[exerciseIndex].exercise_name = selectedEx?.name || '';
    }
    
    setFormData({ ...formData, days: newDays });
  };

  const addSetToExercise = (dayIndex, exerciseIndex) => {
    const newDays = [...formData.days];
    newDays[dayIndex].exercises[exerciseIndex].sets.push({ reps: '10', rest_seconds: 60 });
    setFormData({ ...formData, days: newDays });
  };

  const removeSetFromExercise = (dayIndex, exerciseIndex, setIndex) => {
    const newDays = [...formData.days];
    if (newDays[dayIndex].exercises[exerciseIndex].sets.length > 1) {
      newDays[dayIndex].exercises[exerciseIndex].sets.splice(setIndex, 1);
      setFormData({ ...formData, days: newDays });
    }
  };

  const updateSet = (dayIndex, exerciseIndex, setIndex, field, value) => {
    const newDays = [...formData.days];
    newDays[dayIndex].exercises[exerciseIndex].sets[setIndex][field] = 
      field === 'rest_seconds' ? parseInt(value) || 60 : value;
    setFormData({ ...formData, days: newDays });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="bg-slate-900 border-slate-800 max-w-5xl w-full my-8">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <CardTitle className="text-white">
            {workout ? 'Editar Treino' : 'Novo Treino'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5 text-white" />
          </Button>
        </CardHeader>
        <CardContent className="p-6 max-h-[75vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <h3 className="text-lg font-semibold text-white">Informações Básicas</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Título *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Ex: Treino de Peito e Tríceps"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white h-20"
                    placeholder="Descreva o treino..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Categoria *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strength">Força</SelectItem>
                        <SelectItem value="cardio">Cardio</SelectItem>
                        <SelectItem value="hiit">HIIT</SelectItem>
                        <SelectItem value="flexibility">Flexibilidade</SelectItem>
                        <SelectItem value="full_body">Corpo Inteiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Dificuldade *</Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Iniciante</SelectItem>
                        <SelectItem value="intermediate">Intermediário</SelectItem>
                        <SelectItem value="advanced">Avançado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Local de Treino *</Label>
                    <Select
                      value={formData.training_location}
                      onValueChange={(value) => setFormData({ ...formData, training_location: value })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gym">Academia</SelectItem>
                        <SelectItem value="home">Casa</SelectItem>
                        <SelectItem value="both">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Duração (min) *</Label>
                    <Input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="60"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Número de Dias (1-5) *</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={numDays}
                    onChange={(e) => setNumDays(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_premium"
                    checked={formData.is_premium}
                    onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="is_premium" className="text-slate-300 cursor-pointer">
                    Conteúdo Premium
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Dias do Treino */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">Configurar Dias do Treino</h3>
              <p className="text-slate-400 text-sm">
                Configure os exercícios para cada dia. {loadingExercises ? 'Carregando exercícios...' : `${exercises.length} exercícios disponíveis`}
              </p>
              
              {formData.days.map((day, dayIndex) => (
                <Card key={dayIndex} className="bg-slate-800/30 border-slate-700">
                  <CardHeader className="bg-slate-800/50">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-bold text-lg">📅 Dia {day.day_number}</h4>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addExerciseToDay(dayIndex)}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={loadingExercises}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Exercício
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {day.exercises.length === 0 ? (
                      <div className="text-center py-8 bg-slate-900/30 rounded-lg border-2 border-dashed border-slate-700">
                        <p className="text-slate-500 mb-3">Nenhum exercício adicionado ainda</p>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addExerciseToDay(dayIndex)}
                          className="bg-blue-600 hover:bg-blue-700"
                          disabled={loadingExercises}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Primeiro Exercício
                        </Button>
                      </div>
                    ) : (
                      day.exercises.map((exercise, exIndex) => (
                        <Card key={exIndex} className="bg-slate-900/50 border-slate-700">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-white font-bold text-sm">{exIndex + 1}</span>
                                  </div>
                                  <div className="flex-1">
                                    <Label className="text-slate-300 text-xs mb-1">Exercício *</Label>
                                    <Select
                                      value={exercise.exercise_id}
                                      onValueChange={(value) => updateExercise(dayIndex, exIndex, 'exercise_id', value)}
                                    >
                                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                        <SelectValue placeholder="Selecione um exercício" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {loadingExercises ? (
                                          <div className="p-2 text-slate-400 text-sm">
                                            Carregando exercícios...
                                          </div>
                                        ) : exercises.length === 0 ? (
                                          <div className="p-2 text-slate-400 text-sm">
                                            Nenhum exercício cadastrado. Cadastre exercícios primeiro na aba "Exercícios".
                                          </div>
                                        ) : (
                                          exercises.map((ex) => (
                                            <SelectItem key={ex.id} value={ex.id}>
                                              {ex.name} ({ex.category})
                                            </SelectItem>
                                          ))
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-slate-300 text-xs mb-1">Observações</Label>
                                  <Input
                                    placeholder="Ex: Controlar a descida, manter cotovelos próximos..."
                                    value={exercise.notes}
                                    onChange={(e) => updateExercise(dayIndex, exIndex, 'notes', e.target.value)}
                                    className="bg-slate-800 border-slate-700 text-white text-sm"
                                  />
                                </div>

                                {/* Séries */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-slate-300 text-sm font-semibold">
                                      Séries e Repetições
                                    </Label>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => addSetToExercise(dayIndex, exIndex)}
                                      className="h-7 text-xs border-slate-700 text-slate-300"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Adicionar Série
                                    </Button>
                                  </div>
                                  
                                  <div className="space-y-2 bg-slate-800/30 p-3 rounded-lg">
                                    {exercise.sets.map((set, setIndex) => (
                                      <div key={setIndex} className="flex items-center gap-2">
                                        <span className="text-slate-400 text-sm font-medium w-12">
                                          {setIndex + 1}ª
                                        </span>
                                        <div className="flex-1 grid grid-cols-2 gap-2">
                                          <div>
                                            <Input
                                              placeholder="Reps (ex: 10)"
                                              value={set.reps}
                                              onChange={(e) => updateSet(dayIndex, exIndex, setIndex, 'reps', e.target.value)}
                                              className="bg-slate-800 border-slate-700 text-white text-sm h-9"
                                            />
                                          </div>
                                          <div>
                                            <Input
                                              type="number"
                                              placeholder="Descanso (s)"
                                              value={set.rest_seconds}
                                              onChange={(e) => updateSet(dayIndex, exIndex, setIndex, 'rest_seconds', e.target.value)}
                                              className="bg-slate-800 border-slate-700 text-white text-sm h-9"
                                            />
                                          </div>
                                        </div>
                                        {exercise.sets.length > 1 && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeSetFromExercise(dayIndex, exIndex, setIndex)}
                                            className="h-9 w-9 text-red-400 hover:bg-red-950/50"
                                          >
                                            <X className="w-4 h-4" />
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                    <p className="text-slate-500 text-xs mt-2">
                                      💡 Exemplo: 1x10 (60s), 2x8 (90s), 1x6 (120s)
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeExerciseFromDay(dayIndex, exIndex)}
                                className="text-red-400 hover:bg-red-950/50"
                              >
                                <Trash2 className="w-5 h-5" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3 pt-6 border-t border-slate-800 sticky bottom-0 bg-slate-900 pb-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {saveMutation.isPending ? 'Salvando...' : workout ? 'Atualizar Treino' : 'Criar Treino'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}