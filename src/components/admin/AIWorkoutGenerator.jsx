
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Sparkles, Loader2, Plus, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

export default function AIWorkoutGenerator({ onClose }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1); // 1: config, 2: generating, 3: preview
  const [generatedWorkout, setGeneratedWorkout] = useState(null);
  const [newExercisesCreated, setNewExercisesCreated] = useState([]);
  
  const [config, setConfig] = useState({
    title: '',
    gender: 'unisex',
    location: 'gym',
    difficulty: 'intermediate',
    numDays: 3,
    duration: 60,
    category: 'strength',
    additionalNotes: '',
  });

  // Buscar exercícios existentes
  const { data: existingExercises = [] } = useQuery({
    queryKey: ['all-exercises'],
    queryFn: () => base44.entities.Exercise.list(),
  });

  const generateWorkoutMutation = useMutation({
    mutationFn: async (configData) => {
      // Preparar lista de exercícios para a IA
      const exercisesList = existingExercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        category: ex.category,
        equipment: ex.equipment,
        difficulty: ex.difficulty,
      }));

      const prompt = `
Você é um personal trainer expert. Crie um treino COMPLETO e DETALHADO com base nas seguintes informações:

**PARÂMETROS DO TREINO:**
- Título sugerido: ${configData.title || 'Treino Personalizado'}
- Público-alvo: ${configData.gender === 'male' ? 'Homens' : configData.gender === 'female' ? 'Mulheres' : 'Unisex'}
- Local: ${configData.location === 'gym' ? 'Academia (equipamentos disponíveis)' : 'Casa (equipamento limitado)'}
- Dificuldade: ${configData.difficulty === 'beginner' ? 'Iniciante' : configData.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
- Número de dias: ${configData.numDays}
- Duração por dia: ${configData.duration} minutos
- Categoria principal: ${configData.category}
- Notas adicionais: ${configData.additionalNotes || 'Nenhuma'}

**EXERCÍCIOS DISPONÍVEIS NO SISTEMA:**
${exercisesList.map(ex => `- ${ex.name} (${ex.category}, ${ex.equipment})`).join('\n')}

**INSTRUÇÕES IMPORTANTES:**
1. Use PREFERENCIALMENTE os exercícios já disponíveis no sistema acima
2. Se precisar de um exercício que NÃO está na lista, você PODE criar novos exercícios - coloque-os na lista "new_exercises"
3. SEMPRE incluir CARDIO no final de CADA dia de treino (pode ser corrida, bicicleta, elíptico, pular corda, etc)
4. Para ${configData.gender === 'male' ? 'HOMENS' : configData.gender === 'female' ? 'MULHERES' : 'ambos os gêneros'}, ajuste:
   ${configData.gender === 'male' 
     ? '- Foco maior em peito, ombros, costas\n   - Volume maior de exercícios compostos\n   - Mais carga, menos repetições' 
     : configData.gender === 'female'
     ? '- Foco maior em glúteos, pernas, core\n   - Mais exercícios para tônus\n   - Repetições mais altas'
     : '- Treino equilibrado para todos os grupos musculares'}
5. Para treino em ${configData.location === 'gym' ? 'ACADEMIA' : 'CASA'}:
   ${configData.location === 'gym'
     ? '- Use barras, halteres, máquinas, cabos\n   - Exercícios com equipamentos'
     : '- Use peso corporal, elásticos, halteres leves\n   - Exercícios funcionais sem equipamento pesado'}
6. Cada exercício deve ter:
   - "times": quantas vezes fazer aquela série (ex: 2 = fazer 2 vezes)
   - "reps": repetições (pode ser número ou texto como "12-15" ou "até falha")
   - "rest_seconds": descanso entre séries
   - "notes": observações importantes (técnica, variação, etc)
7. Distribua os exercícios de forma inteligente pelos ${configData.numDays} dias
8. Seja específico nas quantidades e observações

**FORMATO DE RESPOSTA:**
Retorne um treino completo com estrutura clara de dias e exercícios, incluindo cardio no final de cada dia.
`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            difficulty: { type: "string" },
            training_location: { type: "string" },
            duration_minutes: { type: "number" },
            is_premium: { type: "boolean" },
            days: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day_number: { type: "number" },
                  title: { type: "string" },
                  exercises: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        use_existing: { 
                          type: "boolean",
                          description: "true se usar exercício existente, false se criar novo"
                        },
                        exercise_id: { 
                          type: "string",
                          description: "ID do exercício existente (se use_existing = true)"
                        },
                        exercise_name: { type: "string" },
                        exercise_category: { type: "string" },
                        sets: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              times: { type: "number" },
                              reps: { type: "string" },
                              rest_seconds: { type: "number" },
                              notes: { type: "string" }
                            }
                          }
                        },
                        notes: { type: "string" }
                      }
                    }
                  }
                }
              }
            },
            new_exercises: {
              type: "array",
              description: "Exercícios que precisam ser criados",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  difficulty: { type: "string" },
                  equipment: { type: "string" }
                }
              }
            },
            tips: {
              type: "array",
              items: { type: "string" },
              description: "Dicas importantes sobre o treino"
            }
          }
        }
      });

      return result;
    },
    onSuccess: (result) => {
      setGeneratedWorkout(result);
      setStep(3);
    },
  });

  const createExercisesMutation = useMutation({
    mutationFn: async (exercises) => {
      if (!exercises || exercises.length === 0) return [];
      return base44.entities.Exercise.bulkCreate(exercises);
    },
  });

  const saveWorkoutMutation = useMutation({
    mutationFn: async () => {
      let newExercises = [];
      
      // 1. Criar exercícios novos se necessário
      if (generatedWorkout.new_exercises && generatedWorkout.new_exercises.length > 0) {
        newExercises = await createExercisesMutation.mutateAsync(generatedWorkout.new_exercises);
        setNewExercisesCreated(newExercises);
      }

      // 2. Mapear IDs dos novos exercícios
      const exerciseNameToId = {};
      newExercises.forEach(ex => {
        exerciseNameToId[ex.name] = ex.id;
      });

      // 3. Processar os dias e exercícios
      const processedDays = generatedWorkout.days.map(day => ({
        ...day,
        exercises: day.exercises.map(exercise => {
          // Se usar exercício existente, manter o ID
          if (exercise.use_existing && exercise.exercise_id) {
            return {
              exercise_id: exercise.exercise_id,
              exercise_name: exercise.exercise_name,
              exercise_category: exercise.exercise_category,
              sets: exercise.sets.map(set => ({
                times: set.times || 1,
                reps: set.reps,
                rest_seconds: set.rest_seconds,
                notes: set.notes || ''
              })),
              notes: exercise.notes || ''
            };
          } else {
            // Se for novo exercício, usar o ID criado
            const newExId = exerciseNameToId[exercise.exercise_name];
            return {
              exercise_id: newExId || '',
              exercise_name: exercise.exercise_name,
              exercise_category: exercise.exercise_category,
              sets: exercise.sets.map(set => ({
                times: set.times || 1,
                reps: set.reps,
                rest_seconds: set.rest_seconds,
                notes: set.notes || ''
              })),
              notes: exercise.notes || ''
            };
          }
        })
      }));

      // 4. Salvar o treino
      await base44.entities.Workout.create({
        title: generatedWorkout.title,
        description: generatedWorkout.description,
        category: generatedWorkout.category,
        difficulty: generatedWorkout.difficulty,
        training_location: generatedWorkout.training_location,
        duration_minutes: generatedWorkout.duration_minutes,
        is_premium: generatedWorkout.is_premium || false,
        days: processedDays
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-workouts']);
      queryClient.invalidateQueries(['workouts']);
      queryClient.invalidateQueries(['all-exercises']);
      alert(`✅ Treino criado com sucesso!${newExercisesCreated.length > 0 ? `\n🆕 ${newExercisesCreated.length} novo(s) exercício(s) adicionado(s)!` : ''}`);
      onClose();
    },
  });

  const handleGenerate = () => {
    setStep(2);
    generateWorkoutMutation.mutate(config);
  };

  const handleSave = () => {
    saveWorkoutMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="bg-slate-900 border-slate-800 max-w-5xl w-full my-8">
        <CardHeader className="border-b border-slate-800 flex flex-row items-center justify-between sticky top-0 bg-slate-900 z-10">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              Gerar Treino com IA
            </CardTitle>
            <p className="text-slate-400 text-sm mt-1">
              A IA criará um treino completo personalizado
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>

        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            {/* STEP 1: Configuração */}
            {step === 1 && (
              <motion.div
                key="config"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Título do Treino *</Label>
                    <Input
                      value={config.title}
                      onChange={(e) => setConfig({ ...config, title: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Ex: Treino Feminino para Casa"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Público-Alvo *</Label>
                    <Select value={config.gender} onValueChange={(v) => setConfig({ ...config, gender: v })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">👨 Homens</SelectItem>
                        <SelectItem value="female">👩 Mulheres</SelectItem>
                        <SelectItem value="unisex">👥 Unisex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Local de Treino *</Label>
                    <Select value={config.location} onValueChange={(v) => setConfig({ ...config, location: v })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gym">🏋️ Academia</SelectItem>
                        <SelectItem value="home">🏠 Casa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Dificuldade *</Label>
                    <Select value={config.difficulty} onValueChange={(v) => setConfig({ ...config, difficulty: v })}>
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
                    <Label className="text-slate-300">Número de Dias *</Label>
                    <Input
                      type="number"
                      min="1"
                      max="7"
                      value={config.numDays}
                      onChange={(e) => setConfig({ ...config, numDays: parseInt(e.target.value) || 1 })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Duração (min) *</Label>
                    <Input
                      type="number"
                      value={config.duration}
                      onChange={(e) => setConfig({ ...config, duration: parseInt(e.target.value) || 60 })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Categoria *</Label>
                    <Select value={config.category} onValueChange={(v) => setConfig({ ...config, category: v })}>
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
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Notas Adicionais</Label>
                  <Textarea
                    value={config.additionalNotes}
                    onChange={(e) => setConfig({ ...config, additionalNotes: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white h-24"
                    placeholder="Ex: Foco em glúteos, evitar exercícios de impacto, incluir alongamentos..."
                  />
                </div>

                <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                  <h4 className="text-blue-400 font-semibold mb-2">🤖 A IA irá:</h4>
                  <ul className="text-slate-300 text-sm space-y-1">
                    <li>✅ Usar os {existingExercises.length} exercícios já cadastrados</li>
                    <li>✅ Criar novos exercícios se necessário</li>
                    <li>✅ Incluir cardio no final de cada dia</li>
                    <li>✅ Adaptar para {config.gender === 'male' ? 'homens' : config.gender === 'female' ? 'mulheres' : 'unisex'}</li>
                    <li>✅ Otimizar para treino em {config.location === 'gym' ? 'academia' : 'casa'}</li>
                  </ul>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={!config.title}
                  className="w-full bg-purple-600 hover:bg-purple-700 h-14 text-lg font-semibold"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Gerar Treino com IA
                </Button>
              </motion.div>
            )}

            {/* STEP 2: Gerando */}
            {step === 2 && (
              <motion.div
                key="generating"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <Loader2 className="w-16 h-16 text-purple-400 animate-spin mb-6" />
                <h3 className="text-2xl font-bold text-white mb-2">Gerando Treino...</h3>
                <p className="text-slate-400 text-center max-w-md">
                  A IA está analisando {existingExercises.length} exercícios e criando o treino perfeito para você...
                </p>
              </motion.div>
            )}

            {/* STEP 3: Preview e Salvar */}
            {step === 3 && generatedWorkout && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">{generatedWorkout.title}</h3>
                    <p className="text-slate-300">{generatedWorkout.description}</p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 text-lg px-4 py-2">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Gerado!
                  </Badge>
                </div>

                {generatedWorkout.new_exercises && generatedWorkout.new_exercises.length > 0 && (
                  <div className="p-4 bg-orange-900/20 border border-orange-800/50 rounded-lg">
                    <h4 className="text-orange-400 font-semibold mb-2 flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      {generatedWorkout.new_exercises.length} Novos Exercícios Serão Criados
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {generatedWorkout.new_exercises.map((ex, idx) => (
                        <Badge key={idx} variant="outline" className="text-orange-400 border-orange-600">
                          {ex.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {generatedWorkout.days.map((day, dayIdx) => (
                    <Card key={dayIdx} className="bg-slate-800/50 border-slate-700">
                      <CardHeader className="bg-slate-800">
                        <h4 className="text-white font-bold">
                          📅 Dia {day.day_number}: {day.title}
                        </h4>
                        <p className="text-slate-400 text-sm">{day.exercises.length} exercícios</p>
                      </CardHeader>
                      <CardContent className="p-4 space-y-2">
                        {day.exercises.map((ex, exIdx) => (
                          <div key={exIdx} className="bg-slate-900/50 p-3 rounded-lg">
                            <div className="flex items-start gap-2">
                              <span className="text-blue-400 font-bold">{exIdx + 1}.</span>
                              <div className="flex-1">
                                <p className="text-white font-medium">{ex.exercise_name}</p>
                                <div className="text-slate-400 text-sm mt-1">
                                  {ex.sets.map((set, setIdx) => (
                                    <span key={setIdx}>
                                      {setIdx > 0 && ' • '}
                                      {set.times}x{set.reps} ({set.rest_seconds}s)
                                    </span>
                                  ))}
                                </div>
                                {ex.notes && <p className="text-slate-500 text-xs mt-1">💡 {ex.notes}</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {generatedWorkout.tips && generatedWorkout.tips.length > 0 && (
                  <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                    <h4 className="text-blue-400 font-semibold mb-2">💡 Dicas Importantes:</h4>
                    <ul className="text-slate-300 text-sm space-y-1">
                      {generatedWorkout.tips.map((tip, idx) => (
                        <li key={idx}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep(1);
                      setGeneratedWorkout(null);
                    }}
                    className="flex-1 bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
                  >
                    Gerar Outro
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saveWorkoutMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 h-14 text-lg font-semibold"
                  >
                    {saveWorkoutMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Salvar Treino
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
