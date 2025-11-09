
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CalorieCounter from "../components/nutrition/CalorieCounter";
import NutritionStats from "../components/nutrition/NutritionStats";
import MealHistory from "../components/nutrition/MealHistory";
import NutritionPlans from "../components/nutrition/NutritionPlans";

export default function Nutrition() {
  const [activeTab, setActiveTab] = useState("counter");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        // Redirect to login if user is not authenticated or an error occurs
        base44.auth.redirectToLogin(createPageUrl("Nutrition"));
      }
    };
    loadUser();
  }, []);

  if (!user) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Nutrição</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800 grid grid-cols-4">
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
            Planos
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-6">
        {activeTab === "counter" && <CalorieCounter />}
        {activeTab === "stats" && <NutritionStats />}
        {activeTab === "history" && <MealHistory />}
        {activeTab === "plans" && <NutritionPlans />}
      </div>
    </div>
  );
}
