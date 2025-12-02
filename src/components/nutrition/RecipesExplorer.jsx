import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Search, 
  Clock, 
  Users, 
  Flame, 
  ChefHat, 
  Loader2, 
  Sparkles,
  Lock,
  X,
  Filter
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const categoryLabels = {
  breakfast: { label: "Café da Manhã", emoji: "🍳" },
  lunch: { label: "Almoço", emoji: "🍽️" },
  dinner: { label: "Jantar", emoji: "🌙" },
  snack: { label: "Lanche", emoji: "🥪" },
  dessert: { label: "Sobremesa", emoji: "🍰" },
  drink: { label: "Bebida", emoji: "🥤" },
  post_workout: { label: "Pós-Treino", emoji: "💪" },
};

const dietTypeLabels = {
  low_carb: "Low Carb",
  high_protein: "Alta Proteína",
  vegetarian: "Vegetariano",
  vegan: "Vegano",
  gluten_free: "Sem Glúten",
  lactose_free: "Sem Lactose",
};

const difficultyLabels = {
  easy: { label: "Fácil", color: "bg-green-500/20 text-green-400" },
  medium: { label: "Médio", color: "bg-yellow-500/20 text-yellow-400" },
  hard: { label: "Difícil", color: "bg-red-500/20 text-red-400" },
};

