import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Clock, ChefHat, Flame, Filter, X } from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "Todas" },
  { id: "breakfast", label: "Café da Manhã" },
  { id: "lunch", label: "Almoço" },
  { id: "dinner", label: "Jantar" },
  { id: "snack", label: "Lanche" },
  { id: "post_workout", label: "Pós-Treino" },
  { id: "dessert", label: "Sobremesa" },
];

const DIET_TYPES = [
  { id: "high_protein", label: "Alta Proteína", color: "bg-blue-600" },
  { id: "low_carb", label: "Low Carb", color: "bg-orange-600" },
  { id: "vegetarian", label: "Vegetariano", color: "bg-green-600" },
  { id: "gluten_free", label: "Sem Glúten", color: "bg-purple-600" },
  { id: "lactose_free", label: "Sem Lactose", color: "bg-pink-600" },
];

export default function RecipesExplorer({ user }) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDiets, setSelectedDiets] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => base44.entities.Recipe.list(),
  });

  const toggleDiet = (dietId) => {
    if (selectedDiets.includes(dietId)) {
      setSelectedDiets(selectedDiets.filter(d => d !== dietId));
    } else {
      setSelectedDiets([...selectedDiets, dietId]);
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name?.toLowerCase().includes(search.toLowerCase()) ||
                          recipe.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || recipe.category === selectedCategory;
    const matchesDiet = selectedDiets.length === 0 || 
                        selectedDiets.every(diet => recipe.diet_type?.includes(diet));
    return matchesSearch && matchesCategory && matchesDiet;
  });

  const getDietLabel = (dietId) => {
    return DIET_TYPES.find(d => d.id === dietId)?.label || dietId;
  };

  const getDietColor = (dietId) => {
    return DIET_TYPES.find(d => d.id === dietId)?.color || "bg-slate-600";
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Buscar receitas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <Button
              key={cat.id}
              size="sm"
              variant={selectedCategory === cat.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat.id)}
              className={selectedCategory === cat.id 
                ? "bg-green-600 hover:bg-green-700 whitespace-nowrap" 
                : "border-slate-700 text-slate-300 whitespace-nowrap"}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Diet Type Filters */}
        <div className="flex flex-wrap gap-2">
          <Filter className="w-4 h-4 text-slate-400 mt-1" />
          {DIET_TYPES.map(diet => (
            <Badge
              key={diet.id}
              onClick={() => toggleDiet(diet.id)}
              className={`cursor-pointer transition-all ${
                selectedDiets.includes(diet.id) 
                  ? diet.color + " text-white" 
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {diet.label}
              {selectedDiets.includes(diet.id) && <X className="w-3 h-3 ml-1" />}
            </Badge>
          ))}
        </div>
      </div>

      {/* Recipes Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-slate-400">Carregando receitas...</p>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="py-12 text-center">
            <ChefHat className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Nenhuma receita encontrada</p>
            <p className="text-slate-500 text-sm">Tente ajustar os filtros</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecipes.map(recipe => (
            <Card 
              key={recipe.id} 
              className="bg-slate-900/50 border-slate-800 cursor-pointer hover:border-green-600/50 transition-all"
              onClick={() => setSelectedRecipe(recipe)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-semibold">{recipe.name}</h3>
                  {recipe.is_featured && (
                    <Badge className="bg-yellow-600">Destaque</Badge>
                  )}
                </div>
                <p className="text-slate-400 text-sm mb-3 line-clamp-2">{recipe.description}</p>
                
                <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-4 h-4 text-orange-400" />
                    {recipe.nutrition_per_serving?.calories || 0} kcal
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {recipe.diet_type?.slice(0, 3).map(diet => (
                    <Badge key={diet} className={`${getDietColor(diet)} text-xs`}>
                      {getDietLabel(diet)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recipe Detail Dialog */}
      <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRecipe && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white text-xl">{selectedRecipe.name}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <p className="text-slate-300">{selectedRecipe.description}</p>

                {/* Quick Info */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <p className="text-orange-400 font-bold text-lg">
                      {selectedRecipe.nutrition_per_serving?.calories || 0}
                    </p>
                    <p className="text-slate-400 text-xs">kcal</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <p className="text-blue-400 font-bold text-lg">
                      {selectedRecipe.nutrition_per_serving?.protein || 0}g
                    </p>
                    <p className="text-slate-400 text-xs">Proteína</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <p className="text-yellow-400 font-bold text-lg">
                      {selectedRecipe.nutrition_per_serving?.carbs || 0}g
                    </p>
                    <p className="text-slate-400 text-xs">Carbos</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <p className="text-pink-400 font-bold text-lg">
                      {selectedRecipe.nutrition_per_serving?.fat || 0}g
                    </p>
                    <p className="text-slate-400 text-xs">Gordura</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Preparo: {selectedRecipe.prep_time_minutes || 0} min
                  </span>
                  <span className="flex items-center gap-1">
                    <ChefHat className="w-4 h-4" />
                    Cozimento: {selectedRecipe.cook_time_minutes || 0} min
                  </span>
                  <span>Porções: {selectedRecipe.servings || 1}</span>
                </div>

                {/* Ingredients */}
                <div>
                  <h4 className="text-white font-semibold mb-3">Ingredientes</h4>
                  <ul className="space-y-2">
                    {selectedRecipe.ingredients?.map((ing, idx) => (
                      <li key={idx} className="text-slate-300 text-sm flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        {ing.quantity} {ing.unit} {ing.name}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Instructions */}
                <div>
                  <h4 className="text-white font-semibold mb-3">Modo de Preparo</h4>
                  <ol className="space-y-3">
                    {selectedRecipe.instructions?.map((step, idx) => (
                      <li key={idx} className="text-slate-300 text-sm flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {idx + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Diet Tags */}
                <div className="flex flex-wrap gap-2">
                  {selectedRecipe.diet_type?.map(diet => (
                    <Badge key={diet} className={getDietColor(diet)}>
                      {getDietLabel(diet)}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}