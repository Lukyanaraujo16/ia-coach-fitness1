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

  // Calcular calorias de hoje
  const today = new Date().toISOString().split('T')[0];
  const todayMeals = mealLogs.filter(log => log.date === today && log.analysis_complete);
  const todayCalories = todayMeals.reduce((sum, log) => sum + (log.total_calories || 0), 0);
  const todayProtein = todayMeals.reduce((sum, log) => sum + (log.macros?.protein || 0), 0);
  const todayCarbs = todayMeals.reduce((sum, log) => sum + (log.macros?.carbs || 0), 0);
  const todayFat = todayMeals.reduce((sum, log) => sum + (log.macros?.fat || 0), 0);

  // Meta diária (pode vir do plano ou default)
  const calorieGoal = user?.daily_calorie_goal || 2000;

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

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                <p className="text-blue-400 text-2xl font-bold">{Math.round(todayProtein)}g</p>
                <p className="text-slate-400 text-xs mt-1">Proteína</p>
              </div>
              <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                <p className="text-orange-400 text-2xl font-bold">{Math.round(todayCarbs)}g</p>
                <p className="text-slate-400 text-xs mt-1">Carbos</p>
              </div>
              <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                <p className="text-yellow-400 text-2xl font-bold">{Math.round(todayFat)}g</p>
                <p className="text-slate-400 text-xs mt-1">Gorduras</p>
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