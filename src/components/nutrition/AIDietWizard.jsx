import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, ChevronRight, ChevronLeft, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  { id: "goal", title: "Qual seu objetivo?" },
  { id: "weight_confirm", title: "Confirme seu Peso" },
  { id: "macros", title: "Distribuição de Macros" },
  { id: "preferences", title: "Preferências Alimentares" },
  { id: "restrictions", title: "Restrições" },
  { id: "details", title: "Detalhes Finais" },
];

export default function AIDietWizard({ user, onClose }) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  
  const [formData, setFormData] = useState({
    goal: "",
    current_weight: user?.current_weight || "",
    calculated_calories: 0,
    protein_percentage: 30,
    carbs_percentage: 40,
    fat_percentage: 30,
    target_weight: "",
    weekly_goal: "0.5",
    favorite_foods: "",
    disliked_foods: "",
    dietary_restrictions: "",
    allergies: "",
    meals_per_day: "4",
    cooking_time: "medium",
    budget: "medium",
  });

  const generateDietMutation = useMutation({
    mutationFn: async (data) => {
      const prompt = `
Crie um plano alimentar personalizado COMPLETO com base nas seguintes informações do usuário:

**PERFIL DO USUÁRIO:**
- Objetivo: ${data.goal === 'lose_weight' ? 'Emagrecer' : data.goal === 'gain_muscle' ? 'Ganhar massa muscular' : 'Manter peso'}
- Peso atual: ${data.current_weight}kg
- Peso meta: ${data.target_weight || user.weight_goal || 'não informado'}kg
- Meta semanal: ${data.weekly_goal}kg/semana
- Nível fitness: ${user.fitness_level || 'iniciante'}
- Altura: ${user.height || 'não informada'}cm

**METAS NUTRICIONAIS:**
- Calorias máximas diárias: ${data.calculated_calories} kcal
- Distribuição de macronutrientes:
  * Proteínas: ${data.protein_percentage}%
  * Carboidratos: ${data.carbs_percentage}%
  * Gorduras: ${data.fat_percentage}%

**PREFERÊNCIAS:**
- Alimentos favoritos: ${data.favorite_foods || 'sem preferências específicas'}
- Alimentos que não gosta: ${data.disliked_foods || 'nenhum'}
- Refeições por dia: ${data.meals_per_day}
- Tempo para cozinhar: ${data.cooking_time === 'low' ? 'Pouco (refeições rápidas)' : data.cooking_time === 'medium' ? 'Moderado' : 'Muito (posso preparar refeições elaboradas)'}
- Orçamento: ${data.budget === 'low' ? 'Econômico' : data.budget === 'medium' ? 'Moderado' : 'Flexível'}

**RESTRIÇÕES:**
- Restrições alimentares: ${data.dietary_restrictions || 'nenhuma'}
- Alergias: ${data.allergies || 'nenhuma'}

**INSTRUÇÕES:**
Crie um plano alimentar COMPLETO e DETALHADO que respeite EXATAMENTE as metas nutricionais acima:
1. As calorias diárias DEVEM ser NO MÁXIMO ${data.calculated_calories} kcal
2. A distribuição de macronutrientes DEVE ser ${data.protein_percentage}% proteína, ${data.carbs_percentage}% carboidratos, ${data.fat_percentage}% gorduras
3. Liste TODAS as refeições com horários e alimentos específicos
4. Pelo menos 5-7 dicas nutricionais práticas e personalizadas
5. Um título atraente para o plano
6. Descrição motivadora

IMPORTANTE: 
- Seja específico nas sugestões de alimentos
- SEMPRE use GRAMAS (g) para alimentos que podem ser pesados (ex: 150g de frango, 200g de arroz, 100g de batata doce)
- Use unidades apropriadas para outros itens (ex: 2 ovos, 1 banana, 1 fatia de pão)
- Considere as preferências e restrições mencionadas
- As quantidades devem bater com as calorias e macros especificados
- As sugestões devem ser práticas e viáveis
`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            daily_calories: { type: "number" },
            macros_distribution: {
              type: "object",
              properties: {
                protein_percentage: { type: "number" },
                carbs_percentage: { type: "number" },
                fat_percentage: { type: "number" }
              }
            },
            meals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  meal_type: { type: "string" },
                  time: { type: "string" },
                  suggestions: {
                    type: "array",
                    items: { type: "string" }
                  }
                }
              }
            },
            tips: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      return result;
    },
    onSuccess: (result) => {
      setGeneratedPlan(result);
    },
  });

  const savePlanMutation = useMutation({
    mutationFn: async (planData) => {
      // Salvar o plano
      await base44.entities.NutritionPlan.create(planData);
      
      // Atualizar a meta de calorias do usuário
      await base44.auth.updateMe({
        daily_calorie_goal: formData.calculated_calories,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['nutrition-plans']);
      alert("Seu plano alimentar foi salvo com sucesso! 🎉");
      onClose();
      window.location.reload(); // Recarregar para atualizar a meta
    },
  });

  const handleNext = () => {
    if (currentStep === 0 && formData.goal === "lose_weight") {
      // Calcular calorias para emagrecimento
      const calculatedCal = Math.round(parseFloat(formData.current_weight) * 20);
      setFormData({ ...formData, calculated_calories: calculatedCal });
      setCurrentStep(currentStep + 1);
    } else if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleGenerate();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateDietMutation.mutateAsync(formData);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!generatedPlan) return;

    const goalMap = {
      lose_weight: "lose_weight",
      gain_muscle: "gain_muscle",
      maintain: "maintain",
    };

    savePlanMutation.mutate({
      ...generatedPlan,
      goal: goalMap[formData.goal] || "maintain",
      is_premium: false,
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.goal;
      case 1:
        return formData.current_weight && parseFloat(formData.current_weight) > 0;
      case 2:
        const total = formData.protein_percentage + formData.carbs_percentage + formData.fat_percentage;
        return total === 100;
      case 3:
        return true; // Preferências são opcionais
      case 4:
        return true; // Restrições são opcionais
      case 5:
        return formData.meals_per_day;
      default:
        return false;
    }
  };

  if (generatedPlan) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <Card className="bg-slate-900 border-slate-800 max-w-3xl w-full my-8">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800">
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Seu Plano Personalizado
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">{generatedPlan.title}</h3>
              <p className="text-slate-300">{generatedPlan.description}</p>
            </div>

            <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-lg text-center">
              <p className="text-3xl font-bold text-green-400 mb-1">
                {generatedPlan.daily_calories} kcal/dia
              </p>
              <p className="text-slate-500 text-sm">Meta máxima de calorias</p>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div>
                  <p className="text-blue-400 font-bold">{generatedPlan.macros_distribution.protein_percentage}%</p>
                  <p className="text-slate-500 text-xs">Proteína</p>
                </div>
                <div>
                  <p className="text-orange-400 font-bold">{generatedPlan.macros_distribution.carbs_percentage}%</p>
                  <p className="text-slate-500 text-xs">Carbos</p>
                </div>
                <div>
                  <p className="text-yellow-400 font-bold">{generatedPlan.macros_distribution.fat_percentage}%</p>
                  <p className="text-slate-500 text-xs">Gorduras</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Suas Refeições:</h4>
              <div className="space-y-3">
                {generatedPlan.meals.map((meal, index) => (
                  <div key={index} className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">{meal.meal_type}</p>
                      <p className="text-slate-400 text-sm">{meal.time}</p>
                    </div>
                    <ul className="space-y-1">
                      {meal.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="text-slate-300 text-sm">• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">💡 Dicas Personalizadas:</h4>
              <ul className="space-y-2">
                {generatedPlan.tips.map((tip, index) => (
                  <li key={index} className="text-slate-300 text-sm">• {tip}</li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 border-slate-700"
              >
                Fechar
              </Button>
              <Button
                onClick={handleSave}
                disabled={savePlanMutation.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {savePlanMutation.isPending ? "Salvando..." : "Salvar Meu Plano"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-slate-900 border-slate-800 max-w-2xl w-full">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800">
          <div className="flex-1">
            <CardTitle className="text-white mb-2">
              Criar Dieta Personalizada com IA
            </CardTitle>
            <div className="flex gap-2">
              {STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    index <= currentStep ? 'bg-purple-600' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {STEPS[currentStep].title}
                </h3>
                <p className="text-slate-400 text-sm">
                  Passo {currentStep + 1} de {STEPS.length}
                </p>
              </div>

              {/* Step 0: Goal */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Qual seu objetivo? *</Label>
                    <Select
                      value={formData.goal}
                      onValueChange={(value) => setFormData({ ...formData, goal: value })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lose_weight">🔥 Emagrecer</SelectItem>
                        <SelectItem value="gain_muscle">💪 Ganhar Massa</SelectItem>
                        <SelectItem value="maintain">⚖️ Manter Peso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 1: Weight Confirmation */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-blue-400 font-semibold mb-1">
                          Confirmação Importante
                        </p>
                        <p className="text-slate-300 text-sm">
                          Vamos calcular sua meta de calorias com base no seu peso atual.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Seu peso atual está correto? *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.current_weight}
                      onChange={(e) => setFormData({ ...formData, current_weight: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Ex: 75"
                    />
                    <p className="text-slate-500 text-xs">
                      Peso atual cadastrado: {user?.current_weight || 'não informado'} kg
                    </p>
                  </div>

                  {formData.current_weight && parseFloat(formData.current_weight) > 0 && (
                    <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-lg">
                      <p className="text-green-400 font-semibold mb-1">
                        Meta de Calorias Calculada
                      </p>
                      <p className="text-white text-2xl font-bold">
                        {Math.round(parseFloat(formData.current_weight) * 20)} kcal/dia
                      </p>
                      <p className="text-slate-400 text-sm mt-1">
                        Este será o MÁXIMO de calorias da sua dieta de emagrecimento
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Macros Distribution */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                    <p className="text-blue-400 font-semibold mb-1">
                      Distribua os macronutrientes
                    </p>
                    <p className="text-slate-300 text-sm">
                      A soma deve ser exatamente 100%
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Proteínas (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.protein_percentage}
                        onChange={(e) => setFormData({ ...formData, protein_percentage: parseInt(e.target.value) || 0 })}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-300">Carboidratos (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.carbs_percentage}
                        onChange={(e) => setFormData({ ...formData, carbs_percentage: parseInt(e.target.value) || 0 })}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-300">Gorduras (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.fat_percentage}
                        onChange={(e) => setFormData({ ...formData, fat_percentage: parseInt(e.target.value) || 0 })}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  </div>

                  {/* Total */}
                  <div className={`p-4 rounded-lg ${
                    (formData.protein_percentage + formData.carbs_percentage + formData.fat_percentage) === 100
                      ? 'bg-green-900/20 border border-green-800/50'
                      : 'bg-red-900/20 border border-red-800/50'
                  }`}>
                    <p className={`font-bold ${
                      (formData.protein_percentage + formData.carbs_percentage + formData.fat_percentage) === 100
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}>
                      Total: {formData.protein_percentage + formData.carbs_percentage + formData.fat_percentage}%
                    </p>
                    {(formData.protein_percentage + formData.carbs_percentage + formData.fat_percentage) !== 100 && (
                      <p className="text-red-300 text-sm mt-1">
                        A soma deve ser exatamente 100%
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Preferences */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Alimentos Favoritos</Label>
                    <Textarea
                      value={formData.favorite_foods}
                      onChange={(e) => setFormData({ ...formData, favorite_foods: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Ex: frango, batata doce, ovos, brócolis..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Alimentos que Não Gosta</Label>
                    <Textarea
                      value={formData.disliked_foods}
                      onChange={(e) => setFormData({ ...formData, disliked_foods: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Ex: peixe, couve-flor..."
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Restrictions */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Restrições Alimentares</Label>
                    <Textarea
                      value={formData.dietary_restrictions}
                      onChange={(e) => setFormData({ ...formData, dietary_restrictions: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Ex: vegetariano, vegano, sem glúten, sem lactose..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Alergias</Label>
                    <Textarea
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="Ex: amendoim, frutos do mar..."
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Details */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Quantas refeições por dia?</Label>
                    <Select
                      value={formData.meals_per_day}
                      onValueChange={(value) => setFormData({ ...formData, meals_per_day: value })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 refeições</SelectItem>
                        <SelectItem value="4">4 refeições</SelectItem>
                        <SelectItem value="5">5 refeições</SelectItem>
                        <SelectItem value="6">6 refeições</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Tempo para Cozinhar</Label>
                    <Select
                      value={formData.cooking_time}
                      onValueChange={(value) => setFormData({ ...formData, cooking_time: value })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Pouco (refeições rápidas)</SelectItem>
                        <SelectItem value="medium">Moderado</SelectItem>
                        <SelectItem value="high">Muito (posso preparar refeições elaboradas)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Orçamento</Label>
                    <Select
                      value={formData.budget}
                      onValueChange={(value) => setFormData({ ...formData, budget: value })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Econômico</SelectItem>
                        <SelectItem value="medium">Moderado</SelectItem>
                        <SelectItem value="high">Flexível</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3 mt-8">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="border-slate-700"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isGenerating}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando Dieta...
                </>
              ) : currentStep === STEPS.length - 1 ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Minha Dieta
                </>
              ) : (
                <>
                  Continuar
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}