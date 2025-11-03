import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Trash2, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function WorkoutFormModal({ workout, exercises, onClose }) {
  const queryClient = useQueryClient();
  const [expandedDay, setExpandedDay] = useState(0);
  const [expandedExercise, setExpandedExercise] = useState(null);
  
  const [formData, setFormData] = useState(
    workout || {
      title: "",
      description: "",
      category: "strength",
      difficulty: "intermediate",
      training_location: "gym",
      duration_minutes: 60,
      is_premium: false,
      days: [
        {
          day_number: 1,
          title: "Dia 1",
          exercises: [],
        },
      ],
    }
  );

  const createWorkoutMutation = useMutation({
    mutationFn: (data) => {
      if (workout) {
        return base44.entities.Workout.update(workout.id, data);
      }
      return base44.entities.Workout.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["all-workouts"]);
      queryClient.invalidateQueries(["workouts"]);
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createWorkoutMutation.mutate(formData);
  };

  const addDay = () => {
    setFormData({
      ...formData,
      days: [
        ...formData.days,
        {
          day_number: formData.days.length + 1,
          title: `Dia ${formData.days.length + 1}`,
          exercises: [],
        },
      ],
    });
    setExpandedDay(formData.days.length);
  };

  const removeDay = (dayIndex) => {
    const newDays = formData.days.filter((_, i) => i !== dayIndex);
    setFormData({ ...formData, days: newDays });
  };

  const updateDay = (dayIndex, field, value) => {
    const newDays = [...formData.days];
    newDays[dayIndex][field] = value;
    setFormData({ ...formData, days: newDays });
  };

  const addExercise = (dayIndex) => {
    const newDays = [...formData.days];
    newDays[dayIndex].exercises.push({
      exercise_id: "",
      exercise_name: "",
      exercise_category: "",
      sets: [{ times: 1, reps: "10", rest_seconds: 60, notes: "" }],
      notes: "",
    });
    setFormData({ ...formData, days: newDays });
    setExpandedExercise(`${dayIndex}-${newDays[dayIndex].exercises.length - 1}`);
  };

  const removeExercise = (dayIndex, exerciseIndex) => {
    const newDays = [...formData.days];
    newDays[dayIndex].exercises.splice(exerciseIndex, 1);
    setFormData({ ...formData, days: newDays });
  };

  const updateExercise = (dayIndex, exerciseIndex, field, value) => {
    const newDays = [...formData.days];
    if (field === "exercise_id") {
      const selectedExercise = exercises.find((ex) => ex.id === value);
      newDays[dayIndex].exercises[exerciseIndex] = {
        ...newDays[dayIndex].exercises[exerciseIndex],
        exercise_id: value,
        exercise_name: selectedExercise?.name || "",
        exercise_category: selectedExercise?.category || "",
      };
    } else {
      newDays[dayIndex].exercises[exerciseIndex][field] = value;
    }
    setFormData({ ...formData, days: newDays });
  };

  const addSet = (dayIndex, exerciseIndex) => {
    const newDays = [...formData.days];
    newDays[dayIndex].exercises[exerciseIndex].sets.push({
      times: 1,
      reps: "10",
      rest_seconds: 60,
      notes: "",
    });
    setFormData({ ...formData, days: newDays });
  };

  const removeSet = (dayIndex, exerciseIndex, setIndex) => {
    const newDays = [...formData.days];
    newDays[dayIndex].exercises[exerciseIndex].sets.splice(setIndex, 1);
    setFormData({ ...formData, days: newDays });
  };

  const updateSet = (dayIndex, exerciseIndex, setIndex, field, value) => {
    const newDays = [...formData.days];
    newDays[dayIndex].exercises[exerciseIndex].sets[setIndex][field] = value;
    setFormData({ ...formData, days: newDays });
  };

  const toggleExercise = (dayIndex, exerciseIndex) => {
    const key = `${dayIndex}-${exerciseIndex}`;
    setExpandedExercise(expandedExercise === key ? null : key);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="bg-slate-900 border-slate-800 max-w-4xl w-full my-8">
        <CardHeader className="border-b border-slate-800 flex flex-row items-center justify-between sticky top-0 bg-slate-900 z-10">
          <CardTitle className="text-white">
            {workout ? "Editar Treino" : "Novo Treino"}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold text-lg">Informações Básicas</h3>
              
              <div className="space-y-2">
                <Label className="text-slate-300">Título *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white h-20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Categoria</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
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
                  <Label className="text-slate-300">Dificuldade</Label>
                  <Select value={formData.difficulty} onValueChange={(v) => setFormData({ ...formData, difficulty: v })}>
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
                  <Label className="text-slate-300">Local</Label>
                  <Select value={formData.training_location} onValueChange={(v) => setFormData({ ...formData, training_location: v })}>
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
              </div>

              <div className="flex items-center gap-4">
                <div className="space-y-2 flex-1">
                  <Label className="text-slate-300">Duração (min)</Label>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="flex items-center gap-2 pt-7">
                  <input
                    type="checkbox"
                    id="premium"
                    checked={formData.is_premium}
                    onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="premium" className="text-slate-300">Premium</Label>
                </div>
              </div>
            </div>

            {/* Dias do Treino */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold text-lg">Dias do Treino</h3>
                <Button type="button" onClick={addDay} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Dia
                </Button>
              </div>

              {formData.days.map((day, dayIndex) => (
                <Card key={dayIndex} className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setExpandedDay(expandedDay === dayIndex ? null : dayIndex)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        {expandedDay === dayIndex ? (
                          <ChevronDown className="w-5 h-5 text-blue-400" />
                        ) : (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        )}
                        <div className="flex-1">
                          <h4 className="text-white font-semibold">Dia {day.day_number}</h4>
                          <p className="text-slate-400 text-sm">{day.exercises.length} exercícios</p>
                        </div>
                      </button>
                      {formData.days.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDay(dayIndex)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  {expandedDay === dayIndex && (
                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Título do Dia</Label>
                        <Input
                          value={day.title}
                          onChange={(e) => updateDay(dayIndex, "title", e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white"
                          placeholder="Ex: Treino de Peito"
                        />
                      </div>

                      {/* Exercícios */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-slate-300">Exercícios</Label>
                          <Button
                            type="button"
                            onClick={() => addExercise(dayIndex)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 h-8"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Adicionar
                          </Button>
                        </div>

                        {day.exercises.map((exercise, exerciseIndex) => {
                          const isExpanded = expandedExercise === `${dayIndex}-${exerciseIndex}`;
                          return (
                            <Card key={exerciseIndex} className="bg-slate-900/50 border-slate-600">
                              <CardHeader className="p-3">
                                <div className="flex items-start gap-2">
                                  <GripVertical className="w-5 h-5 text-slate-500 mt-1 flex-shrink-0" />
                                  <button
                                    type="button"
                                    onClick={() => toggleExercise(dayIndex, exerciseIndex)}
                                    className="flex-1 text-left"
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge className="bg-blue-600/20 text-blue-400 text-xs">
                                        {exerciseIndex + 1}
                                      </Badge>
                                      <span className="text-white font-medium text-sm">
                                        {exercise.exercise_name || "Selecione um exercício"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                      <span>{exercise.sets?.length || 0} séries</span>
                                      {!isExpanded && (
                                        <ChevronDown className="w-4 h-4" />
                                      )}
                                      {isExpanded && (
                                        <ChevronUp className="w-4 h-4" />
                                      )}
                                    </div>
                                  </button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeExercise(dayIndex, exerciseIndex)}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8 flex-shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </CardHeader>

                              {isExpanded && (
                                <CardContent className="p-3 space-y-3 border-t border-slate-700">
                                  {/* Seleção de Exercício */}
                                  <div className="space-y-2">
                                    <Label className="text-slate-300 text-sm">Exercício</Label>
                                    <Select
                                      value={exercise.exercise_id}
                                      onValueChange={(v) => updateExercise(dayIndex, exerciseIndex, "exercise_id", v)}
                                    >
                                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                                        <SelectValue placeholder="Selecione..." />
                                      </SelectTrigger>
                                      <SelectContent className="max-h-60">
                                        {exercises.map((ex) => (
                                          <SelectItem key={ex.id} value={ex.id}>
                                            {ex.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {/* Séries */}
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-slate-300 text-sm">Séries</Label>
                                      <Button
                                        type="button"
                                        onClick={() => addSet(dayIndex, exerciseIndex)}
                                        size="sm"
                                        className="bg-purple-600 hover:bg-purple-700 h-7 text-xs"
                                      >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Série
                                      </Button>
                                    </div>

                                    {exercise.sets?.map((set, setIndex) => (
                                      <Card key={setIndex} className="bg-slate-800/50 border-slate-600 p-3">
                                        <div className="space-y-3">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-white text-sm font-medium">
                                              Série {setIndex + 1}
                                            </span>
                                            {exercise.sets.length > 1 && (
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeSet(dayIndex, exerciseIndex, setIndex)}
                                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-7 w-7"
                                              >
                                                <X className="w-3 h-3" />
                                              </Button>
                                            )}
                                          </div>

                                          <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                              <Label className="text-slate-400 text-xs">Vezes</Label>
                                              <Input
                                                type="number"
                                                value={set.times}
                                                onChange={(e) => updateSet(dayIndex, exerciseIndex, setIndex, "times", parseInt(e.target.value))}
                                                className="bg-slate-700 border-slate-600 text-white h-9"
                                                min="1"
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <Label className="text-slate-400 text-xs">Reps</Label>
                                              <Input
                                                value={set.reps}
                                                onChange={(e) => updateSet(dayIndex, exerciseIndex, setIndex, "reps", e.target.value)}
                                                className="bg-slate-700 border-slate-600 text-white h-9"
                                                placeholder="10-12"
                                              />
                                            </div>
                                          </div>

                                          <div className="space-y-1">
                                            <Label className="text-slate-400 text-xs">Descanso (seg)</Label>
                                            <Input
                                              type="number"
                                              value={set.rest_seconds}
                                              onChange={(e) => updateSet(dayIndex, exerciseIndex, setIndex, "rest_seconds", parseInt(e.target.value))}
                                              className="bg-slate-700 border-slate-600 text-white h-9"
                                            />
                                          </div>

                                          <div className="space-y-1">
                                            <Label className="text-slate-400 text-xs">Observações</Label>
                                            <Input
                                              value={set.notes}
                                              onChange={(e) => updateSet(dayIndex, exerciseIndex, setIndex, "notes", e.target.value)}
                                              className="bg-slate-700 border-slate-600 text-white h-9"
                                              placeholder="Ex: aumentar carga"
                                            />
                                          </div>
                                        </div>
                                      </Card>
                                    ))}
                                  </div>

                                  {/* Notas do Exercício */}
                                  <div className="space-y-1">
                                    <Label className="text-slate-300 text-sm">Notas do Exercício</Label>
                                    <Textarea
                                      value={exercise.notes}
                                      onChange={(e) => updateExercise(dayIndex, exerciseIndex, "notes", e.target.value)}
                                      className="bg-slate-800 border-slate-600 text-white h-16 text-sm"
                                      placeholder="Dicas de execução..."
                                    />
                                  </div>
                                </CardContent>
                              )}
                            </Card>
                          );
                        })}

                        {day.exercises.length === 0 && (
                          <p className="text-slate-500 text-center py-6 text-sm">
                            Nenhum exercício adicionado ainda
                          </p>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3 pt-4 border-t border-slate-800 sticky bottom-0 bg-slate-900 pb-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white h-12"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createWorkoutMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 h-12 text-base font-semibold"
              >
                {createWorkoutMutation.isPending ? "Salvando..." : workout ? "Atualizar" : "Criar Treino"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}