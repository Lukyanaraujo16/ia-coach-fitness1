import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Lock } from "lucide-react";
import NutritionPlanFormModal from "./NutritionPlanFormModal";

const goalIcons = {
  lose_weight: "🔥",
  gain_muscle: "💪",
  maintain: "⚖️",
  performance: "⚡",
};

const goalLabels = {
  lose_weight: "Emagrecer",
  gain_muscle: "Ganhar Massa",
  maintain: "Manter",
  performance: "Performance",
};

export default function AdminNutrition({ plans = [] }) {
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const queryClient = useQueryClient();

  const deletePlanMutation = useMutation({
    mutationFn: (planId) => base44.entities.NutritionPlan.delete(planId),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-nutrition-plans']);
    },
  });

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setShowModal(true);
  };

  const handleDelete = (planId) => {
    if (confirm('Tem certeza que deseja excluir este plano alimentar?')) {
      deletePlanMutation.mutate(planId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Planos Alimentares</h3>
          <p className="text-slate-400 text-sm">Crie e gerencie dietas personalizadas</p>
        </div>
        <Button
          onClick={() => {
            setEditingPlan(null);
            setShowModal(true);
          }}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {plans.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-12 text-center">
            <p className="text-slate-400 mb-4">Nenhum plano alimentar criado ainda</p>
            <Button
              onClick={() => setShowModal(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Plano
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{goalIcons[plan.goal]}</span>
                      <CardTitle className="text-white">{plan.title}</CardTitle>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge className="bg-green-500/20 text-green-400">
                        {goalLabels[plan.goal]}
                      </Badge>
                      {plan.is_premium && (
                        <Badge className="bg-yellow-500/20 text-yellow-400">
                          <Lock className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">{plan.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(plan)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(plan.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {plan.daily_calories}
                  </p>
                  <p className="text-slate-500 text-sm">kcal/dia</p>
                </div>

                {plan.macros_distribution && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-slate-800/50 rounded">
                      <p className="text-blue-400 font-bold">
                        {plan.macros_distribution.protein_percentage}%
                      </p>
                      <p className="text-slate-500 text-xs">Proteína</p>
                    </div>
                    <div className="text-center p-2 bg-slate-800/50 rounded">
                      <p className="text-orange-400 font-bold">
                        {plan.macros_distribution.carbs_percentage}%
                      </p>
                      <p className="text-slate-500 text-xs">Carbos</p>
                    </div>
                    <div className="text-center p-2 bg-slate-800/50 rounded">
                      <p className="text-yellow-400 font-bold">
                        {plan.macros_distribution.fat_percentage}%
                      </p>
                      <p className="text-slate-500 text-xs">Gorduras</p>
                    </div>
                  </div>
                )}

                {plan.meals && plan.meals.length > 0 && (
                  <div>
                    <p className="text-slate-400 text-xs mb-2">
                      {plan.meals.length} refeições configuradas
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <NutritionPlanFormModal
          plan={editingPlan}
          onClose={() => {
            setShowModal(false);
            setEditingPlan(null);
          }}
        />
      )}
    </div>
  );
}