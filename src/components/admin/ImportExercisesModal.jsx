
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Upload, Check } from "lucide-react";

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

const difficultyLabels = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

const equipmentLabels = {
  bodyweight: "Peso Corporal",
  dumbbells: "Halteres",
  barbell: "Barra",
  machine: "Máquina",
  resistance_band: "Faixa de Resistência",
  kettlebell: "Kettlebell",
  none: "Nenhum",
};

export default function ImportExercisesModal({ onClose }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1); // 1: categoria, 2: lista, 3: configurar
  const [category, setCategory] = useState("");
  const [exerciseText, setExerciseText] = useState("");
  const [exercises, setExercises] = useState([]);

  const importMutation = useMutation({
    mutationFn: (exercisesData) => base44.entities.Exercise.bulkCreate(exercisesData),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-exercises']);
      queryClient.invalidateQueries(['exercises']);
      onClose();
    },
  });

  const handleParseExercises = () => {
    const lines = exerciseText.split('\n').filter(line => line.trim());
    const parsed = lines.map(name => ({
      name: name.trim(),
      category,
      difficulty: 'beginner',
      equipment: 'bodyweight',
      description: '',
    }));
    setExercises(parsed);
    setStep(3);
  };

  const handleUpdateExercise = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  const handleImport = () => {
    importMutation.mutate(exercises);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="bg-slate-900 border-slate-800 max-w-3xl w-full my-8">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800">
          <CardTitle className="text-white">Importar Exercícios em Massa</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5 text-white" />
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {/* Step 1: Selecionar Categoria */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Passo 1: Selecione a Categoria</h3>
                <p className="text-slate-400 text-sm">Todos os exercícios importados serão desta categoria</p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Categoria *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!category}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Próximo
              </Button>
            </div>
          )}

          {/* Step 2: Inserir Lista */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Passo 2: Lista de Exercícios</h3>
                <p className="text-slate-400 text-sm">Insira um exercício por linha</p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Exercícios (um por linha) *</Label>
                <Textarea
                  value={exerciseText}
                  onChange={(e) => setExerciseText(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white h-64 font-mono"
                  placeholder="Supino Reto&#10;Supino Inclinado&#10;Crucifixo&#10;Flexão de Braço&#10;..."
                />
                <p className="text-slate-500 text-xs">
                  {exerciseText.split('\n').filter(l => l.trim()).length} exercícios
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleParseExercises}
                  disabled={!exerciseText.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Configurar Exercícios */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Passo 3: Configurar Exercícios</h3>
                <p className="text-slate-400 text-sm">Configure dificuldade e equipamento para cada exercício</p>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                {exercises.map((exercise, index) => (
                  <Card key={index} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="grid gap-3">
                        <div>
                          <Label className="text-slate-300 text-sm font-semibold flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-400" />
                            {exercise.name}
                          </Label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-slate-400 text-xs">Dificuldade</Label>
                            <Select
                              value={exercise.difficulty}
                              onValueChange={(value) => handleUpdateExercise(index, 'difficulty', value)}
                            >
                              <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(difficultyLabels).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-slate-400 text-xs">Equipamento</Label>
                            <Select
                              value={exercise.equipment}
                              onValueChange={(value) => handleUpdateExercise(index, 'equipment', value)}
                            >
                              <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(equipmentLabels).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="flex-1 bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {importMutation.isPending ? 'Importando...' : `Importar ${exercises.length} Exercícios`}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
