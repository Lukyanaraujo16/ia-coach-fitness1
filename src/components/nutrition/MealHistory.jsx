
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coffee, Sun, Cookie, Moon, Zap, ChevronDown, ChevronUp, Edit2, Plus, Save, X, Loader2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const mealIcons = {
  breakfast: Coffee,
  lunch: Sun,
  snack: Cookie,
  dinner: Moon,
  post_workout: Zap,
};

const mealLabels = {
  breakfast: "Café da Manhã",
  lunch: "Almoço",
  snack: "Lanche",
  dinner: "Jantar",
  post_workout: "Pós-Treino",
};

export default function MealHistory({ mealLogs = [] }) {
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [editingMeal, setEditingMeal] = useState(null);
  const [newFoodName, setNewFoodName] = useState("");
  const [newFoodQuantity, setNewFoodQuantity] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const queryClient = useQueryClient();

  const updateMealMutation = useMutation({
    mutationFn: ({ mealId, data }) => base44.entities.MealLog.update(mealId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['meal-logs']);
      setEditingMeal(null);
      setNewFoodName("");
      setNewFoodQuantity("");
    },
  });

  const deleteMealMutation = useMutation({
    mutationFn: (mealId) => base44.entities.MealLog.delete(mealId),
    onSuccess: () => {
      queryClient.invalidateQueries(['meal-logs']);
    },
  });

  // Obter data de hoje no formato local
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDate = getTodayDate();

  // Verificar se uma refeição é de hoje
  const isTodayMeal = (mealDate) => {
    return mealDate === todayDate;
  };

  const handleAddFoodItem = async (meal) => {
    if (!newFoodName.trim() || !newFoodQuantity.trim()) {
      alert("Preencha o nome e a quantidade do alimento");
      return;
    }

    setIsAnalyzing(true);

    try {
      // Usar IA para estimar as calorias e macros do novo item
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `
Analise o seguinte alimento e forneça informações nutricionais:
- Alimento: ${newFoodName}
- Quantidade: ${newFoodQuantity}

Calcule:
- Calorias
- Proteínas (g)
- Carboidratos (g)
- Gorduras (g)

Seja preciso com base na quantidade informada.
`,
        response_json_schema: {
          type: "object",
          properties: {
            calories: { type: "number" },
            protein: { type: "number" },
            carbs: { type: "number" },
            fat: { type: "number" }
          }
        }
      });

      // Criar novo item
      const newItem = {
        name: newFoodName,
        quantity: newFoodQuantity,
        calories: analysis.calories
      };

      // Atualizar lista de alimentos
      const updatedFoodItems = [...meal.food_items, newItem];

      // Recalcular totais
      const newTotalCalories = meal.total_calories + analysis.calories;
      const newMacros = {
        protein: meal.macros.protein + analysis.protein,
        carbs: meal.macros.carbs + analysis.carbs,
        fat: meal.macros.fat + analysis.fat,
        fiber: meal.macros.fiber // Mantém o mesmo
      };

      // Atualizar no banco
      updateMealMutation.mutate({
        mealId: meal.id,
        data: {
          food_items: updatedFoodItems,
          total_calories: newTotalCalories,
          macros: newMacros
        }
      });

    } catch (error) {
      console.error("Erro ao adicionar alimento:", error);
      alert("Erro ao adicionar alimento. Tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteMeal = (mealId, mealType) => {
    if (confirm(`Tem certeza que deseja excluir esta refeição (${mealLabels[mealType]})?`)) {
      deleteMealMutation.mutate(mealId);
    }
  };

  // Agrupar por data
  const groupedByDate = mealLogs.reduce((acc, log) => {
    if (!log.analysis_complete) return acc;
    
    const date = log.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(log);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  if (sortedDates.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-12 text-center">
          <Cookie className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">Nenhuma refeição registrada ainda</p>
          <p className="text-slate-500 text-sm">
            Tire uma foto da sua refeição na aba "Foto" para começar!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sortedDates.map((date) => {
        const meals = groupedByDate[date];
        const totalCalories = meals.reduce((sum, m) => sum + (m.total_calories || 0), 0);
        const isToday = isTodayMeal(date);
        
        const dateObj = new Date(date + 'T12:00:00');
        const formattedDate = dateObj.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
        });

        return (
          <Card key={date} className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold capitalize">{formattedDate}</p>
                    {isToday && (
                      <Badge className="bg-green-600/20 text-green-400 text-xs">
                        Hoje
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm">{meals.length} refeições</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-400">{totalCalories}</p>
                  <p className="text-slate-500 text-xs">kcal total</p>
                </div>
              </div>

              <div className="space-y-3">
                {meals.map((meal) => {
                  const Icon = mealIcons[meal.meal_type] || Cookie;
                  const isExpanded = expandedMeal === meal.id;
                  const isEditing = editingMeal === meal.id;

                  return (
                    <div
                      key={meal.id}
                      className="bg-slate-800/50 rounded-lg overflow-hidden"
                    >
                      <div className="flex items-center">
                        <button
                          onClick={() => setExpandedMeal(isExpanded ? null : meal.id)}
                          className="flex-1 p-3 flex items-center justify-between hover:bg-slate-800/70 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                              <Icon className="w-5 h-5 text-green-400" />
                            </div>
                            <div className="text-left">
                              <p className="text-white font-medium">
                                {mealLabels[meal.meal_type]}
                              </p>
                              <p className="text-slate-400 text-sm">
                                {meal.food_items?.length || 0} itens
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-green-400 font-bold">
                              {meal.total_calories} kcal
                            </p>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteMeal(meal.id, meal.meal_type)}
                          disabled={deleteMealMutation.isPending}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/50 mr-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-700"
                          >
                            <div className="p-3 space-y-3">
                              {/* Photo */}
                              {meal.photo_url && (
                                <img
                                  src={meal.photo_url}
                                  alt="Refeição"
                                  className="w-full h-48 object-cover rounded-lg"
                                />
                              )}

                              {/* Macros */}
                              <div className="grid grid-cols-4 gap-2">
                                <div className="text-center p-2 bg-slate-900/50 rounded">
                                  <p className="text-blue-400 font-bold">
                                    {Math.round(meal.macros?.protein || 0)}g
                                  </p>
                                  <p className="text-slate-500 text-xs">Prot.</p>
                                </div>
                                <div className="text-center p-2 bg-slate-900/50 rounded">
                                  <p className="text-orange-400 font-bold">
                                    {Math.round(meal.macros?.carbs || 0)}g
                                  </p>
                                  <p className="text-slate-500 text-xs">Carbs</p>
                                </div>
                                <div className="text-center p-2 bg-slate-900/50 rounded">
                                  <p className="text-yellow-400 font-bold">
                                    {Math.round(meal.macros?.fat || 0)}g
                                  </p>
                                  <p className="text-slate-500 text-xs">Gord.</p>
                                </div>
                                <div className="text-center p-2 bg-slate-900/50 rounded">
                                  <p className="text-green-400 font-bold">
                                    {Math.round(meal.macros?.fiber || 0)}g
                                  </p>
                                  <p className="text-slate-500 text-xs">Fibra</p>
                                </div>
                              </div>

                              {/* Food Items */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-slate-400 text-xs">Alimentos:</p>
                                  {isToday && !isEditing && (
                                    <Button
                                      size="sm"
                                      onClick={() => setEditingMeal(meal.id)}
                                      className="bg-blue-600/20 border border-blue-600/30 text-blue-400 hover:bg-blue-600/30 h-7 text-xs"
                                    >
                                      <Edit2 className="w-3 h-3 mr-1" />
                                      Editar
                                    </Button>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  {meal.food_items?.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between text-sm"
                                    >
                                      <span className="text-slate-300">
                                        {item.name} ({item.quantity})
                                      </span>
                                      <span className="text-slate-500">
                                        {item.calories} kcal
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Edit Form */}
                              {isEditing && isToday && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="p-3 bg-blue-900/20 border border-blue-800/50 rounded-lg space-y-3"
                                >
                                  <p className="text-blue-400 text-sm font-semibold">
                                    ➕ Adicionar Item
                                  </p>
                                  <div className="space-y-2">
                                    <div>
                                      <Label className="text-slate-300 text-xs">Nome do Alimento</Label>
                                      <Input
                                        value={newFoodName}
                                        onChange={(e) => setNewFoodName(e.target.value)}
                                        placeholder="Ex: Ovo cozido"
                                        className="bg-slate-800 border-slate-700 text-white h-10"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-slate-300 text-xs">Quantidade</Label>
                                      <Input
                                        value={newFoodQuantity}
                                        onChange={(e) => setNewFoodQuantity(e.target.value)}
                                        placeholder="Ex: 2 unidades"
                                        className="bg-slate-800 border-slate-700 text-white h-10"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setEditingMeal(null);
                                        setNewFoodName("");
                                        setNewFoodQuantity("");
                                      }}
                                      className="flex-1 bg-slate-800 border-slate-600 text-slate-200 h-10"
                                    >
                                      <X className="w-4 h-4 mr-1" />
                                      Cancelar
                                    </Button>
                                    <Button
                                      onClick={() => handleAddFoodItem(meal)}
                                      disabled={isAnalyzing || updateMealMutation.isPending}
                                      className="flex-1 bg-blue-600 hover:bg-blue-700 h-10"
                                    >
                                      {isAnalyzing || updateMealMutation.isPending ? (
                                        <>
                                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                          Analisando...
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="w-4 h-4 mr-1" />
                                          Adicionar
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </motion.div>
                              )}

                              {/* Notes */}
                              {meal.notes && (
                                <div className="p-2 bg-slate-900/50 rounded">
                                  <p className="text-slate-400 text-xs">Observações:</p>
                                  <p className="text-slate-300 text-sm">{meal.notes}</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
