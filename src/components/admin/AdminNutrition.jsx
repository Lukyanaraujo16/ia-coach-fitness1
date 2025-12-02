import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit2, Trash2, Lock, ChefHat, Utensils, Clock, Flame } from "lucide-react";
import NutritionPlanFormModal from "./NutritionPlanFormModal";
import RecipeFormModal from "./RecipeFormModal";

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

const CATEGORY_LABELS = {
  breakfast: "Café da Manhã",
  lunch: "Almoço",
  dinner: "Jantar",
  snack: "Lanche",
  post_workout: "Pós-Treino",
  dessert: "Sobremesa",
  drink: "Bebida",
};

export default function AdminNutrition({ plans = [] }) {
  const [activeTab, setActiveTab] = useState("plans");
  const [showModal, setShowModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const queryClient = useQueryClient();

  const { data: recipes = [] } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => base44.entities.Recipe.list('-created_date'),
  });

  const deletePlanMutation = useMutation({
    mutationFn: (planId) => base44.entities.NutritionPlan.delete(planId),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-nutrition-plans']);
    },
  });

  const deleteRecipeMutation = useMutation({
    mutationFn: (recipeId) => base44.entities.Recipe.delete(recipeId),
    onSuccess: () => {
      queryClient.invalidateQueries(['recipes']);
    },
  });

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setShowModal(true);
  };

  const handleEditRecipe = (recipe) => {
    setEditingRecipe(recipe);
    setShowRecipeModal(true);
  };

  const handleDelete = (planId) => {
    if (confirm('Tem certeza que deseja excluir este plano alimentar?')) {
      deletePlanMutation.mutate(planId);
    }
  };

  const handleDeleteRecipe = (recipeId) => {
    if (confirm('Tem certeza que deseja excluir esta receita?')) {
      deleteRecipeMutation.mutate(recipeId);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-900/50 border border-slate-800">
          <TabsTrigger value="plans" className="data-[state=active]:bg-green-600">
            <Utensils className="w-4 h-4 mr-2" />
            Planos Alimentares
          </TabsTrigger>
          <TabsTrigger value="recipes" className="data-[state=active]:bg-green-600">
            <ChefHat className="w-4 h-4 mr-2" />
            Receitas ({recipes.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === "plans" && (
        <>
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
                      className="bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 hover:text-blue-300"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(plan.id)}
                      className="bg-red-900/20 text-red-400 hover:bg-red-900/40 hover:text-red-300"
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
        </>
      )}

      {activeTab === "recipes" && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Receitas</h3>
              <p className="text-slate-400 text-sm">Cadastre receitas saudáveis para os usuários</p>
            </div>
            <Button
              onClick={() => {
                setEditingRecipe(null);
                setShowRecipeModal(true);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Receita
            </Button>
          </div>

          {recipes.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-12 text-center">
                <ChefHat className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">Nenhuma receita cadastrada ainda</p>
                <Button
                  onClick={() => setShowRecipeModal(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Receita
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipes.map((recipe) => (
                <Card key={recipe.id} className="bg-slate-900/50 border-slate-800">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{recipe.name}</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge className="bg-slate-700 text-slate-300 text-xs">
                            {CATEGORY_LABELS[recipe.category] || recipe.category}
                          </Badge>
                          {recipe.is_featured && (
                            <Badge className="bg-yellow-600 text-xs">Destaque</Badge>
                          )}
                          {recipe.is_premium && (
                            <Badge className="bg-purple-600 text-xs">Premium</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditRecipe(recipe)}
                          className="h-8 w-8 bg-blue-900/20 text-blue-400 hover:bg-blue-900/40"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteRecipe(recipe.id)}
                          className="h-8 w-8 bg-red-900/20 text-red-400 hover:bg-red-900/40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-slate-400 text-sm line-clamp-2 mb-3">{recipe.description}</p>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-400" />
                        {recipe.nutrition_per_serving?.calories || 0} kcal
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {showRecipeModal && (
            <RecipeFormModal
              recipe={editingRecipe}
              onClose={() => {
                setShowRecipeModal(false);
                setEditingRecipe(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}