import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Trash2, Sparkles, Loader2 } from "lucide-react";

export default function NutritionPlanFormModal({ plan, onClose }) {
  const queryClient = useQueryClient();
  const [isCalculating, setIsCalculating] = useState(false);
  const [showAIForm, setShowAIForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goal: "lose_weight",
    daily_calories: 2000,
    macros_distribution: {
      protein_percentage: 30,
      carbs_percentage: 40,
      fat_percentage: 30,
    },
    meals: [],
    is_premium: false,
    tips: [],
  });

  const [newMeal, setNewMeal] = useState({ meal_type: "", foods: [""] });
  const [newTip, setNewTip] = useState("");

  // AI Form State
  const [aiFormData, setAiFormData] = useState({
    target_protein: "",
    target_carbs: "",
    target_fat: "",
    target_calories: "",
    foods_list: "",
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        title: plan.title || "",
        description: plan.description || "",
        goal: plan.goal || "lose_weight",
        daily_calories: plan.daily_calories || 2000,
        macros_distribution: plan.macros_distribution || {
          protein_percentage: 30,
          carbs_percentage: 40,
          fat_percentage: 30,
        },
        meals: plan.meals || [],
        is_premium: plan.is_premium || false,
        tips: plan.tips || [],
      });
    }
  }, [plan]);

  const calculateNutritionMutation = useMutation({
    mutationFn: async (meals) => {
      const mealsText = meals.map(m => 
        `${m.meal_type}: ${m.foods ? m.foods.join(', ') : m.suggestions?.join(', ')}`
      ).join('\n');

      const prompt = `
Analise o seguinte plano alimentar e calcule os valores nutricionais totais diários:

${mealsText}

Retorne:
1. Total de calorias diárias
2. Distribuição de macronutrientes em porcentagens (proteína, carboidratos, gorduras)

Seja preciso com base nas quantidades típicas dos alimentos mencionados.
`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            daily_calories: { type: "number" },
            macros_distribution: {
              type: "object",
              properties: {
                protein_percentage: { type: "number" },
                carbs_percentage: { type: "number" },
                fat_percentage: { type: "number" }
              }
            }
          }
        }
      });

      return result;
    },
    onSuccess: (result) => {
      setFormData({
        ...formData,
        daily_calories: result.daily_calories,
        macros_distribution: result.macros_distribution,
      });
      setIsCalculating(false);
      alert("Valores nutricionais calculados com sucesso! ✅");
    },
    onError: () => {
      setIsCalculating(false);
      alert("Erro ao calcular. Tente novamente.");
    }
  });

  const generateWithAIMutation = useMutation({
    mutationFn: async (data) => {
      const prompt = `
Crie um plano alimentar PRECISO com base nos seguintes macros e alimentos:

**MACROS ALVO (diários):**
- Proteínas: ${data.target_protein}g
- Carboidratos: ${data.target_carbs}g
- Gorduras: ${data.target_fat}g
- Calorias totais: ${data.target_calories} kcal

**ALIMENTOS DISPONÍVEIS (use APENAS estes):**
${data.foods_list}

**INSTRUÇÕES CRÍTICAS:**
1. Use APENAS os alimentos da lista fornecida
2. Distribua os alimentos em 4-6 refeições ao longo do dia
3. As quantidades DEVEM bater EXATAMENTE (ou muito próximo) com os macros especificados
4. Use gramas (g) para todos os alimentos
5. Seja preciso nas quantidades para atingir os macros
6. Crie um título e descrição para o plano
7. Adicione 3-5 dicas nutricionais relevantes

Não invente alimentos que não estão na lista!
`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            meals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  meal_type: { type: "string" },
                  foods: {
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
      setFormData({
        ...formData,
        title: result.title,
        description: result.description,
        daily_calories: parseInt(aiFormData.target_calories),
        macros_distribution: {
          protein_percentage: Math.round((parseInt(aiFormData.target_protein) * 4 / parseInt(aiFormData.target_calories)) * 100),
          carbs_percentage: Math.round((parseInt(aiFormData.target_carbs) * 4 / parseInt(aiFormData.target_calories)) * 100),
          fat_percentage: Math.round((parseInt(aiFormData.target_fat) * 9 / parseInt(aiFormData.target_calories)) * 100),
        },
        meals: result.meals,
        tips: result.tips,
      });
      setShowAIForm(false);
      alert("Plano gerado pela IA com sucesso! 🎉");
    },
  });

  const handleCalculateNutrition = () => {
    if (formData.meals.length === 0) {
      alert("Adicione pelo menos uma refeição antes de calcular");
      return;
    }
    setIsCalculating(true);
    calculateNutritionMutation.mutate(formData.meals);
  };

  const handleGenerateWithAI = () => {
    if (!aiFormData.target_calories || !aiFormData.target_protein || !aiFormData.target_carbs || !aiFormData.target_fat || !aiFormData.foods_list) {
      alert("Preencha todos os campos para gerar com IA");
      return;
    }
    generateWithAIMutation.mutate(aiFormData);
  };

  const saveMutation = useMutation({
    mutationFn: (data) => {
      // Converter suggestions para foods se necessário
      const mealsToSave = data.meals.map(meal => ({
        ...meal,
        foods: meal.foods || meal.suggestions || [],
        suggestions: meal.foods || meal.suggestions || [], // Manter compatibilidade
      }));

      const dataToSave = {
        ...data,
        meals: mealsToSave,
      };

      if (plan) {
        return base44.entities.NutritionPlan.update(plan.id, dataToSave);
      }
      return base44.entities.NutritionPlan.create(dataToSave);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-nutrition-plans']);
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const addMeal = () => {
    if (newMeal.meal_type && newMeal.foods.some(f => f.trim())) {
      setFormData({
        ...formData,
        meals: [...formData.meals, { 
          meal_type: newMeal.meal_type,
          foods: newMeal.foods.filter(f => f.trim()),
          suggestions: newMeal.foods.filter(f => f.trim()), // Compatibilidade
        }],
      });
      setNewMeal({ meal_type: "", foods: [""] });
    }
  };

  const removeMeal = (index) => {
    setFormData({
      ...formData,
      meals: formData.meals.filter((_, i) => i !== index),
    });
  };

  const addFoodInput = () => {
    setNewMeal({
      ...newMeal,
      foods: [...newMeal.foods, ""]
    });
  };

  const removeFoodInput = (index) => {
    setNewMeal({
      ...newMeal,
      foods: newMeal.foods.filter((_, i) => i !== index)
    });
  };

  const updateFoodInput = (index, value) => {
    const updatedFoods = [...newMeal.foods];
    updatedFoods[index] = value;
    setNewMeal({
      ...newMeal,
      foods: updatedFoods
    });
  };

  const addTip = () => {
    if (newTip.trim()) {
      setFormData({
        ...formData,
        tips: [...formData.tips, newTip.trim()],
      });
      setNewTip("");
    }
  };

  const removeTip = (index) => {
    setFormData({
      ...formData,
      tips: formData.tips.filter((_, i) => i !== index),
    });
  };

  if (showAIForm) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <Card className="bg-slate-900 border-slate-800 max-w-2xl w-full my-8">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800">
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Gerar Plano com IA
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowAIForm(false)}>
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-slate-400 text-sm">
              A IA criará um plano usando APENAS os alimentos que você especificar, batendo exatamente os macros desejados.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Proteína (g) *</Label>
                <Input
                  type="number"
                  value={aiFormData.target_protein}
                  onChange={(e) => setAiFormData({...aiFormData, target_protein: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Ex: 150"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Carboidratos (g) *</Label>
                <Input
                  type="number"
                  value={aiFormData.target_carbs}
                  onChange={(e) => setAiFormData({...aiFormData, target_carbs: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Ex: 200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Gorduras (g) *</Label>
                <Input
                  type="number"
                  value={aiFormData.target_fat}
                  onChange={(e) => setAiFormData({...aiFormData, target_fat: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Ex: 50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Calorias Totais *</Label>
                <Input
                  type="number"
                  value={aiFormData.target_calories}
                  onChange={(e) => setAiFormData({...aiFormData, target_calories: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Ex: 2000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Alimentos Permitidos *</Label>
              <Textarea
                value={aiFormData.foods_list}
                onChange={(e) => setAiFormData({...aiFormData, foods_list: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white min-h-40"
                placeholder="Liste os alimentos que deseja usar, um por linha:&#10;Ex:&#10;Frango (peito)&#10;Arroz integral&#10;Batata doce&#10;Ovos&#10;Brócolis&#10;Azeite de oliva&#10;Banana&#10;Aveia"
              />
              <p className="text-slate-500 text-xs">
                💡 A IA usará APENAS estes alimentos e ajustará as quantidades para bater os macros
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <Button
                variant="outline"
                onClick={() => setShowAIForm(false)}
                className="flex-1 border-slate-700"
              >
                Voltar
              </Button>
              <Button
                onClick={handleGenerateWithAI}
                disabled={generateWithAIMutation.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {generateWithAIMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Plano
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="bg-slate-900 border-slate-800 max-w-3xl w-full my-8">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800">
          <CardTitle className="text-white">
            {plan ? "Editar Plano Alimentar" : "Novo Plano Alimentar"}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAIForm(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              IA
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Título *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Ex: Plano Low Carb"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Objetivo *</Label>
                <Select
                  value={formData.goal}
                  onValueChange={(value) => setFormData({ ...formData, goal: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose_weight">🔥 Emagrecer</SelectItem>
                    <SelectItem value="gain_muscle">💪 Ganhar Massa</SelectItem>
                    <SelectItem value="maintain">⚖️ Manter</SelectItem>
                    <SelectItem value="performance">⚡ Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Descreva o plano alimentar..."
              />
            </div>

            {/* Calories & Macros */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Calorias/dia *</Label>
                <Input
                  type="number"
                  value={formData.daily_calories}
                  onChange={(e) => setFormData({ ...formData, daily_calories: parseInt(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Proteína %</Label>
                <Input
                  type="number"
                  value={formData.macros_distribution.protein_percentage}
                  onChange={(e) => setFormData({
                    ...formData,
                    macros_distribution: {
                      ...formData.macros_distribution,
                      protein_percentage: parseInt(e.target.value),
                    }
                  })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Carbos %</Label>
                <Input
                  type="number"
                  value={formData.macros_distribution.carbs_percentage}
                  onChange={(e) => setFormData({
                    ...formData,
                    macros_distribution: {
                      ...formData.macros_distribution,
                      carbs_percentage: parseInt(e.target.value),
                    }
                  })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Gorduras %</Label>
                <Input
                  type="number"
                  value={formData.macros_distribution.fat_percentage}
                  onChange={(e) => setFormData({
                    ...formData,
                    macros_distribution: {
                      ...formData.macros_distribution,
                      fat_percentage: parseInt(e.target.value),
                    }
                  })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            {/* Meals */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">Refeições e Alimentos</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCalculateNutrition}
                  disabled={isCalculating || formData.meals.length === 0}
                  className="border-blue-700 text-blue-400 hover:bg-blue-900/30"
                >
                  {isCalculating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Calculando...
                    </>
                  ) : (
                    "Calcular Nutrição"
                  )}
                </Button>
              </div>
              
              {formData.meals.map((meal, index) => (
                <div key={index} className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-white font-medium">{meal.meal_type}</p>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeMeal(index)}
                      className="text-red-400 hover:text-red-300 h-6 w-6"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {(meal.foods || meal.suggestions || []).map((food, idx) => (
                      <p key={idx} className="text-slate-400 text-sm">• {food}</p>
                    ))}
                  </div>
                </div>
              ))}

              <div className="space-y-3 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                <Input
                  placeholder="Nome da Refeição (ex: Café da Manhã)"
                  value={newMeal.meal_type}
                  onChange={(e) => setNewMeal({ ...newMeal, meal_type: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">Alimentos:</Label>
                  {newMeal.foods.map((food, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Ex: 150g de frango grelhado"
                        value={food}
                        onChange={(e) => updateFoodInput(index, e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                      {newMeal.foods.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeFoodInput(index)}
                          className="text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addFoodInput}
                    className="border-slate-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Alimento
                  </Button>
                </div>

                <Button
                  type="button"
                  onClick={addMeal}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Refeição
                </Button>
              </div>
            </div>

            {/* Tips */}
            <div className="space-y-3">
              <Label className="text-slate-300">Dicas Nutricionais</Label>
              
              {formData.tips.map((tip, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg">
                  <p className="flex-1 text-slate-300 text-sm">{tip}</p>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeTip(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <div className="flex gap-2">
                <Input
                  placeholder="Digite uma dica nutricional..."
                  value={newTip}
                  onChange={(e) => setNewTip(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTip())}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <Button
                  type="button"
                  onClick={addTip}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>

            {/* Premium */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_premium"
                checked={formData.is_premium}
                onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="is_premium" className="text-slate-300">
                Plano Premium (exclusivo para assinantes)
              </Label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-slate-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {saveMutation.isPending ? "Salvando..." : "Salvar Plano"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}