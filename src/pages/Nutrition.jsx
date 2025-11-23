import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        
        // Verificar se veio com tab específica na URL
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        if (tabParam) {
          setActiveTab(tabParam);
        }
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

  const calorieGoal = user?.daily_calorie_goal || 2000;

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Nutrição</h2>
      </div>

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