
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, TrendingUp, Book, Target } from "lucide-react";
import CalorieCounter from "../components/nutrition/CalorieCounter";
import NutritionStats from "../components/nutrition/NutritionStats";
import MealHistory from "../components/nutrition/MealHistory";
import NutritionPlans from "../components/nutrition/NutritionPlans";

export default function Nutrition() {
  const [activeTab, setActiveTab] = useState("counter");
  const [user, setUser] = useState(null);

  const { data: mealLogs = [] } = useQuery({
    queryKey: ['meal-logs'],
    queryFn: () => base44.entities.MealLog.list('-date'),
  });

  const { data: nutritionPlans = [] } = useQuery({
    queryKey: ['nutrition-plans'],
    queryFn: () => base44.entities.NutritionPlan.list(),
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  // Calcular calorias e macros de hoje
  const today = new Date().toISOString().split('T')[0];
  const todayMeals = mealLogs.filter(log => log.date === today && log.analysis_complete);
  const todayCalories = todayMeals.reduce((sum, log) => sum + (log.total_calories || 0), 0);
  const todayProtein = todayMeals.reduce((sum, log) => sum + (log.macros?.protein || 0), 0);
  const todayCarbs = todayMeals.reduce((sum, log) => sum + (log.macros?.carbs || 0), 0);
  const todayFat = todayMeals.reduce((sum, log) => sum + (log.macros?.fat || 0), 0);

  // Meta diária (pode vir do usuário ou default)
  const calorieGoal = user?.daily_calorie_goal || 2000;
  
  // Calcular metas de macros em gramas (baseado na meta de calorias)
  // Approximate macro calories: Protein 4 kcal/g, Carbs 4 kcal/g, Fat 9 kcal/g
  const proteinGoal = Math.round((calorieGoal * 0.30) / 4); // 30% das calorias / 4 kcal por grama
  const carbsGoal = Math.round((calorieGoal * 0.40) / 4); // 40% das calorias / 4 kcal por grama
  const fatGoal = Math.round((calorieGoal * 0.30) / 9); // 30% das calorias / 9 kcal por grama

  return (
    <div className="py-6 space-y-6">
      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-white">Nutrição</h2>
        <p className="text-slate-400">
          Acompanhe suas refeições e atinja suas metas
        </p>
      </div>

      {/* Today's Summary */}
      <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 border-green-800/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-green-400" />
            Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Calorias */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm">Calorias</span>
                <span className="text-white font-bold">
                  {todayCalories} / {calorieGoal} kcal
                </span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-600 to-green-500 transition-all duration-500"
                  style={{ width: `${Math.min((todayCalories / calorieGoal) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Proteínas */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm">Proteínas</span>
                <span className="text-blue-400 font-bold">
                  {Math.round(todayProtein)}g / {proteinGoal}g
                </span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-500"
                  style={{ width: `${Math.min((todayProtein / proteinGoal) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Carboidratos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm">Carboidratos</span>
                <span className="text-orange-400 font-bold">
                  {Math.round(todayCarbs)}g / {carbsGoal}g
                </span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-600 to-orange-500 transition-all duration-500"
                  style={{ width: `${Math.min((todayCarbs / carbsGoal) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Gorduras */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm">Gorduras</span>
                <span className="text-yellow-400 font-bold">
                  {Math.round(todayFat)}g / {fatGoal}g
                </span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-600 to-yellow-500 transition-all duration-500"
                  style={{ width: `${Math.min((todayFat / fatGoal) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800 w-full grid grid-cols-4">
          <TabsTrigger value="counter" className="data-[state=active]:bg-green-600">
            <Camera className="w-4 h-4 mr-2" />
            Foto
          </TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-green-600">
            <TrendingUp className="w-4 h-4 mr-2" />
            Stats
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-green-600">
            <Book className="w-4 h-4 mr-2" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="plans" className="data-[state=active]:bg-green-600">
            <Target className="w-4 h-4 mr-2" />
            Planos
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      {activeTab === "counter" && <CalorieCounter />}
      {activeTab === "stats" && <NutritionStats mealLogs={mealLogs} calorieGoal={calorieGoal} />}
      {activeTab === "history" && <MealHistory mealLogs={mealLogs} />}
      {activeTab === "plans" && <NutritionPlans plans={nutritionPlans} user={user} />}
    </div>
  );
}
