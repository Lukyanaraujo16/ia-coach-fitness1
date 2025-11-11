import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Target, TrendingUp } from "lucide-react";
import CalorieCounter from "../components/nutrition/CalorieCounter";
import NutritionStats from "../components/nutrition/NutritionStats";
import MealHistory from "../components/nutrition/MealHistory";
import NutritionPlans from "../components/nutrition/NutritionPlans";
import MyNutritionPlan from "../components/nutrition/MyNutritionPlan.jsx";

export default function Nutrition() {
  const [activeTab, setActiveTab] = useState("my-plan");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin(createPageUrl("Nutrition"));
      }
    };
    loadUser();
  }, []);

  const { data: mealLogs = [] } = useQuery({
    queryKey: ['meal-logs', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allLogs = await base44.entities.MealLog.list('-date');
      return allLogs.filter(log => log.created_by === user.email);
    },
    enabled: !!user?.email,
  });

  if (!user) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  // Calorie goal e macros do usuário
  const calorieGoal = user?.daily_calorie_goal || 2000;
  const proteinPercentage = user?.macro_protein_percentage || 40;
  const carbsPercentage = user?.macro_carbs_percentage || 40;
  const fatPercentage = user?.macro_fat_percentage || 20;

  // Calcular macros em gramas
  const proteinGrams = Math.round((calorieGoal * (proteinPercentage / 100)) / 4);
  const carbsGrams = Math.round((calorieGoal * (carbsPercentage / 100)) / 4);
  const fatGrams = Math.round((calorieGoal * (fatPercentage / 100)) / 9);

  // Obter data de hoje no formato local
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDate = getTodayDate();

  // Calcular totais de hoje
  const todayMeals = mealLogs.filter(log => log.date === todayDate && log.analysis_complete);
  const todayCalories = todayMeals.reduce((sum, log) => sum + (log.total_calories || 0), 0);
  const todayProtein = todayMeals.reduce((sum, log) => sum + (log.macros?.protein || 0), 0);
  const todayCarbs = todayMeals.reduce((sum, log) => sum + (log.macros?.carbs || 0), 0);
  const todayFat = todayMeals.reduce((sum, log) => sum + (log.macros?.fat || 0), 0);

  const caloriesRemaining = Math.max(0, calorieGoal - todayCalories);
  const caloriesPercentage = Math.min((todayCalories / calorieGoal) * 100, 100);

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Nutrição</h2>
      </div>

      {/* Daily Summary Card */}
      <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 border-green-800/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm">Calorias de Hoje</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-green-400">{Math.round(todayCalories)}</span>
                <span className="text-slate-400">/ {calorieGoal} kcal</span>
              </div>
            </div>
            <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center">
              <Flame className="w-10 h-10 text-green-400" />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden mb-4">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${caloriesPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-green-400" />
              <span className="text-slate-300">
                {caloriesRemaining > 0 ? `Faltam ${Math.round(caloriesRemaining)} kcal` : 'Meta atingida! 🎉'}
              </span>
            </div>
            <span className="text-slate-400">{Math.round(caloriesPercentage)}%</span>
          </div>

          {/* Macros Grid */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center p-3 bg-slate-900/50 rounded-lg">
              <p className="text-blue-400 text-lg font-bold">
                {Math.round(todayProtein)}g
              </p>
              <p className="text-slate-500 text-xs mt-1">Proteína</p>
              <p className="text-slate-600 text-xs">Meta: {proteinGrams}g</p>
            </div>
            <div className="text-center p-3 bg-slate-900/50 rounded-lg">
              <p className="text-orange-400 text-lg font-bold">
                {Math.round(todayCarbs)}g
              </p>
              <p className="text-slate-500 text-xs mt-1">Carbos</p>
              <p className="text-slate-600 text-xs">Meta: {carbsGrams}g</p>
            </div>
            <div className="text-center p-3 bg-slate-900/50 rounded-lg">
              <p className="text-yellow-400 text-lg font-bold">
                {Math.round(todayFat)}g
              </p>
              <p className="text-slate-500 text-xs mt-1">Gordura</p>
              <p className="text-slate-600 text-xs">Meta: {fatGrams}g</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800 grid grid-cols-5">
          <TabsTrigger value="my-plan" className="data-[state=active]:bg-green-600">
            Meu Plano
          </TabsTrigger>
          <TabsTrigger value="counter" className="data-[state=active]:bg-green-600">
            Contador
          </TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-green-600">
            Estatísticas
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-green-600">
            Histórico
          </TabsTrigger>
          <TabsTrigger value="plans" className="data-[state=active]:bg-green-600">
            Explorar
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-6">
        {activeTab === "my-plan" && <MyNutritionPlan user={user} />}
        {activeTab === "counter" && <CalorieCounter />}
        {activeTab === "stats" && <NutritionStats mealLogs={mealLogs} calorieGoal={calorieGoal} />}
        {activeTab === "history" && <MealHistory mealLogs={mealLogs} />}
        {activeTab === "plans" && <NutritionPlans />}
      </div>
    </div>
  );
}