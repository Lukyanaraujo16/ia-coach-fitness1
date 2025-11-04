
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Zap, CheckCircle, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function WorkoutGenerator({ user }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    objetivo: user?.fitness_goal || 'gain_muscle',
    nivel: user?.fitness_level || 'intermediate',
    local: user?.training_location || 'gym',
    dias_semana: '5',
    duracao: '60',
    foco: '',
    observacoes: ''
  });
  const [generatedWorkout, setGeneratedWorkout] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const saveWorkoutMutation = useMutation({
    mutationFn: (workout) => base44.entities.Workout.create(workout),
    onSuccess: () => {
      queryClient.invalidateQueries(['workouts']);
      alert('Treino salvo com sucesso! Acesse na aba Treinos.');
      setGeneratedWorkout(null);
    },
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const objetivoMap = {
        lose_weight: 'Perda de peso e definição muscular',
        gain_muscle: 'Ganho de massa muscular (hipertrofia)',
        maintain: 'Manutenção e condicionamento geral'
      };

      const nivelMap = {
        beginner: 'Iniciante',
        intermediate: 'Intermediário',
        advanced: 'Avançado'
      };

      const localMap = {
        gym: 'Academia (com equipamentos completos)',
        home: 'Casa (equipamentos limitados ou peso corporal)',
        both: 'Flexível (academia e casa)'
      };

      const prompt = `Você é um personal trainer expert. Crie um programa de treino COMPLETO e DETALHADO.

**Requisitos:**
- Objetivo: ${objetivoMap[formData.objetivo]}
- Nível: ${nivelMap[formData.nivel]}
- Local: ${localMap[formData.local]}
- Dias por semana: ${formData.dias_semana}
- Duração por sessão: ${formData.duracao} minutos
${formData.foco ? `- Foco especial: ${formData.foco}` : ''}
${formData.observacoes ? `- Observações: ${formData.observacoes}` : ''}

**Formato de Resposta (JSON):**
{
  "title": "Nome do programa",
  "description": "Descrição breve",
  "category": "strength/cardio/hiit/full_body",
  "difficulty": "beginner/intermediate/advanced",
  "training_location": "gym/home/both",
  "duration_minutes": número,
  "days": [
    {
      "day_number": 1,
      "title": "Nome do dia (ex: Peito e Tríceps)",
      "exercises": [
        {
          "exercise_name": "Nome do exercício",
          "exercise_category": "chest/back/legs/etc",
          "sets": [
            {
              "times": 1,
              "reps": "10-12",
              "rest_seconds": 60,
              "notes": "Dica importante"
            }
          ],
          "notes": "Observações gerais"
        }
      ]
    }
  ]
}

IMPORTANTE:
- Crie ${formData.dias_semana} dias de treino completos
- Cada dia deve ter 4-6 exercícios apropriados
- Cada exercício deve ter 3-4 séries
- Inclua exercícios variados e eficientes
- Adicione dicas de execução nas "notes"
- Seja específico e prático`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            difficulty: { type: "string" },
            training_location: { type: "string" },
            duration_minutes: { type: "number" },
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
            }
          }
        }
      });

      setGeneratedWorkout(response);
    } catch (error) {
      // Silenciar erros de abort completamente
      if (!error.message?.includes('abort')) {
        console.error("Error generating workout:", error);
        alert("Erro ao gerar treino. Tente novamente.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveWorkout = () => {
    if (!generatedWorkout) return;
    saveWorkoutMutation.mutate({
      ...generatedWorkout,
      is_premium: true
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Gerador de Treino Personalizado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Objetivo</Label>
              <Select value={formData.objetivo} onValueChange={(v) => setFormData({...formData, objetivo: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lose_weight">Emagrecer</SelectItem>
                  <SelectItem value="gain_muscle">Ganhar Massa</SelectItem>
                  <SelectItem value="maintain">Manter Forma</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Nível</Label>
              <Select value={formData.nivel} onValueChange={(v) => setFormData({...formData, nivel: v})}>
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
              <Label className="text-slate-300">Local de Treino</Label>
              <Select value={formData.local} onValueChange={(v) => setFormData({...formData, local: v})}>
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
              <Label className="text-slate-300">Dias por Semana</Label>
              <Select value={formData.dias_semana} onValueChange={(v) => setFormData({...formData, dias_semana: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 dias</SelectItem>
                  <SelectItem value="4">4 dias</SelectItem>
                  <SelectItem value="5">5 dias</SelectItem>
                  <SelectItem value="6">6 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Duração por Sessão (min)</Label>
              <Input
                type="number"
                value={formData.duracao}
                onChange={(e) => setFormData({...formData, duracao: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Foco Especial (opcional)</Label>
              <Input
                value={formData.foco}
                onChange={(e) => setFormData({...formData, foco: e.target.value})}
                placeholder="Ex: glúteos, braços, core..."
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Observações (opcional)</Label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              placeholder="Lesões, limitações, preferências..."
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 h-12 text-base font-semibold"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Criando seu treino perfeito...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Gerar Treino com IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedWorkout && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border-green-700/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Treino Gerado com Sucesso!
                </CardTitle>
                <Button
                  onClick={handleSaveWorkout}
                  disabled={saveWorkoutMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saveWorkoutMutation.isPending ? "Salvando..." : "Salvar Treino"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{generatedWorkout.title}</h3>
                <p className="text-slate-300">{generatedWorkout.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-slate-800/50 p-2 rounded">
                  <p className="text-slate-400 text-xs">Duração</p>
                  <p className="text-white font-bold">{generatedWorkout.duration_minutes}min</p>
                </div>
                <div className="bg-slate-800/50 p-2 rounded">
                  <p className="text-slate-400 text-xs">Dias</p>
                  <p className="text-white font-bold">{generatedWorkout.days?.length}</p>
                </div>
                <div className="bg-slate-800/50 p-2 rounded">
                  <p className="text-slate-400 text-xs">Total Exercícios</p>
                  <p className="text-white font-bold">
                    {generatedWorkout.days?.reduce((sum, day) => sum + day.exercises.length, 0)}
                  </p>
                </div>
              </div>

              {/* Preview dos Dias */}
              <div className="space-y-2">
                <h4 className="text-white font-semibold">Dias do Treino:</h4>
                {generatedWorkout.days?.map((day, index) => (
                  <div key={index} className="bg-slate-800/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">Dia {day.day_number}: {day.title}</span>
                      <span className="text-slate-400 text-sm">{day.exercises.length} exercícios</span>
                    </div>
                    <div className="space-y-1">
                      {day.exercises.map((ex, exIndex) => (
                        <div key={exIndex} className="text-slate-300 text-sm flex items-center gap-2">
                          <Target className="w-3 h-3 text-blue-400" />
                          {ex.exercise_name} ({ex.sets.length} séries)
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
