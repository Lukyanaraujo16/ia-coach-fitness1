
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Trash2, List } from "lucide-react";

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
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkAddDay, setBulkAddDay] = useState(0);
  const [bulkCategory, setBulkCategory] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [bulkSetsConfig, setBulkSetsConfig] = useState({
    numSets: 3,
    reps: '10',
    rest: 60,
  });
  const [individualConfigs, setIndividualConfigs] = useState({});
  const [useIndividualConfig, setUseIndividualConfig] = useState(false);

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
        days: workout.days && workout.days.length > 0
          ? workout.days.map(day => ({
              ...day,
              exercises: day.exercises.map(ex => ({
                ...ex,
                exercise_category: ex.exercise_category || '',
              }))
            }))
          : [{ day_number: 1, title: 'Dia 1', exercises: [] }],
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
      exercise_category: '',
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
    } else if (field === 'exercise_category') {
      newDays[dayIndex].exercises[exerciseIndex].exercise_id = '';
      newDays[dayIndex].exercises[exerciseIndex].exercise_name = '';
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

  // Bulk Add Functions
  const handleOpenBulkAdd = (dayIndex) => {
    setBulkAddDay(dayIndex);
    setBulkCategory('');
    setSelectedExercises([]);
    setIndividualConfigs({});
    setUseIndividualConfig(false);
    setShowBulkAdd(true);
  };

  const handleToggleExercise = (exerciseId) => {
    setSelectedExercises(prev => {
      const isCurrentlySelected = prev.includes(exerciseId);
      const newSelected = isCurrentlySelected 
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId];
      
      // Initialize individual config with default sets structure
      if (!isCurrentlySelected && !individualConfigs[exerciseId]) {
        const defaultSets = [];
        for (let i = 0; i < bulkSetsConfig.numSets; i++) {
          defaultSets.push({
            reps: bulkSetsConfig.reps,
            rest: bulkSetsConfig.rest
          });
        }
        setIndividualConfigs(configs => ({
          ...configs,
          [exerciseId]: { sets: defaultSets }
        }));
      }
      
      return newSelected;
    });
  };

  const updateIndividualSet = (exerciseId, setIndex, field, value) => {
    setIndividualConfigs(configs => {
      const exerciseConfig = configs[exerciseId] || { sets: [] };
      const newSets = [...exerciseConfig.sets];
      newSets[setIndex] = {
        ...newSets[setIndex],
        [field]: field === 'rest' ? parseInt(value) || 60 : value
      };
      return {
        ...configs,
        [exerciseId]: { sets: newSets }
      };
    });
  };

  const addIndividualSet = (exerciseId) => {
    setIndividualConfigs(configs => {
      const exerciseConfig = configs[exerciseId] || { sets: [] };
      const lastSet = exerciseConfig.sets[exerciseConfig.sets.length - 1] || { reps: '10', rest: 60 };
      return {
        ...configs,
        [exerciseId]: {
          sets: [...exerciseConfig.sets, { reps: lastSet.reps, rest: lastSet.rest }]
        }
      };
    });
  };

  const removeIndividualSet = (exerciseId, setIndex) => {
    setIndividualConfigs(configs => {
      const exerciseConfig = configs[exerciseId] || { sets: [] };
      if (exerciseConfig.sets.length <= 1) return configs;
      const newSets = exerciseConfig.sets.filter((_, idx) => idx !== setIndex);
      return {
        ...configs,
        [exerciseId]: { sets: newSets }
      };
    });
  };

  const handleBulkAddExercises = () => {
    if (selectedExercises.length === 0) return;

    const newDays = [...formData.days];

    selectedExercises.forEach(exerciseId => {
      const exercise = exercises.find(ex => ex.id === exerciseId);
      if (!exercise) return;

      let sets = [];
      
      if (useIndividualConfig && individualConfigs[exerciseId]) {
        // Use individual configuration with custom sets
        sets = individualConfigs[exerciseId].sets.map(set => ({
          reps: set.reps,
          rest_seconds: set.rest
        }));
      } else {
        // Use bulk configuration
        for (let i = 0; i < bulkSetsConfig.numSets; i++) {
          sets.push({ reps: bulkSetsConfig.reps, rest_seconds: bulkSetsConfig.rest });
        }
      }

      newDays[bulkAddDay].exercises.push({
        exercise_category: exercise.category,
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        sets: sets,
        notes: '',
      });
    });

    setFormData({ ...formData, days: newDays });
    setShowBulkAdd(false);
    setSelectedExercises([]);
    setIndividualConfigs({});
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

  const filteredBulkExercises = bulkCategory 
    ? exercises.filter(ex => ex.category === bulkCategory)
    : [];

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
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-white font-bold text-lg">📅 Dia {day.day_number}</h4>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleOpenBulkAdd(dayIndex)}
                          className="bg-purple-600 hover:bg-purple-700"
                          disabled={loadingExercises}
                        >
                          <List className="w-4 h-4 mr-2" />
                          Adicionar Múltiplos
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addExerciseToDay(dayIndex)}
                          className="bg-blue-600 hover:bg-blue-700"
                          disabled={loadingExercises}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar 1 Exercício
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {day.exercises.length === 0 ? (
                      <div className="text-center py-8 bg-slate-900/30 rounded-lg border-2 border-dashed border-slate-700">
                        <p className="text-slate-500 mb-3">Nenhum exercício adicionado ainda</p>
                        <div className="flex gap-2 justify-center">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleOpenBulkAdd(dayIndex)}
                            className="bg-purple-600 hover:bg-purple-700"
                            disabled={loadingExercises}
                          >
                            <List className="w-4 h-4 mr-2" />
                            Adicionar Múltiplos
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => addExerciseToDay(dayIndex)}
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={loadingExercises}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar 1
                          </Button>
                        </div>
                      </div>
                    ) : (
                      day.exercises.map((exercise, exIndex) => {
                        const filteredExercises = exercise.exercise_category 
                          ? exercises.filter(ex => ex.category === exercise.exercise_category)
                          : [];

                        return (
                          <Card key={exIndex} className="bg-slate-900/50 border-slate-700">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 space-y-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <span className="text-white font-bold text-sm">{exIndex + 1}</span>
                                    </div>
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                      <div>
                                        <Label className="text-slate-300 text-xs mb-1">Categoria *</Label>
                                        <Select
                                          value={exercise.exercise_category}
                                          onValueChange={(value) => updateExercise(dayIndex, exIndex, 'exercise_category', value)}
                                        >
                                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                            <SelectValue placeholder="Selecione categoria" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {Object.entries(categoryLabels).map(([key, label]) => (
                                              <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label className="text-slate-300 text-xs mb-1">Exercício *</Label>
                                        <Select
                                          value={exercise.exercise_id}
                                          onValueChange={(value) => updateExercise(dayIndex, exIndex, 'exercise_id', value)}
                                          disabled={!exercise.exercise_category}
                                        >
                                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                            <SelectValue placeholder="Selecione exercício" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {loadingExercises ? (
                                              <div className="p-2 text-slate-400 text-sm">
                                                Carregando...
                                              </div>
                                            ) : !exercise.exercise_category ? (
                                              <div className="p-2 text-slate-400 text-sm">
                                                Selecione uma categoria primeiro
                                              </div>
                                            ) : filteredExercises.length === 0 ? (
                                              <div className="p-2 text-slate-400 text-sm">
                                                Nenhum exercício nesta categoria
                                              </div>
                                            ) : (
                                              filteredExercises.map((ex) => (
                                                <SelectItem key={ex.id} value={ex.id}>
                                                  {ex.name}
                                                </SelectItem>
                                              ))
                                            )}
                                          </SelectContent>
                                        </Select>
                                      </div>
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
                        );
                      })
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

      {/* Bulk Add Modal - UPDATED */}
      {showBulkAdd && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-slate-800 max-w-4xl w-full max-h-[85vh] flex flex-col">
            <CardHeader className="border-b border-slate-800 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Adicionar Múltiplos Exercícios - Dia {formData.days[bulkAddDay].day_number}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowBulkAdd(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {/* Toggle para configuração individual */}
                <div className="flex items-center gap-3 p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="useIndividual"
                    checked={useIndividualConfig}
                    onChange={(e) => setUseIndividualConfig(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="useIndividual" className="text-white cursor-pointer flex-1">
                    Configurar séries individualmente para cada exercício
                  </Label>
                </div>

                {/* Config Padrão */}
                {!useIndividualConfig && (
                  <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-lg">
                    <h4 className="text-white font-semibold mb-3">Configuração Padrão de Séries</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-slate-300 text-sm">Nº de Séries</Label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={bulkSetsConfig.numSets}
                          onChange={(e) => setBulkSetsConfig({...bulkSetsConfig, numSets: parseInt(e.target.value) || 1})}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300 text-sm">Repetições</Label>
                        <Input
                          value={bulkSetsConfig.reps}
                          onChange={(e) => setBulkSetsConfig({...bulkSetsConfig, reps: e.target.value})}
                          className="bg-slate-800 border-slate-700 text-white"
                          placeholder="Ex: 10"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300 text-sm">Descanso (s)</Label>
                        <Input
                          type="number"
                          value={bulkSetsConfig.rest}
                          onChange={(e) => setBulkSetsConfig({...bulkSetsConfig, rest: parseInt(e.target.value) || 60})}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs mt-2">
                      Todos os exercícios terão {bulkSetsConfig.numSets}x{bulkSetsConfig.reps} ({bulkSetsConfig.rest}s descanso)
                    </p>
                  </div>
                )}

                {/* Seleção de Categoria */}
                <div>
                  <Label className="text-slate-300 mb-2">Selecione a Categoria *</Label>
                  <Select value={bulkCategory} onValueChange={setBulkCategory}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Escolha uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label} ({exercises.filter(ex => ex.category === key).length} exercícios)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Lista de Exercícios */}
                {bulkCategory && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-slate-300">
                        Selecione os Exercícios ({selectedExercises.length} selecionados)
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedExercises(filteredBulkExercises.map(ex => ex.id))}
                          className="text-xs border-slate-700 text-slate-300"
                        >
                          Selecionar Todos
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedExercises([])}
                          className="text-xs border-slate-700 text-slate-300"
                        >
                          Limpar
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto bg-slate-800/30 p-3 rounded-lg">
                      {filteredBulkExercises.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">
                          Nenhum exercício nesta categoria
                        </p>
                      ) : (
                        filteredBulkExercises.map((exercise) => {
                          const isSelected = selectedExercises.includes(exercise.id);
                          const config = individualConfigs[exercise.id] || { sets: [] };
                          
                          return (
                            <div
                              key={exercise.id}
                              className={`rounded-lg transition-all ${
                                isSelected
                                  ? 'bg-blue-600/20 border-2 border-blue-600/50'
                                  : 'bg-slate-800/50 border-2 border-transparent hover:border-slate-700'
                              }`}
                            >
                              <label className="flex items-start gap-3 p-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleExercise(exercise.id)}
                                  className="mt-1 w-4 h-4"
                                />
                                <div className="flex-1">
                                  <p className="text-white font-medium">{exercise.name}</p>
                                  {exercise.description && (
                                    <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                                      {exercise.description}
                                    </p>
                                  )}
                                </div>
                              </label>
                              
                              {/* Config individual com lista de séries */}
                              {useIndividualConfig && isSelected && (
                                <div className="px-3 pb-3 border-t border-slate-700 pt-3 mt-2 space-y-2">
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="text-slate-400 text-xs">Configurar Séries</Label>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => addIndividualSet(exercise.id)}
                                      className="h-6 text-xs border-slate-700 text-slate-300"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Série
                                    </Button>
                                  </div>
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {config.sets.map((set, setIdx) => (
                                      <div key={setIdx} className="flex items-center gap-2 bg-slate-900/50 p-2 rounded">
                                        <span className="text-slate-400 text-xs w-8">{setIdx + 1}ª</span>
                                        <Input
                                          value={set.reps}
                                          onChange={(e) => updateIndividualSet(exercise.id, setIdx, 'reps', e.target.value)}
                                          className="bg-slate-800 border-slate-700 text-white text-xs h-7 flex-1"
                                          placeholder="Reps"
                                        />
                                        <Input
                                          type="number"
                                          value={set.rest}
                                          onChange={(e) => updateIndividualSet(exercise.id, setIdx, 'rest', e.target.value)}
                                          className="bg-slate-800 border-slate-700 text-white text-xs h-7 w-16"
                                          placeholder="60s"
                                        />
                                        {config.sets.length > 1 && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeIndividualSet(exercise.id, setIdx)}
                                            className="h-7 w-7 text-red-400"
                                          >
                                            <X className="w-3 h-3" />
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  <p className="text-slate-500 text-xs">
                                    💡 Exemplo: 1ª série 10 reps (60s), 2ª série 8 reps (90s)
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <div className="border-t border-slate-800 p-4 flex gap-3 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => setShowBulkAdd(false)}
                className="flex-1 border-slate-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleBulkAddExercises}
                disabled={selectedExercises.length === 0}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                Adicionar {selectedExercises.length} Exercício(s)
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
