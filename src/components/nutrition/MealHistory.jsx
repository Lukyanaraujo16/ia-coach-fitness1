
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coffee, Sun, Cookie, Moon, Zap, ChevronDown, ChevronUp } from "lucide-react";
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
        
        // Usar data local para formatação
        const dateObj = new Date(date + 'T12:00:00'); // Adicionar meio-dia para evitar problema de fuso
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
                  <p className="text-white font-semibold capitalize">{formattedDate}</p>
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

                  return (
                    <div
                      key={meal.id}
                      className="bg-slate-800/50 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedMeal(isExpanded ? null : meal.id)}
                        className="w-full p-3 flex items-center justify-between hover:bg-slate-800/70 transition-all"
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
                                <p className="text-slate-400 text-xs mb-2">Alimentos:</p>
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
