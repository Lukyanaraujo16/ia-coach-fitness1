
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Trash2, ChevronDown, ChevronUp, GripVertical, CheckSquare, Square, Search, ArrowRight, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function WorkoutFormModal({ workout, exercises, onClose }) {
  const queryClient = useQueryClient();
  const [expandedDay, setExpandedDay] = useState(0);
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkAddStep, setBulkAddStep] = useState(1); // 1: selecionar exercícios, 2: configurar séries
  const [bulkSearchQuery, setBulkSearchQuery] = useState("");
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [currentDayForBulk, setCurrentDayForBulk] = useState(0);
  const [bulkSetsConfig, setBulkSetsConfig] = useState([
    { times: 3, reps: "10-12", rest_seconds: 60, notes: "" }
  ]);
  
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

  const openBulkAdd = (dayIndex) => {
    setCurrentDayForBulk(dayIndex);
    setSelectedExercises([]);
    setBulkSearchQuery("");
    setBulkAddStep(1);
    setBulkSetsConfig([{ times: 3, reps: "10-12", rest_seconds: 60, notes: "" }]);
    setShowBulkAdd(true);
  };

  const toggleExerciseSelection = (exerciseId) => {
    setSelectedExercises(prev => 
      prev.includes(exerciseId) 
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  const handleBulkNext = () => {
    if (bulkAddStep === 1 && selectedExercises.length > 0) {
      setBulkAddStep(2);
    }
  };

  const handleBulkBack = () => {
    setBulkAddStep(1);
  };

  const addBulkSet = () => {
    setBulkSetsConfig([...bulkSetsConfig, { times: 1, reps: "10", rest_seconds: 60, notes: "" }]);
  };

  const removeBulkSet = (index) => {
    if (bulkSetsConfig.length > 1) {
      setBulkSetsConfig(bulkSetsConfig.filter((_, i) => i !== index));
    }
  };

  const updateBulkSet = (index, field, value) => {
    const newSets = [...bulkSetsConfig];
    newSets[index][field] = value;
    setBulkSetsConfig(newSets);
  };

  const addBulkExercises = () => {
    const newDays = [...formData.days];
    const exercisesToAdd = exercises.filter(ex => selectedExercises.includes(ex.id));
    
    exercisesToAdd.forEach(exercise => {
      newDays[currentDayForBulk].exercises.push({
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        exercise_category: exercise.category,
        sets: bulkSetsConfig.map(set => ({ ...set })), // Clone da configuração
        notes: "",
      });
    });
    
    setFormData({ ...formData, days: newDays });
    setShowBulkAdd(false);
    setSelectedExercises([]);
    setBulkAddStep(1);
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

  const filteredExercises = exercises.filter(ex => 
    ex.name.toLowerCase().includes(bulkSearchQuery.toLowerCase()) ||
    ex.category.toLowerCase().includes(bulkSearchQuery.toLowerCase())
  );

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
                        <div className="flex items-center justify-between gap-2">
                          <Label className="text-slate-300">Exercícios</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={() => openBulkAdd(dayIndex)}
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700 h-8"
                            >
                              <CheckSquare className="w-4 h-4 mr-1" />
                              Múltiplos
                            </Button>
                            <Button
                              type="button"
                              onClick={() => addExercise(dayIndex)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 h-8"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Único
                            </Button>
                          </div>
                        </div>

                        {/* Lista de exercícios */}
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

      {/* Modal de Adicionar Múltiplos Exercícios */}
      {showBulkAdd && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-slate-800 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader className="border-b border-slate-800 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">
                  {bulkAddStep === 1 ? "Selecionar Exercícios" : "Configurar Séries"}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowBulkAdd(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-slate-400 text-sm mt-2">
                {bulkAddStep === 1 
                  ? `Selecione os exercícios para o Dia ${currentDayForBulk + 1}`
                  : `Configure as séries que serão aplicadas a todos os ${selectedExercises.length} exercícios`
                }
              </p>
              
              {/* Progress Indicator */}
              <div className="flex items-center gap-2 mt-4">
                <div className={`flex-1 h-2 rounded-full ${bulkAddStep >= 1 ? 'bg-purple-600' : 'bg-slate-700'}`} />
                <div className={`flex-1 h-2 rounded-full ${bulkAddStep >= 2 ? 'bg-purple-600' : 'bg-slate-700'}`} />
              </div>
            </CardHeader>

            {/* STEP 1: Seleção de Exercícios */}
            {bulkAddStep === 1 && (
              <>
                <CardContent className="p-4 overflow-y-auto flex-1">
                  <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Buscar exercícios..."
                        value={bulkSearchQuery}
                        onChange={(e) => setBulkSearchQuery(e.target.value)}
                        className="pl-10 bg-slate-800 border-slate-700 text-white"
                      />
                    </div>

                    {/* Selected Count */}
                    {selectedExercises.length > 0 && (
                      <div className="bg-purple-900/20 border border-purple-800/50 rounded-lg p-3">
                        <p className="text-purple-400 text-sm font-medium">
                          ✓ {selectedExercises.length} exercício(s) selecionado(s)
                        </p>
                      </div>
                    )}

                    {/* Exercise List */}
                    <div className="space-y-2">
                      {filteredExercises.map((exercise) => (
                        <button
                          key={exercise.id}
                          type="button"
                          onClick={() => toggleExerciseSelection(exercise.id)}
                          className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                            selectedExercises.includes(exercise.id)
                              ? 'border-purple-600 bg-purple-600/20'
                              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {selectedExercises.includes(exercise.id) ? (
                              <CheckSquare className="w-5 h-5 text-purple-400 flex-shrink-0" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-500 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">{exercise.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={`${categoryColors[exercise.category]} text-xs`}>
                                  {exercise.category}
                                </Badge>
                                <Badge variant="outline" className="text-slate-400 border-slate-600 text-xs">
                                  {exercise.difficulty}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}

                      {filteredExercises.length === 0 && (
                        <p className="text-slate-500 text-center py-8">
                          Nenhum exercício encontrado
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
                <div className="border-t border-slate-800 p-4 flex-shrink-0">
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowBulkAdd(false)}
                      className="flex-1 bg-slate-800 border-slate-600 text-slate-200"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      onClick={handleBulkNext}
                      disabled={selectedExercises.length === 0}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      Avançar
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* STEP 2: Configuração de Séries */}
            {bulkAddStep === 2 && (
              <>
                <CardContent className="p-4 overflow-y-auto flex-1">
                  <div className="space-y-4">
                    <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
                      <p className="text-blue-400 text-sm font-medium mb-2">
                        📋 {selectedExercises.length} exercícios selecionados
                      </p>
                      <p className="text-slate-300 text-xs">
                        Configure abaixo as séries que serão aplicadas a todos eles
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-slate-300">Séries</Label>
                        <Button
                          type="button"
                          onClick={addBulkSet}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 h-8"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Adicionar Série
                        </Button>
                      </div>

                      {bulkSetsConfig.map((set, index) => (
                        <Card key={index} className="bg-slate-800/50 border-slate-600 p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-white font-medium">Série {index + 1}</span>
                              {bulkSetsConfig.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeBulkSet(index)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label className="text-slate-400 text-sm">Vezes</Label>
                                <Input
                                  type="number"
                                  value={set.times}
                                  onChange={(e) => updateBulkSet(index, "times", parseInt(e.target.value))}
                                  className="bg-slate-700 border-slate-600 text-white"
                                  min="1"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-slate-400 text-sm">Repetições</Label>
                                <Input
                                  value={set.reps}
                                  onChange={(e) => updateBulkSet(index, "reps", e.target.value)}
                                  className="bg-slate-700 border-slate-600 text-white"
                                  placeholder="10-12"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-slate-400 text-sm">Descanso (segundos)</Label>
                              <Input
                                type="number"
                                value={set.rest_seconds}
                                onChange={(e) => updateBulkSet(index, "rest_seconds", parseInt(e.target.value))}
                                className="bg-slate-700 border-slate-600 text-white"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-slate-400 text-sm">Observações (opcional)</Label>
                              <Input
                                value={set.notes}
                                onChange={(e) => updateBulkSet(index, "notes", e.target.value)}
                                className="bg-slate-700 border-slate-600 text-white"
                                placeholder="Ex: aumentar carga progressivamente"
                              />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-4">
                      <p className="text-green-400 text-sm">
                        ✅ Essas séries serão aplicadas a todos os {selectedExercises.length} exercícios selecionados
                      </p>
                    </div>
                  </div>
                </CardContent>
                <div className="border-t border-slate-800 p-4 flex-shrink-0">
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBulkBack}
                      className="flex-1 bg-slate-800 border-slate-600 text-slate-200"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      onClick={addBulkExercises}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Adicionar Todos
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
