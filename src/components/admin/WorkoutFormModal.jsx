
import React, { useState, useEffect } from "react";
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
  const [bulkAddStep, setBulkAddStep] = useState(1);
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

  // Prevenir scroll do body quando o modal principal está aberto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Prevenir scroll do body e scroll para o topo quando o modal de bulk add abre/fecha
  useEffect(() => {
    if (showBulkAdd) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = '0'; // Isso fará a janela saltar para o topo
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
      document.body.style.top = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
      document.body.style.top = 'unset';
    };
  }, [showBulkAdd]);

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
    
    // Scroll para o topo antes de abrir o modal
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Pequeno delay para garantir que o scroll aconteceu antes do modal ser renderizado
    setTimeout(() => {
      setShowBulkAdd(true);
    }, 50);
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
        sets: bulkSetsConfig.map(set => ({ ...set })),
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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-start justify-center overflow-y-auto">
      <div className="w-full max-w-4xl min-h-screen md:min-h-0 md:my-8 px-2 md:px-4 py-4">
        <Card className="bg-slate-900 border-slate-800 w-full">
          <CardHeader className="border-b border-slate-800 sticky top-0 bg-slate-900 z-20 p-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-white text-lg">
                {workout ? "Editar Treino" : "Novo Treino"}
              </CardTitle>
              <Button 
                type="button"
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="text-slate-400 hover:text-white hover:bg-slate-800 flex-shrink-0 h-10 w-10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-white font-semibold text-base">Informações Básicas</h3>
                
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">Título *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white h-12 text-base"
                    placeholder="Ex: Push Pull Legs"
                    required
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white min-h-20 text-base"
                    placeholder="Descreva o treino..."
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">Categoria</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[150]" position="popper" sideOffset={5}>
                        <SelectItem value="strength">Força</SelectItem>
                        <SelectItem value="cardio">Cardio</SelectItem>
                        <SelectItem value="hiit">HIIT</SelectItem>
                        <SelectItem value="flexibility">Flexibilidade</SelectItem>
                        <SelectItem value="full_body">Corpo Inteiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">Dificuldade</Label>
                    <Select value={formData.difficulty} onValueChange={(v) => setFormData({ ...formData, difficulty: v })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[150]" position="popper" sideOffset={5}>
                        <SelectItem value="beginner">Iniciante</SelectItem>
                        <SelectItem value="intermediate">Intermediário</SelectItem>
                        <SelectItem value="advanced">Avançado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">Local</Label>
                    <Select value={formData.training_location} onValueChange={(v) => setFormData({ ...formData, training_location: v })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[150]" position="popper" sideOffset={5}>
                        <SelectItem value="gym">Academia</SelectItem>
                        <SelectItem value="home">Casa</SelectItem>
                        <SelectItem value="both">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="space-y-2 flex-1 w-full">
                    <Label className="text-slate-300 text-sm">Duração (min)</Label>
                    <Input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                      className="bg-slate-800 border-slate-700 text-white h-12"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-0 sm:pt-7">
                    <input
                      type="checkbox"
                      id="premium"
                      checked={formData.is_premium}
                      onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <Label htmlFor="premium" className="text-slate-300">Premium</Label>
                  </div>
                </div>
              </div>

              {/* Dias do Treino */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold text-base">Dias do Treino</h3>
                  <Button type="button" onClick={addDay} size="sm" className="bg-blue-600 hover:bg-blue-700 h-9">
                    <Plus className="w-4 h-4 mr-1" />
                    Dia
                  </Button>
                </div>

                {formData.days.map((day, dayIndex) => (
                  <Card key={dayIndex} className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="p-3">
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
                            <h4 className="text-white font-semibold text-sm">Dia {day.day_number}</h4>
                            <p className="text-slate-400 text-xs">{day.exercises.length} exercícios</p>
                          </div>
                        </button>
                        {formData.days.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeDay(dayIndex)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>

                    {expandedDay === dayIndex && (
                      <CardContent className="p-3 space-y-3">
                        <div className="space-y-2">
                          <Label className="text-slate-300 text-sm">Título do Dia</Label>
                          <Input
                            value={day.title}
                            onChange={(e) => updateDay(dayIndex, "title", e.target.value)}
                            className="bg-slate-800 border-slate-700 text-white h-11"
                            placeholder="Ex: Treino de Peito"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Label className="text-slate-300 text-sm">Exercícios</Label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                onClick={() => openBulkAdd(dayIndex)}
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 h-8 text-xs"
                              >
                                <CheckSquare className="w-3 h-3 mr-1" />
                                Múltiplos
                              </Button>
                              <Button
                                type="button"
                                onClick={() => addExercise(dayIndex)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 h-8 text-xs"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Único
                              </Button>
                            </div>
                          </div>

                          {/* Exercise cards */}
                          {day.exercises.map((exercise, exerciseIndex) => {
                            const isExpanded = expandedExercise === `${dayIndex}-${exerciseIndex}`;
                            return (
                              <Card key={exerciseIndex} className="bg-slate-900/50 border-slate-600">
                                <CardHeader className="p-2">
                                  <div className="flex items-start gap-2">
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
                                          {exercise.exercise_name || "Selecionar..."}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <span>{exercise.sets?.length || 0} séries</span>
                                        {!isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                                      </div>
                                    </button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeExercise(dayIndex, exerciseIndex)}
                                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8 flex-shrink-0"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </CardHeader>

                                {isExpanded && (
                                  <CardContent className="p-2 space-y-2 border-t border-slate-700">
                                    <div className="space-y-1">
                                      <Label className="text-slate-300 text-xs">Exercício</Label>
                                      <Select
                                        value={exercise.exercise_id}
                                        onValueChange={(v) => updateExercise(dayIndex, exerciseIndex, "exercise_id", v)}
                                      >
                                        <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-10 text-sm">
                                          <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60 z-[150]" position="popper" sideOffset={5}>
                                          {exercises.map((ex) => (
                                            <SelectItem key={ex.id} value={ex.id} className="text-sm">
                                              {ex.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {/* Séries */}
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-slate-300 text-xs">Séries</Label>
                                        <Button
                                          type="button"
                                          onClick={() => addSet(dayIndex, exerciseIndex)}
                                          size="sm"
                                          className="bg-purple-600 hover:bg-purple-700 h-7 text-xs px-2"
                                        >
                                          <Plus className="w-3 h-3 mr-1" />
                                          Série
                                        </Button>
                                      </div>

                                      {exercise.sets?.map((set, setIndex) => (
                                        <Card key={setIndex} className="bg-slate-800/50 border-slate-600 p-2">
                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                              <span className="text-white text-xs font-medium">Série {setIndex + 1}</span>
                                              {exercise.sets.length > 1 && (
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() => removeSet(dayIndex, exerciseIndex, setIndex)}
                                                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-6 w-6"
                                                >
                                                  <X className="w-3 h-3" />
                                                </Button>
                                              )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                              <div className="space-y-1">
                                                <Label className="text-slate-400 text-xs">Vezes</Label>
                                                <Input
                                                  type="number"
                                                  value={set.times}
                                                  onChange={(e) => updateSet(dayIndex, exerciseIndex, setIndex, "times", parseInt(e.target.value))}
                                                  className="bg-slate-700 border-slate-600 text-white h-9 text-sm"
                                                  min="1"
                                                />
                                              </div>
                                              <div className="space-y-1">
                                                <Label className="text-slate-400 text-xs">Reps</Label>
                                                <Input
                                                  value={set.reps}
                                                  onChange={(e) => updateSet(dayIndex, exerciseIndex, setIndex, "reps", e.target.value)}
                                                  className="bg-slate-700 border-slate-600 text-white h-9 text-sm"
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
                                                className="bg-slate-700 border-slate-600 text-white h-9 text-sm"
                                              />
                                            </div>

                                            <div className="space-y-1">
                                              <Label className="text-slate-400 text-xs">Observações</Label>
                                              <Input
                                                value={set.notes}
                                                onChange={(e) => updateSet(dayIndex, exerciseIndex, setIndex, "notes", e.target.value)}
                                                className="bg-slate-700 border-slate-600 text-white h-9 text-sm"
                                                placeholder="Ex: aumentar carga"
                                              />
                                            </div>
                                          </div>
                                        </Card>
                                      ))}
                                    </div>

                                    <div className="space-y-1">
                                      <Label className="text-slate-300 text-xs">Notas do Exercício</Label>
                                      <Textarea
                                        value={exercise.notes}
                                        onChange={(e) => updateExercise(dayIndex, exerciseIndex, "notes", e.target.value)}
                                        className="bg-slate-800 border-slate-600 text-white min-h-16 text-sm"
                                        placeholder="Dicas de execução..."
                                      />
                                    </div>
                                  </CardContent>
                                )}
                              </Card>
                            );
                          })}

                          {day.exercises.length === 0 && (
                            <p className="text-slate-500 text-center py-4 text-xs">
                              Nenhum exercício adicionado
                            </p>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>

              {/* Botões de Ação */}
              <div className="sticky bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-4 -mx-4 -mb-4 flex gap-3">
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
                  disabled={createWorkoutMutation.isPending || !formData.title}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 h-12 text-base font-semibold"
                >
                  {createWorkoutMutation.isPending ? "Salvando..." : workout ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Múltiplos Exercícios */}
      {showBulkAdd && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[120] flex items-center justify-center p-4"
          style={{ top: 0, left: 0, right: 0, bottom: 0 }} // Ensure it covers the whole screen
        >
          <div className="w-full max-w-2xl h-[90vh] flex flex-col"> {/* Use h-[90vh] and flex-col here */}
            <Card className="bg-slate-900 border-slate-800 w-full h-full flex flex-col"> {/* Make Card a flex column */}
              <CardHeader className="border-b border-slate-800 p-4 flex-shrink-0"> {/* flex-shrink-0 for header */}
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-white text-base">
                    {bulkAddStep === 1 ? "Selecionar Exercícios" : "Configurar Séries"}
                  </CardTitle>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowBulkAdd(false)}
                    className="text-slate-400 hover:text-white h-10 w-10 flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-slate-400 text-xs mt-2">
                  {bulkAddStep === 1 
                    ? `Selecione os exercícios para o Dia ${currentDayForBulk + 1}`
                    : `Configure as séries para ${selectedExercises.length} exercício(s)`
                  }
                </p>
                
                <div className="flex items-center gap-2 mt-3">
                  <div className={`flex-1 h-2 rounded-full ${bulkAddStep >= 1 ? 'bg-purple-600' : 'bg-slate-700'}`} />
                  <div className={`flex-1 h-2 rounded-full ${bulkAddStep >= 2 ? 'bg-purple-600' : 'bg-slate-700'}`} />
                </div>
              </CardHeader>

              {bulkAddStep === 1 ? (
                <>
                  <CardContent className="p-4 overflow-y-auto flex-1"> {/* flex-1 and overflow-y-auto for scrollable content */}
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Buscar exercícios..."
                          value={bulkSearchQuery}
                          onChange={(e) => setBulkSearchQuery(e.target.value)}
                          className="pl-10 bg-slate-800 border-slate-700 text-white h-11"
                        />
                      </div>

                      {selectedExercises.length > 0 && (
                        <div className="bg-purple-900/20 border border-purple-800/50 rounded-lg p-2.5 sticky top-0 bg-slate-900 z-10">
                          <p className="text-purple-400 text-xs font-medium">
                            ✓ {selectedExercises.length} selecionado(s)
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        {filteredExercises.map((exercise) => (
                          <button
                            key={exercise.id}
                            type="button"
                            onClick={() => toggleExerciseSelection(exercise.id)}
                            className={`w-full text-left p-2.5 rounded-lg border-2 transition-all ${
                              selectedExercises.includes(exercise.id)
                                ? 'border-purple-600 bg-purple-600/20'
                                : 'border-slate-700 bg-slate-800/50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {selectedExercises.includes(exercise.id) ? (
                                <CheckSquare className="w-4 h-4 text-purple-400 flex-shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-500 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-sm truncate">{exercise.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Badge className={`${categoryColors[exercise.category]} text-xs py-0`}>
                                    {exercise.category}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <div className="border-t border-slate-800 p-3 bg-slate-900 flex-shrink-0"> {/* flex-shrink-0 for footer */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowBulkAdd(false)}
                        className="flex-1 bg-slate-800 border-slate-600 text-slate-200 h-11"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={handleBulkNext}
                        disabled={selectedExercises.length === 0}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 h-11"
                      >
                        Avançar
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <CardContent className="p-4 overflow-y-auto flex-1"> {/* flex-1 and overflow-y-auto for scrollable content */}
                    <div className="space-y-3">
                      <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 sticky top-0 bg-slate-900 z-10">
                        <p className="text-blue-400 text-xs font-medium mb-1">
                          📋 {selectedExercises.length} exercício(s)
                        </p>
                        <p className="text-slate-300 text-xs">
                          Configure as séries abaixo
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-slate-300 text-sm">Séries</Label>
                          <Button
                            type="button"
                            onClick={addBulkSet}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 h-8 text-xs"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Série
                          </Button>
                        </div>

                        {bulkSetsConfig.map((set, index) => (
                          <Card key={index} className="bg-slate-800/50 border-slate-600 p-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-white font-medium text-sm">Série {index + 1}</span>
                                {bulkSetsConfig.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeBulkSet(index)}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-7 w-7"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-slate-400 text-xs">Vezes</Label>
                                  <Input
                                    type="number"
                                    value={set.times}
                                    onChange={(e) => updateBulkSet(index, "times", parseInt(e.target.value))}
                                    className="bg-slate-700 border-slate-600 text-white h-10"
                                    min="1"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-slate-400 text-xs">Reps</Label>
                                  <Input
                                    value={set.reps}
                                    onChange={(e) => updateBulkSet(index, "reps", e.target.value)}
                                    className="bg-slate-700 border-slate-600 text-white h-10"
                                    placeholder="10-12"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <Label className="text-slate-400 text-xs">Descanso (seg)</Label>
                                <Input
                                  type="number"
                                  value={set.rest_seconds}
                                  onChange={(e) => updateBulkSet(index, "rest_seconds", parseInt(e.target.value))}
                                  className="bg-slate-700 border-slate-600 text-white h-10"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-slate-400 text-xs">Observações</Label>
                                <Input
                                  value={set.notes}
                                  onChange={(e) => updateBulkSet(index, "notes", e.target.value)}
                                  className="bg-slate-700 border-slate-600 text-white h-10"
                                  placeholder="Ex: progressivo"
                                />
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>

                      <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-2.5">
                        <p className="text-green-400 text-xs">
                          ✅ Aplicar a {selectedExercises.length} exercício(s)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <div className="border-t border-slate-800 p-3 bg-slate-900 flex-shrink-0"> {/* flex-shrink-0 for footer */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBulkBack}
                        className="flex-1 bg-slate-800 border-slate-600 text-slate-200 h-11"
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Voltar
                      </Button>
                      <Button
                        type="button"
                        onClick={addBulkExercises}
                        className="flex-1 bg-green-600 hover:bg-green-700 h-11"
                      >
                        <CheckSquare className="w-4 h-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