export default function RecipesExplorer({ user }) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDiet, setSelectedDiet] = useState("all");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [generatingRecipes, setGeneratingRecipes] = useState(false);

  const isPremium = user?.subscription_status === 'premium' || user?.subscription_status === 'trial' || user?.subscription_status === 'lifetime';

  const { data: recipes = [], isLoading, refetch } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => base44.entities.Recipe.list('-created_date'),
  });

  const generateInitialRecipes = async () => {
    setGeneratingRecipes(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Gere 12 receitas saudáveis e fitness em português do Brasil. Inclua variedade:
        - 2 cafés da manhã proteicos
        - 2 almoços balanceados
        - 2 jantares leves
        - 2 lanches saudáveis
        - 2 pós-treino
        - 2 sobremesas fit
        
        Para cada receita, inclua informações nutricionais realistas.
        As receitas devem ser práticas, com ingredientes fáceis de encontrar no Brasil.`,
        response_json_schema: {
          type: "object",
          properties: {
            recipes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack", "dessert", "post_workout"] },
                  diet_type: { type: "array", items: { type: "string" } },
                  prep_time_minutes: { type: "number" },
                  cook_time_minutes: { type: "number" },
                  servings: { type: "number" },
                  difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                  ingredients: { 
                    type: "array", 
                    items: { 
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        quantity: { type: "string" },
                        unit: { type: "string" }
                      }
                    }
                  },
                  instructions: { type: "array", items: { type: "string" } },
                  nutrition_per_serving: {
                    type: "object",
                    properties: {
                      calories: { type: "number" },
                      protein: { type: "number" },
                      carbs: { type: "number" },
                      fat: { type: "number" },
                      fiber: { type: "number" }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (result.recipes) {
        await base44.entities.Recipe.bulkCreate(result.recipes);
        refetch();
      }
    } catch (error) {
      console.error("Erro ao gerar receitas:", error);
    } finally {
      setGeneratingRecipes(false);
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name?.toLowerCase().includes(search.toLowerCase()) ||
                          recipe.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || recipe.category === selectedCategory;
    const matchesDiet = selectedDiet === "all" || recipe.diet_type?.includes(selectedDiet);
    return matchesSearch && matchesCategory && matchesDiet;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-orange-900/30 to-red-900/20 border-orange-800/50">
        <CardContent className="p-6">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-orange-400" />
            Receitas Saudáveis
          </h3>
          <p className="text-slate-300 text-sm">
            Explore receitas deliciosas e nutritivas para sua dieta fitness! 🥗
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar receitas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-700 text-white"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
            className={selectedCategory === "all" ? "bg-green-600" : "border-slate-700 text-slate-300"}
          >
            Todas
          </Button>
          {Object.entries(categoryLabels).map(([key, { label, emoji }]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(key)}
              className={selectedCategory === key ? "bg-green-600" : "border-slate-700 text-slate-300"}
            >
              {emoji} {label}
            </Button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
          <Button
            variant={selectedDiet === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedDiet("all")}
            className={selectedDiet === "all" ? "bg-blue-600" : "border-slate-700 text-slate-300"}
          >
            Todas
          </Button>
          {Object.entries(dietTypeLabels).map(([key, label]) => (
            <Button
              key={key}
              variant={selectedDiet === key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDiet(key)}
              className={selectedDiet === key ? "bg-blue-600" : "border-slate-700 text-slate-300"}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Recipes Grid */}
      {filteredRecipes.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="py-12 text-center">
            <ChefHat className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">
              {recipes.length === 0 
                ? "Nenhuma receita disponível ainda" 
                : "Nenhuma receita encontrada com esses filtros"}
            </p>
            {recipes.length === 0 && user?.role === 'admin' && (
              <Button
                onClick={generateInitialRecipes}
                disabled={generatingRecipes}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {generatingRecipes ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando receitas...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Receitas com IA
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map((recipe) => {
            const isLocked = recipe.is_premium && !isPremium;
            const category = categoryLabels[recipe.category] || { label: recipe.category, emoji: "🍽️" };
            const difficulty = difficultyLabels[recipe.difficulty] || difficultyLabels.easy;
            
            return (
              <Card
                key={recipe.id}
                className={`bg-slate-900/50 border-slate-800 overflow-hidden cursor-pointer hover:border-slate-700 transition-all ${
                  isLocked ? 'opacity-75' : ''
                }`}
                onClick={() => !isLocked && setSelectedRecipe(recipe)}
              >
                {isLocked && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="text-center">
                      <Lock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                      <p className="text-white text-sm font-medium">Premium</p>
                    </div>
                  </div>
                )}

                {recipe.image_url ? (
                  <div className="aspect-video bg-slate-800">
                    <img src={recipe.image_url} alt={recipe.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                    <span className="text-5xl">{category.emoji}</span>
                  </div>
                )}

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-semibold line-clamp-1">{recipe.name}</h3>
                    <Badge className={difficulty.color}>{difficulty.label}</Badge>
                  </div>

                  <p className="text-slate-400 text-sm line-clamp-2 mb-3">{recipe.description}</p>

                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)}min
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {recipe.servings || 1} porção
                    </div>
                    <div className="flex items-center gap-1">
                      <Flame className="w-4 h-4" />
                      {recipe.nutrition_per_serving?.calories || '-'} kcal
                    </div>
                  </div>

                  {recipe.diet_type?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {recipe.diet_type.slice(0, 2).map((diet) => (
                        <Badge key={diet} variant="outline" className="text-xs border-slate-700 text-slate-400">
                          {dietTypeLabels[diet] || diet}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recipe Detail Dialog */}
      <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRecipe && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <span className="text-2xl">{categoryLabels[selectedRecipe.category]?.emoji}</span>
                  {selectedRecipe.name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Nutrition */}
                <div className="grid grid-cols-5 gap-2">
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-orange-400 font-bold text-lg">{selectedRecipe.nutrition_per_serving?.calories || '-'}</p>
                    <p className="text-slate-500 text-xs">kcal</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-blue-400 font-bold text-lg">{selectedRecipe.nutrition_per_serving?.protein || '-'}g</p>
                    <p className="text-slate-500 text-xs">Proteína</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-yellow-400 font-bold text-lg">{selectedRecipe.nutrition_per_serving?.carbs || '-'}g</p>
                    <p className="text-slate-500 text-xs">Carbos</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-red-400 font-bold text-lg">{selectedRecipe.nutrition_per_serving?.fat || '-'}g</p>
                    <p className="text-slate-500 text-xs">Gordura</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-green-400 font-bold text-lg">{selectedRecipe.nutrition_per_serving?.fiber || '-'}g</p>
                    <p className="text-slate-500 text-xs">Fibra</p>
                  </div>
                </div>

                {/* Info */}
                <div className="flex items-center gap-4 text-sm">
                  <Badge className={difficultyLabels[selectedRecipe.difficulty]?.color}>
                    {difficultyLabels[selectedRecipe.difficulty]?.label}
                  </Badge>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-4 h-4" />
                    Preparo: {selectedRecipe.prep_time_minutes || 0}min
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-4 h-4" />
                    Cozimento: {selectedRecipe.cook_time_minutes || 0}min
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Users className="w-4 h-4" />
                    {selectedRecipe.servings || 1} porções
                  </div>
                </div>

                {/* Description */}
                {selectedRecipe.description && (
                  <p className="text-slate-300">{selectedRecipe.description}</p>
                )}

                {/* Ingredients */}
                <div>
                  <h4 className="text-white font-semibold mb-3">🛒 Ingredientes</h4>
                  <ul className="space-y-2">
                    {selectedRecipe.ingredients?.map((ing, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-slate-300">
                        <span className="w-2 h-2 bg-green-400 rounded-full" />
                        {ing.quantity} {ing.unit} de {ing.name}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Instructions */}
                <div>
                  <h4 className="text-white font-semibold mb-3">👨‍🍳 Modo de Preparo</h4>
                  <ol className="space-y-3">
                    {selectedRecipe.instructions?.map((step, idx) => (
                      <li key={idx} className="flex gap-3 text-slate-300">
                        <span className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Diet Tags */}
                {selectedRecipe.diet_type?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedRecipe.diet_type.map((diet) => (
                      <Badge key={diet} className="bg-green-500/20 text-green-400">
                        {dietTypeLabels[diet] || diet}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}