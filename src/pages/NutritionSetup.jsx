
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Loader2, Check, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const dietaryOptions = [
  { value: "vegetarian", label: "Vegetariano", emoji: "🥗" },
  { value: "vegan", label: "Vegano", emoji: "🌱" },
  { value: "pescatarian", label: "Pescetariano", emoji: "🐟" },
  { value: "keto", label: "Keto", emoji: "🥑" },
  { value: "paleo", label: "Paleo", emoji: "🥩" },
  { value: "low_carb", label: "Low Carb", emoji: "🚫🍞" },
  { value: "high_protein", label: "Alta Proteína", emoji: "💪" },
  { value: "gluten_free", label: "Sem Glúten", emoji: "🌾" },
  { value: "dairy_free", label: "Sem Lactose", emoji: "🥛" },
];

export default function NutritionSetup() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  
  const [formData, setFormData] = useState({
    dietary_preferences: [],
    food_allergies: [],
    disliked_foods: [],
    meals_per_day: 3,
  });
  
  const [newAllergy, setNewAllergy] = useState("");
  const [newDislike, setNewDislike] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (!currentUser.onboarding_completed) {
          navigate(createPageUrl("Onboarding"));
        } else if (currentUser.nutrition_setup_completed) {
          navigate(createPageUrl("WorkoutSetup"));
        }
      } catch (error) {
        base44.auth.redirectToLogin(createPageUrl("NutritionSetup"));
      }
    };
    loadUser();
  }, [navigate]);

  const togglePreference = (value) => {
    const current = formData.dietary_preferences;
    if (current.includes(value)) {
      setFormData({
        ...formData,
        dietary_preferences: current.filter(p => p !== value)
      });
    } else {
      setFormData({
        ...formData,
        dietary_preferences: [...current, value]
      });
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setFormData({
        ...formData,
        food_allergies: [...formData.food_allergies, newAllergy.trim()]
      });
      setNewAllergy("");
    }
  };

  const removeAllergy = (index) => {
    setFormData({
      ...formData,
      food_allergies: formData.food_allergies.filter((_, i) => i !== index)
    });
  };

  const addDislike = () => {
    if (newDislike.trim()) {
      setFormData({
        ...formData,
        disliked_foods: [...formData.disliked_foods, newDislike.trim()]
      });
      setNewDislike("");
    }
  };

  const removeDislike = (index) => {
    setFormData({
      ...formData,
      disliked_foods: formData.disliked_foods.filter((_, i) => i !== index)
    });
  };

  const generateNutritionPlan = async () => {
    setGeneratingPlan(true);
    try {
      // Calcular calorias baseado em gênero e objetivo
      let calorieGoal;
      let proteinPercentage, carbsPercentage, fatPercentage;
      
      const weight = user.current_weight;
      const gender = user.gender;
      const goal = user.fitness_goal;

      // Definir calorias e macros baseado em gênero e objetivo
      if (goal === 'lose_weight') {
        // Emagrecimento
        if (gender === 'female') {
          calorieGoal = weight * 20;
        } else {
          calorieGoal = weight * 23;
        }
        proteinPercentage = 40;
        carbsPercentage = 35;
        fatPercentage = 25;
      } else if (goal === 'maintain') {
        // Manutenção
        if (gender === 'female') {
          calorieGoal = weight * 25;
        } else {
          calorieGoal = weight * 27;
        }
        proteinPercentage = 40;
        carbsPercentage = 35;
        fatPercentage = 25;
      } else { // gain_muscle
        // Ganho de massa
        if (gender === 'female') {
          calorieGoal = (weight * 23 + 300) * 1.55;
        } else {
          calorieGoal = (weight * 25 + 300) * 1.55;
        }
        proteinPercentage = 40;
        carbsPercentage = 40;
        fatPercentage = 20;
      }

      // Arredondar calorias
      calorieGoal = Math.round(calorieGoal);

      const prompt = `Você é um nutricionista experiente criando um plano alimentar COMPLETO para um novo aluno.

INFORMAÇÕES DO ALUNO:
- Nome: ${user.full_name}
- Objetivo: ${user.fitness_goal === 'lose_weight' ? 'Emagrecimento' : user.fitness_goal === 'gain_muscle' ? 'Ganho de massa' : 'Manutenção'}
- Peso: ${user.current_weight}kg
- Altura: ${user.height}cm
- Meta de peso: ${user.weight_goal}kg
- Nível: ${user.fitness_level}
- Gênero: ${user.gender === 'male' ? 'Masculino' : user.gender === 'female' ? 'Feminino' : 'Outro'}

PREFERÊNCIAS ALIMENTARES:
${formData.dietary_preferences.length > 0 ? '- Dietas: ' + formData.dietary_preferences.join(', ') : '- Sem restrições de dieta'}
${formData.food_allergies.length > 0 ? '- Alergias: ' + formData.food_allergies.join(', ') : '- Sem alergias'}
${formData.disliked_foods.length > 0 ? '- Não gosta: ' + formData.disliked_foods.join(', ') : '- Sem restrições'}
- Refeições/dia: ${formData.meals_per_day}

METAS CALCULADAS:
- Calorias diárias: ${calorieGoal} kcal
- Proteínas: ${proteinPercentage}%
- Carboidratos: ${carbsPercentage}%
- Gorduras: ${fatPercentage}%

Crie um plano nutricional COMPLETO e PERSONALIZADO com:

1. Calcule e CONFIRME a distribuição de macronutrientes em PORCENTAGENS (deve somar 100%)
2. Forneça 5-8 recomendações práticas e específicas para este aluno
3. Liste 8-10 alimentos ESPECÍFICOS recomendados (considerando as restrições)
4. Liste 5-8 alimentos ESPECÍFICOS a evitar (baseado no objetivo)
5. Crie um exemplo de dia alimentar com ${formData.meals_per_day} refeições, incluindo horários
6. Forneça 5-8 dicas práticas de nutrição e hidratação

Seja ESPECÍFICO, PRÁTICO e considere TODAS as preferências e restrições mencionadas.
Use ingredientes BRASILEIROS e acessíveis.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            daily_calories: {
              type: "number",
              description: "Meta de calorias diárias"
            },
            macros: {
              type: "object",
              properties: {
                protein_percentage: { type: "number", minimum: 20, maximum: 50 },
                carbs_percentage: { type: "number", minimum: 20, maximum: 55 },
                fat_percentage: { type: "number", minimum: 15, maximum: 35 }
              },
              required: ["protein_percentage", "carbs_percentage", "fat_percentage"]
            },
            recommendations: {
              type: "array",
              minItems: 5,
              maxItems: 8,
              items: { type: "string" },
              description: "Recomendações práticas e específicas"
            },
            recommended_foods: {
              type: "array",
              minItems: 8,
              maxItems: 10,
              items: { type: "string" },
              description: "Alimentos recomendados específicos"
            },
            foods_to_avoid: {
              type: "array",
              minItems: 5,
              maxItems: 8,
              items: { type: "string" },
              description: "Alimentos a evitar"
            },
            meal_timing: {
              type: "array",
              minItems: formData.meals_per_day,
              maxItems: formData.meals_per_day,
              items: {
                type: "object",
                properties: {
                  time: { type: "string" },
                  meal_type: { type: "string" },
                  suggestion: { type: "string" },
                  calories: { type: "number" }
                },
                required: ["time", "meal_type", "suggestion", "calories"]
              },
              description: "Exemplo de distribuição de refeições"
            },
            tips: {
              type: "array",
              minItems: 5,
              maxItems: 8,
              items: { type: "string" },
              description: "Dicas práticas de nutrição"
            },
            hydration_goal: {
              type: "string",
              description: "Meta de hidratação diária"
            }
          },
          required: ["daily_calories", "macros", "recommendations", "recommended_foods", "foods_to_avoid", "meal_timing", "tips", "hydration_goal"]
        }
      });

      // Sobrescrever com os valores calculados
      response.daily_calories = calorieGoal;
      response.macros.protein_percentage = proteinPercentage;
      response.macros.carbs_percentage = carbsPercentage;
      response.macros.fat_percentage = fatPercentage;

      // Validar que temos todas as refeições
      if (!response.meal_timing || response.meal_timing.length !== formData.meals_per_day) {
        throw new Error(`Erro: gerou ${response.meal_timing?.length || 0} refeições, mas deveria gerar ${formData.meals_per_day}`);
      }

      console.log("Plano nutricional gerado:", response);
      setGeneratedPlan(response);
      setStep(4);
    } catch (error) {
      console.error("Error generating plan:", error);
      alert(`Erro ao gerar plano: ${error.message}. Tente novamente.`);
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await base44.auth.updateMe({
        ...formData,
        daily_calorie_goal: generatedPlan.daily_calories,
        macro_protein_percentage: generatedPlan.macros.protein_percentage,
        macro_carbs_percentage: generatedPlan.macros.carbs_percentage,
        macro_fat_percentage: generatedPlan.macros.fat_percentage,
        selected_nutrition_plan_data: generatedPlan,
        nutrition_setup_completed: true,
      });
      navigate(createPageUrl("WorkoutSetup"));
    } catch (error) {
      console.error("Error saving:", error);
      alert("Erro ao salvar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-all ${
                  s <= step ? "bg-green-600" : "bg-slate-800"
                }`}
              />
            ))}
          </div>
          <p className="text-slate-400 text-sm text-center mt-3">
            Passo {step} de 4 - Setup Nutricional
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Dietary Preferences */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ChefHat className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-white text-2xl text-center">
                    Configuração Nutricional
                  </CardTitle>
                  <p className="text-slate-400 text-center">
                    Vamos criar seu plano alimentar personalizado
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-slate-300 text-base font-semibold mb-3 block">
                      🥗 Preferências Dietéticas
                    </Label>
                    <p className="text-slate-400 text-sm mb-4">
                      Selecione suas restrições alimentares (opcional)
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {dietaryOptions.map((option) => {
                        const isSelected = formData.dietary_preferences.includes(option.value);
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => togglePreference(option.value)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              isSelected
                                ? "border-green-600 bg-green-600/20"
                                : "border-slate-800 bg-slate-800/50 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{option.emoji}</span>
                              <span className="text-white text-sm">{option.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-300 text-base font-semibold mb-3 block">
                      🍴 Refeições por Dia
                    </Label>
                    <div className="grid grid-cols-5 gap-2">
                      {[3, 4, 5, 6, 7].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setFormData({ ...formData, meals_per_day: num })}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            formData.meals_per_day === num
                              ? "border-green-600 bg-green-600/20"
                              : "border-slate-800 bg-slate-800/50"
                          }`}
                        >
                          <p className="text-white text-xl font-bold text-center">{num}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() => setStep(2)}
                    className="w-full bg-green-600 hover:bg-green-700 py-6"
                  >
                    Continuar
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Allergies */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white text-2xl text-center">
                    Alergias e Intolerâncias
                  </CardTitle>
                  <p className="text-slate-400 text-center">
                    Liste alimentos que você não pode consumir
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-2">
                    <Input
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                      placeholder="Ex: amendoim, lactose, frutos do mar..."
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                    <Button onClick={addAllergy} className="bg-red-600 hover:bg-red-700">
                      Adicionar
                    </Button>
                  </div>

                  {formData.food_allergies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.food_allergies.map((allergy, idx) => (
                        <Badge key={idx} className="bg-red-600/20 text-red-400 border border-red-600/30 pr-1">
                          {allergy}
                          <button
                            onClick={() => removeAllergy(idx)}
                            className="ml-2 hover:bg-red-600/40 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {formData.food_allergies.length === 0 && (
                    <p className="text-slate-500 text-center text-sm py-8">
                      Nenhuma alergia adicionada. Você pode pular esta etapa.
                    </p>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 border-slate-700"
                    >
                      Voltar
                    </Button>
                    <Button
                      onClick={() => setStep(3)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Continuar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Dislikes */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white text-2xl text-center">
                    Alimentos que Não Gosta
                  </CardTitle>
                  <p className="text-slate-400 text-center">
                    Liste alimentos que prefere evitar nas receitas
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-2">
                    <Input
                      value={newDislike}
                      onChange={(e) => setNewDislike(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addDislike()}
                      placeholder="Ex: coentro, azeitona, beterraba..."
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                    <Button onClick={addDislike} className="bg-orange-600 hover:bg-orange-700">
                      Adicionar
                    </Button>
                  </div>

                  {formData.disliked_foods.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.disliked_foods.map((food, idx) => (
                        <Badge key={idx} className="bg-orange-600/20 text-orange-400 border border-orange-600/30 pr-1">
                          {food}
                          <button
                            onClick={() => removeDislike(idx)}
                            className="ml-2 hover:bg-orange-600/40 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {formData.disliked_foods.length === 0 && (
                    <p className="text-slate-500 text-center text-sm py-8">
                      Nenhum alimento adicionado. Você pode pular esta etapa.
                    </p>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="flex-1 border-slate-700"
                    >
                      Voltar
                    </Button>
                    <Button
                      onClick={generateNutritionPlan}
                      disabled={generatingPlan}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {generatingPlan ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gerando Plano...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Gerar Plano com IA
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Generated Plan */}
          {step === 4 && generatedPlan && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 border-green-700/50">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-10 h-10 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    ✅ Seu Plano Foi Criado!
                  </h2>
                  <p className="text-slate-300">
                    Analisamos seu perfil e criamos um plano nutricional personalizado
                  </p>
                </CardContent>
              </Card>

              {/* Calorie Goal */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">🎯 Meta Diária</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <p className="text-5xl font-bold text-green-400">{Math.round(generatedPlan.daily_calories)}</p>
                    <p className="text-slate-400">calorias por dia</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-blue-900/20 rounded-lg">
                      <p className="text-blue-400 font-bold text-xl">{generatedPlan.macros.protein_percentage}%</p>
                      <p className="text-slate-400 text-xs">Proteínas</p>
                      <p className="text-slate-500 text-xs">
                        {Math.round(generatedPlan.daily_calories * (generatedPlan.macros.protein_percentage / 100) / 4)}g
                      </p>
                    </div>
                    <div className="p-3 bg-orange-900/20 rounded-lg">
                      <p className="text-orange-400 font-bold text-xl">{generatedPlan.macros.carbs_percentage}%</p>
                      <p className="text-slate-400 text-xs">Carboidratos</p>
                      <p className="text-slate-500 text-xs">
                        {Math.round(generatedPlan.daily_calories * (generatedPlan.macros.carbs_percentage / 100) / 4)}g
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-900/20 rounded-lg">
                      <p className="text-yellow-400 font-bold text-xl">{generatedPlan.macros.fat_percentage}%</p>
                      <p className="text-slate-400 text-xs">Gorduras</p>
                      <p className="text-slate-500 text-xs">
                        {Math.round(generatedPlan.daily_calories * (generatedPlan.macros.fat_percentage / 100) / 9)}g
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white text-sm">💡 Recomendações Personalizadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {generatedPlan.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                        <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Meal Timing */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white text-sm">🍽️ Exemplo de Dia Alimentar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {generatedPlan.meal_timing.map((meal, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex-shrink-0">
                          <p className="text-green-400 font-bold">{meal.time}</p>
                          <p className="text-slate-500 text-xs">{meal.meal_type}</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-slate-300 text-sm">{meal.suggestion}</p>
                          <p className="text-blue-400 text-xs mt-1">{meal.calories} kcal</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Hydration */}
              <Card className="bg-blue-900/20 border-blue-800/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="text-3xl">💧</span>
                  <div>
                    <p className="text-blue-400 font-semibold text-sm">Hidratação</p>
                    <p className="text-slate-300 text-sm">{generatedPlan.hydration_goal}</p>
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={handleComplete}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Continuar para Configuração de Treino
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
