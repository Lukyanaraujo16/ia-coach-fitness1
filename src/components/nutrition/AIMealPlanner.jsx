
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, ChefHat, Calendar, Plus, Settings, CheckCircle2, Clock, Flame, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DietaryPreferencesModal from "./DietaryPreferencesModal";

const mealTypeLabels = {
  breakfast: "Café da Manhã",
  lunch: "Almoço",
  snack: "Lanche",
  dinner: "Jantar",
  post_workout: "Pós-Treino",
};

const mealTypeIcons = {
  breakfast: "☀️",
  lunch: "🍽️",
  snack: "🥤",
  dinner: "🌙",
  post_workout: "💪",
};

export default function AIMealPlanner({ user }) {
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const queryClient = useQueryClient();

  // Carregar plano salvo do usuário quando componente montar
  useEffect(() => {
    if (user?.selected_nutrition_plan_data) {
      try {
        const plan = user.selected_nutrition_plan_data;
        
        // Verificar se é o formato do setup (meal_timing) ou o formato completo (daily_meals)
        if (plan && typeof plan === 'object') {
          // Se tem meal_timing, converter para o formato esperado
          if (plan.meal_timing && !plan.daily_meals) {
            console.log("Detectado plano do setup inicial, convertendo formato...");

            // Ensure macros are available from user or default to avoid errors
            const proteinPercentage = user?.macro_protein_percentage || 30;
            const carbsPercentage = user?.macro_carbs_percentage || 40;
            const fatPercentage = user?.macro_fat_percentage || 30;

            const convertedPlan = {
              plan_summary: `Plano nutricional personalizado: ${plan.daily_calories} kcal/dia com ${proteinPercentage}% proteínas, ${carbsPercentage}% carboidratos e ${fatPercentage}% gorduras.`,
              daily_meals: [
                {
                  day: 1,
                  day_name: "Seu Dia Padrão",
                  total_calories: plan.daily_calories,
                  meals: plan.meal_timing.map(meal => ({
                    meal_type: meal.meal_type,
                    time: meal.time,
                    recipe_name: meal.suggestion,
                    ingredients: [{ name: meal.suggestion, quantity: "Veja descrição" }],
                    preparation: ["Preparar conforme sugestão acima. Este é um plano básico do seu setup inicial. Gere um plano completo para receitas detalhadas."],
                    prep_time_minutes: 15,
                    calories: meal.calories,
                    macros: {
                      protein: Math.round((meal.calories * (proteinPercentage / 100)) / 4),
                      carbs: Math.round((meal.calories * (carbsPercentage / 100)) / 4),
                      fat: Math.round((meal.calories * (fatPercentage / 100)) / 9)
                    },
                    tip: plan.recommendations?.[0] || "Mantenha-se hidratado."
                  }))
                }
              ],
              weekly_tips: plan.tips || [],
              is_from_setup: true // Flag para indicar que é do setup
            };
            setMealPlan(convertedPlan);
            setLoadError(null);
          } 
          // Se tem daily_meals, usar direto
          else if (plan.daily_meals && Array.isArray(plan.daily_meals)) {
            setMealPlan(plan);
            setLoadError(null);
          } 
          // Formato inválido
          else {
            console.error("Plano nutricional com estrutura inválida:", plan);
            setLoadError("Plano nutricional com formato inválido");
            setMealPlan(null);
          }
        } else {
          setLoadError("Plano nutricional vazio");
          setMealPlan(null);
        }
      } catch (error) {
        console.error("Erro ao carregar plano nutricional:", error);
        setLoadError("Erro ao carregar plano nutricional");
        setMealPlan(null);
      }
    }
  }, [user]);

  const addToLogMutation = useMutation({
    mutationFn: (mealData) => base44.entities.MealLog.create(mealData),
    onSuccess: () => {
      queryClient.invalidateQueries(['meal-logs']);
    },
  });

  const generateMealPlan = async () => {
    setLoading(true);
    try {
      const calorieGoal = user?.daily_calorie_goal || 2000;
      const proteinPercentage = user?.macro_protein_percentage || 30;
      const carbsPercentage = user?.macro_carbs_percentage || 40;
      const fatPercentage = user?.macro_fat_percentage || 30;
      const mealsPerDay = user?.meals_per_day || 3;
      
      const proteinGrams = Math.round((calorieGoal * (proteinPercentage / 100)) / 4);
      const carbsGrams = Math.round((calorieGoal * (carbsPercentage / 100)) / 4);
      const fatGrams = Math.round((calorieGoal * (fatPercentage / 100)) / 9);

      const dietaryInfo = [];
      if (user?.dietary_preferences?.length > 0) {
        dietaryInfo.push(`Preferências: ${user.dietary_preferences.join(', ')}`);
      }
      if (user?.food_allergies?.length > 0) {
        dietaryInfo.push(`Alergias: ${user.food_allergies.join(', ')}`);
      }
      if (user?.disliked_foods?.length > 0) {
        dietaryInfo.push(`Não gosta de: ${user.disliked_foods.join(', ')}`);
      }

      const prompt = `Você é um nutricionista experiente criando um plano alimentar COMPLETO E DETALHADO para uma semana.

INFORMAÇÕES DO CLIENTE:
- Objetivo: ${user?.fitness_goal === 'lose_weight' ? 'Emagrecimento' : user?.fitness_goal === 'gain_muscle' ? 'Ganho de massa muscular' : 'Manutenção'}
- Meta diária: ${calorieGoal} kcal
- Proteínas: ${proteinGrams}g (${proteinPercentage}%)
- Carboidratos: ${carbsGrams}g (${carbsPercentage}%)
- Gorduras: ${fatGrams}g (${fatPercentage}%)
- Refeições por dia: ${mealsPerDay}
- Peso atual: ${user?.current_weight}kg
- Meta de peso: ${user?.weight_goal}kg
- Nível de atividade: ${user?.fitness_level === 'advanced' ? 'Alto' : user?.fitness_level === 'intermediate' ? 'Moderado' : 'Leve'}
${dietaryInfo.length > 0 ? '\nRESTRIÇÕES E PREFERÊNCIAS:\n' + dietaryInfo.join('\n') : ''}

Crie um plano de 7 dias com receitas COMPLETAS e DETALHADAS. Para cada refeição inclua:
1. Nome atrativo e descritivo
2. Lista DETALHADA de ingredientes com quantidades EXATAS
3. Modo de preparo passo a passo COMPLETO
4. Tempo de preparo realista
5. Calorias e macros PRECISOS
6. Dica nutricional relevante

IMPORTANTE:
- Seja ESPECÍFICO nas quantidades (use gramas, ml, unidades)
- Receitas devem ser PRÁTICAS e REALIZÁVEIS
- Varie os alimentos entre os dias
- Balance sabor e nutrição
- Considere TODAS as restrições alimentares mencionadas
- Distribua as calorias adequadamente entre as refeições
- Use ingredientes BRASILEIROS e acessíveis`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            plan_summary: {
              type: "string",
              description: "Resumo do plano alimentar"
            },
            daily_meals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: {
                    type: "number",
                    description: "Dia da semana (1-7)"
                  },
                  day_name: {
                    type: "string",
                    description: "Nome do dia"
                  },
                  total_calories: {
                    type: "number"
                  },
                  meals: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        meal_type: {
                          type: "string",
                          enum: ["breakfast", "lunch", "snack", "dinner", "post_workout"]
                        },
                        time: {
                          type: "string",
                          description: "Horário sugerido"
                        },
                        recipe_name: {
                          type: "string",
                          description: "Nome da receita"
                        },
                        ingredients: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              quantity: { type: "string" }
                            }
                          },
                          description: "Lista de ingredientes com quantidades"
                        },
                        preparation: {
                          type: "array",
                          items: { type: "string" },
                          description: "Passos de preparo"
                        },
                        prep_time_minutes: {
                          type: "number"
                        },
                        calories: {
                          type: "number"
                        },
                        macros: {
                          type: "object",
                          properties: {
                            protein: { type: "number" },
                            carbs: { type: "number" },
                            fat: { type: "number" }
                          }
                        },
                        tip: {
                          type: "string",
                          description: "Dica nutricional"
                        }
                      }
                    }
                  }
                }
              },
              description: "Refeições organizadas por dia"
            },
            weekly_tips: {
              type: "array",
              items: { type: "string" },
              description: "Dicas gerais para a semana"
            }
          }
        }
      });

      setMealPlan(response);
      setLoadError(null); // Clear any previous load errors
      
      // Salvar o novo plano no perfil do usuário
      await base44.auth.updateMe({
        selected_nutrition_plan_data: response
      });
      
      queryClient.invalidateQueries(['user']);
    } catch (error) {
      console.error("Error generating meal plan:", error);
      alert("Erro ao gerar plano alimentar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToLog = async (day, meal) => {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const dayStr = String(today.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayStr}`;

      const foodItems = meal.ingredients.map(ing => ({
        name: ing.name,
        quantity: ing.quantity,
        calories: Math.round(meal.calories / meal.ingredients.length) // Estimativa
      }));

      await addToLogMutation.mutateAsync({
        date: dateStr,
        meal_type: meal.meal_type,
        food_items: foodItems,
        total_calories: meal.calories,
        macros: meal.macros,
        notes: `Receita: ${meal.recipe_name}`,
        analysis_complete: true,
      });

      alert(`✅ ${meal.recipe_name} adicionada ao seu registro!`);
    } catch (error) {
      console.error("Error adding to log:", error);
      alert("Erro ao adicionar ao registro. Tente novamente.");
    }
  };

  const handleClearPlan = async () => {
    if (confirm('Tem certeza que deseja remover o plano atual? Você poderá gerar um novo depois.')) {
      try {
        await base44.auth.updateMe({
          selected_nutrition_plan_data: null
        });
        setMealPlan(null);
        setLoadError(null);
        queryClient.invalidateQueries(['user']);
      } catch (error) {
        console.error("Erro ao limpar plano:", error);
        alert("Erro ao limpar plano. Tente novamente.");
      }
    }
  };

  const hasPreferences = user?.dietary_preferences?.length > 0 || 
                        user?.food_allergies?.length > 0 || 
                        user?.meals_per_day;

  // Se há erro ao carregar o plano
  if (loadError) {
    return (
      <div className="space-y-4">
        <Card className="bg-red-900/20 border-red-800/50">
          <CardContent className="p-8 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                Erro ao Carregar Plano
              </h3>
              <p className="text-slate-300 text-sm mb-4">
                {loadError}. O plano salvo pode estar corrompido ou em formato antigo.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleClearPlan}
                className="bg-red-600 hover:bg-red-700"
              >
                Remover Plano Corrompido e Gerar Novo
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-slate-700 text-slate-300"
              >
                Tentar Recarregar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!mealPlan) {
    return (
      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 border-purple-700/50">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
              <ChefHat className="w-10 h-10 text-white" />
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Planejador de Refeições com IA
              </h3>
              <p className="text-slate-300 max-w-md mx-auto">
                Gere um plano alimentar personalizado para toda a semana com receitas detalhadas baseadas nos seus objetivos e preferências! 🍽️✨
              </p>
            </div>

            {hasPreferences && (
              <Card className="bg-slate-800/50 border-slate-700 max-w-md mx-auto">
                <CardContent className="p-4 space-y-2 text-sm text-left">
                  <p className="text-slate-400 font-semibold">Suas Preferências:</p>
                  {user?.dietary_preferences?.length > 0 && (
                    <p className="text-slate-300">
                      🥗 {user.dietary_preferences.join(', ')}
                    </p>
                  )}
                  {user?.food_allergies?.length > 0 && (
                    <p className="text-red-400">
                      ⚠️ Alergias: {user.food_allergies.join(', ')}
                    </p>
                  )}
                  {user?.meals_per_day && (
                    <p className="text-slate-300">
                      🍴 {user.meals_per_day} refeições/dia
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => setShowPreferencesModal(true)}
                variant="outline"
                className="border-purple-700 text-purple-400 hover:bg-purple-900/30"
              >
                <Settings className="w-4 h-4 mr-2" />
                {hasPreferences ? 'Editar Preferências' : 'Configurar Preferências'}
              </Button>

              <Button
                onClick={generateMealPlan}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-6 text-lg shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Gerando Plano Personalizado...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Gerar Plano Semanal com IA
                  </>
                )}
              </Button>
            </div>

            <p className="text-slate-500 text-xs">
              ⏱️ Geração leva cerca de 30-60 segundos
            </p>
          </CardContent>
        </Card>

        {showPreferencesModal && (
          <DietaryPreferencesModal
            user={user}
            onClose={() => setShowPreferencesModal(false)}
            onSave={() => {
              setShowPreferencesModal(false);
              window.location.reload();
            }}
          />
        )}
      </div>
    );
  }

  // Validar que o plano tem os dados necessários
  if (!mealPlan.daily_meals || !Array.isArray(mealPlan.daily_meals)) {
    return (
      <div className="space-y-4">
        <Card className="bg-red-900/20 border-red-800/50">
          <CardContent className="p-8 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                Plano Incompleto
              </h3>
              <p className="text-slate-300 text-sm mb-4">
                O plano salvo não contém as refeições necessárias.
              </p>
            </div>
            <Button
              onClick={handleClearPlan}
              className="bg-red-600 hover:bg-red-700"
            >
              Gerar Novo Plano
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Summary */}
      <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 border-purple-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Seu Plano Alimentar Personalizado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mealPlan.plan_summary && (
            <p className="text-slate-300 leading-relaxed">
              {mealPlan.plan_summary}
            </p>
          )}
          
          {/* Aviso se for do setup */}
          {mealPlan.is_from_setup && (
            <div className="p-3 bg-blue-900/20 border border-blue-800/50 rounded-lg">
              <p className="text-blue-400 text-xs font-semibold mb-1">💡 Dica:</p>
              <p className="text-slate-300 text-sm">
                Este é o plano básico do seu setup inicial. Para um plano semanal completo com receitas detalhadas e variações para cada dia, clique em "Gerar Novo Plano"!
              </p>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setShowPreferencesModal(true)}
              size="sm"
              variant="outline"
              className="border-purple-700 text-purple-400"
            >
              <Settings className="w-4 h-4 mr-2" />
              Preferências
            </Button>
            <Button
              onClick={generateMealPlan}
              disabled={loading}
              size="sm"
              variant="outline"
              className="border-purple-700 text-purple-400"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Gerar Novo Plano
            </Button>
            <Button
              onClick={handleClearPlan}
              size="sm"
              variant="outline"
              className="border-red-700 text-red-400 hover:bg-red-900/30"
            >
              <Flame className="w-4 h-4 mr-2" />
              Limpar Plano
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Tips */}
      {mealPlan.weekly_tips && mealPlan.weekly_tips.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">💡 Dicas da Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {mealPlan.weekly_tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Daily Meal Plans */}
      <div className="space-y-4">
        {mealPlan.daily_meals.map((day, dayIdx) => {
          // Validar que o dia tem os dados necessários
          if (!day || !day.meals || !Array.isArray(day.meals)) {
            return null;
          }

          return (
            <Card key={dayIdx} className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      {day.day_name || `Dia ${day.day}`}
                    </CardTitle>
                    {day.total_calories && (
                      <p className="text-slate-400 text-sm mt-1">
                        {day.total_calories} kcal total
                      </p>
                    )}
                  </div>
                  <Badge className="bg-blue-600/20 text-blue-400">
                    Dia {day.day}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {day.meals.map((meal, mealIdx) => {
                  // Validar dados da refeição
                  if (!meal || !meal.meal_type || !meal.recipe_name) {
                    return null;
                  }

                  const isExpanded = expandedMeal === `${dayIdx}-${mealIdx}`;
                  
                  return (
                    <div
                      key={mealIdx}
                      className="bg-slate-800/50 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedMeal(isExpanded ? null : `${dayIdx}-${mealIdx}`)}
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-800/70 transition-all"
                      >
                        <div className="flex items-center gap-3 text-left flex-1">
                          <span className="text-2xl">{mealTypeIcons[meal.meal_type] || "🍽️"}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-semibold">{meal.recipe_name}</p>
                              {meal.time && (
                                <Badge variant="outline" className="text-xs border-slate-600">
                                  {meal.time}
                                </Badge>
                              )}
                            </div>
                            <p className="text-slate-400 text-sm">
                              {mealTypeLabels[meal.meal_type] || meal.meal_type} • {meal.calories || 0} kcal
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToLog(day, meal);
                            }}
                            disabled={addToLogMutation.isPending}
                            className="bg-green-600/20 border border-green-600/30 text-green-400 hover:bg-green-600/40"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-700"
                          >
                            <div className="p-4 space-y-4">
                              {/* Macros */}
                              {meal.macros && (
                                <div className="grid grid-cols-4 gap-2">
                                  <div className="text-center p-2 bg-slate-900/50 rounded">
                                    <p className="text-green-400 font-bold">{meal.calories || 0}</p>
                                    <p className="text-slate-500 text-xs">kcal</p>
                                  </div>
                                  <div className="text-center p-2 bg-slate-900/50 rounded">
                                    <p className="text-blue-400 font-bold">{Math.round(meal.macros.protein || 0)}g</p>
                                    <p className="text-slate-500 text-xs">Prot.</p>
                                  </div>
                                  <div className="text-center p-2 bg-slate-900/50 rounded">
                                    <p className="text-orange-400 font-bold">{Math.round(meal.macros.carbs || 0)}g</p>
                                    <p className="text-slate-500 text-xs">Carbs</p>
                                  </div>
                                  <div className="text-center p-2 bg-slate-900/50 rounded">
                                    <p className="text-yellow-400 font-bold">{Math.round(meal.macros.fat || 0)}g</p>
                                    <p className="text-slate-500 text-xs">Gord.</p>
                                  </div>
                                </div>
                              )}

                              {/* Prep Time */}
                              {meal.prep_time_minutes && (
                                <div className="flex items-center gap-2 text-slate-300 text-sm">
                                  <Clock className="w-4 h-4 text-slate-400" />
                                  <span>Tempo de preparo: {meal.prep_time_minutes} minutos</span>
                                </div>
                              )}

                              {/* Ingredients */}
                              {meal.ingredients && meal.ingredients.length > 0 && (
                                <div>
                                  <p className="text-slate-300 font-semibold mb-2 text-sm">📋 Ingredientes:</p>
                                  <ul className="space-y-1">
                                    {meal.ingredients.map((ing, idx) => (
                                      <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                                        <span className="text-green-400 mt-1">•</span>
                                        <span><strong>{ing.quantity}</strong> {ing.name}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Preparation */}
                              {meal.preparation && meal.preparation.length > 0 && (
                                <div>
                                  <p className="text-slate-300 font-semibold mb-2 text-sm">👨‍🍳 Modo de Preparo:</p>
                                  <ol className="space-y-2">
                                    {meal.preparation.map((step, idx) => (
                                      <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                                        <span className="w-5 h-5 bg-purple-600/20 rounded-full flex items-center justify-center text-purple-400 text-xs font-bold flex-shrink-0 mt-0.5">
                                          {idx + 1}
                                        </span>
                                        <span>{step}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              )}

                              {/* Tip */}
                              {meal.tip && (
                                <div className="p-3 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                                  <p className="text-blue-400 text-xs font-semibold mb-1">💡 Dica Nutricional:</p>
                                  <p className="text-slate-300 text-sm">{meal.tip}</p>
                                </div>
                              )}

                              {/* Add to Log Button */}
                              <Button
                                onClick={() => handleAddToLog(day, meal)}
                                disabled={addToLogMutation.isPending}
                                className="w-full bg-green-600 hover:bg-green-700"
                              >
                                {addToLogMutation.isPending ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Adicionando...
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Adicionar ao Meu Registro
                                  </>
                                )}
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showPreferencesModal && (
        <DietaryPreferencesModal
          user={user}
          onClose={() => setShowPreferencesModal(false)}
          onSave={() => {
            setShowPreferencesModal(false);
            setMealPlan(null); // Reset to trigger initial state logic or regenerate
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
