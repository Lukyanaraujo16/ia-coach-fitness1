import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { id: "breakfast", label: "Café da Manhã" },
  { id: "lunch", label: "Almoço" },
  { id: "dinner", label: "Jantar" },
  { id: "snack", label: "Lanche" },
  { id: "post_workout", label: "Pós-Treino" },
  { id: "dessert", label: "Sobremesa" },
  { id: "drink", label: "Bebida" },
];

const DIET_TYPES = [
  { id: "high_protein", label: "Alta Proteína" },
  { id: "low_carb", label: "Low Carb" },
  { id: "vegetarian", label: "Vegetariano" },
  { id: "vegan", label: "Vegano" },
  { id: "gluten_free", label: "Sem Glúten" },
  { id: "lactose_free", label: "Sem Lactose" },
];

const DIFFICULTIES = [
  { id: "easy", label: "Fácil" },
  { id: "medium", label: "Médio" },
  { id: "hard", label: "Difícil" },
];

export default function RecipeFormModal({ recipe, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: recipe?.name || "",
    description: recipe?.description || "",
    category: recipe?.category || "lunch",
    diet_type: recipe?.diet_type || [],
    prep_time_minutes: recipe?.prep_time_minutes || 15,
    cook_time_minutes: recipe?.cook_time_minutes || 30,
    servings: recipe?.servings || 2,
    difficulty: recipe?.difficulty || "easy",
    ingredients: recipe?.ingredients || [{ name: "", quantity: "", unit: "" }],
    instructions: recipe?.instructions || [""],
    nutrition_per_serving: recipe?.nutrition_per_serving || {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    },
    image_url: recipe?.image_url || "",
    is_featured: recipe?.is_featured || false,
    is_premium: recipe?.is_premium || false,
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (recipe) {
        return base44.entities.Recipe.update(recipe.id, data);
      }
      return base44.entities.Recipe.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['recipes']);
      toast.success(recipe ? "Receita atualizada!" : "Receita criada!");
      onClose();
    },
    onError: (error) => {
      toast.error("Erro ao salvar receita");
      console.error(error);
    },
  });

  const toggleDietType = (dietId) => {
    if (formData.diet_type.includes(dietId)) {
      setFormData({ ...formData, diet_type: formData.diet_type.filter(d => d !== dietId) });
    } else {
      setFormData({ ...formData, diet_type: [...formData.diet_type, dietId] });
    }
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { name: "", quantity: "", unit: "" }],
    });
  };

  const updateIngredient = (index, field, value) => {
    const updated = [...formData.ingredients];
    updated[index][field] = value;
    setFormData({ ...formData, ingredients: updated });
  };

  const removeIngredient = (index) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const addInstruction = () => {
    setFormData({ ...formData, instructions: [...formData.instructions, ""] });
  };

  const updateInstruction = (index, value) => {
    const updated = [...formData.instructions];
    updated[index] = value;
    setFormData({ ...formData, instructions: updated });
  };

  const removeInstruction = (index) => {
    setFormData({
      ...formData,
      instructions: formData.instructions.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.category) {
      toast.error("Preencha o nome e categoria");
      return;
    }
    // Filter out empty ingredients and instructions
    const cleanData = {
      ...formData,
      ingredients: formData.ingredients.filter(i => i.name.trim()),
      instructions: formData.instructions.filter(i => i.trim()),
    };
    saveMutation.mutate(cleanData);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            {recipe ? "Editar Receita" : "Nova Receita"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-slate-300">Nome da Receita</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
                placeholder="Ex: Frango Grelhado com Legumes"
              />
            </div>

            <div className="col-span-2">
              <Label className="text-slate-300">Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
                placeholder="Breve descrição da receita..."
              />
            </div>

            <div>
              <Label className="text-slate-300">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-300">Dificuldade</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(v) => setFormData({ ...formData, difficulty: v })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {DIFFICULTIES.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Diet Types */}
          <div>
            <Label className="text-slate-300">Tipos de Dieta</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {DIET_TYPES.map(diet => (
                <Badge
                  key={diet.id}
                  onClick={() => toggleDietType(diet.id)}
                  className={`cursor-pointer transition-all ${
                    formData.diet_type.includes(diet.id)
                      ? "bg-green-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {diet.label}
                  {formData.diet_type.includes(diet.id) && <X className="w-3 h-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </div>

          {/* Time & Servings */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label className="text-slate-300">Preparo (min)</Label>
              <Input
                type="number"
                value={formData.prep_time_minutes}
                onChange={(e) => setFormData({ ...formData, prep_time_minutes: Number(e.target.value) })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-300">Cozimento (min)</Label>
              <Input
                type="number"
                value={formData.cook_time_minutes}
                onChange={(e) => setFormData({ ...formData, cook_time_minutes: Number(e.target.value) })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-300">Porções</Label>
              <Input
                type="number"
                value={formData.servings}
                onChange={(e) => setFormData({ ...formData, servings: Number(e.target.value) })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-300">URL da Imagem</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Nutrition */}
          <div>
            <Label className="text-slate-300">Informações Nutricionais (por porção)</Label>
            <div className="grid grid-cols-5 gap-3 mt-2">
              <div>
                <Label className="text-slate-400 text-xs">Calorias</Label>
                <Input
                  type="number"
                  value={formData.nutrition_per_serving.calories}
                  onChange={(e) => setFormData({
                    ...formData,
                    nutrition_per_serving: { ...formData.nutrition_per_serving, calories: Number(e.target.value) }
                  })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs">Proteína (g)</Label>
                <Input
                  type="number"
                  value={formData.nutrition_per_serving.protein}
                  onChange={(e) => setFormData({
                    ...formData,
                    nutrition_per_serving: { ...formData.nutrition_per_serving, protein: Number(e.target.value) }
                  })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs">Carbos (g)</Label>
                <Input
                  type="number"
                  value={formData.nutrition_per_serving.carbs}
                  onChange={(e) => setFormData({
                    ...formData,
                    nutrition_per_serving: { ...formData.nutrition_per_serving, carbs: Number(e.target.value) }
                  })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs">Gordura (g)</Label>
                <Input
                  type="number"
                  value={formData.nutrition_per_serving.fat}
                  onChange={(e) => setFormData({
                    ...formData,
                    nutrition_per_serving: { ...formData.nutrition_per_serving, fat: Number(e.target.value) }
                  })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs">Fibra (g)</Label>
                <Input
                  type="number"
                  value={formData.nutrition_per_serving.fiber}
                  onChange={(e) => setFormData({
                    ...formData,
                    nutrition_per_serving: { ...formData.nutrition_per_serving, fiber: Number(e.target.value) }
                  })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-slate-300">Ingredientes</Label>
              <Button size="sm" variant="outline" onClick={addIngredient} className="border-slate-700 text-slate-300">
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>
            <div className="space-y-2">
              {formData.ingredients.map((ing, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white w-20"
                    placeholder="Qtd"
                  />
                  <Input
                    value={ing.unit}
                    onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white w-24"
                    placeholder="Unidade"
                  />
                  <Input
                    value={ing.name}
                    onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white flex-1"
                    placeholder="Ingrediente"
                  />
                  <Button size="icon" variant="ghost" onClick={() => removeIngredient(idx)} className="text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-slate-300">Modo de Preparo</Label>
              <Button size="sm" variant="outline" onClick={addInstruction} className="border-slate-700 text-slate-300">
                <Plus className="w-4 h-4 mr-1" /> Adicionar Passo
              </Button>
            </div>
            <div className="space-y-2">
              {formData.instructions.map((step, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <span className="text-slate-400 mt-2 text-sm w-6">{idx + 1}.</span>
                  <Textarea
                    value={step}
                    onChange={(e) => updateInstruction(idx, e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white flex-1"
                    placeholder={`Passo ${idx + 1}...`}
                    rows={2}
                  />
                  <Button size="icon" variant="ghost" onClick={() => removeInstruction(idx)} className="text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Flags */}
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_featured}
                onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })}
              />
              <Label className="text-slate-300">Destaque</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_premium}
                onCheckedChange={(v) => setFormData({ ...formData, is_premium: v })}
              />
              <Label className="text-slate-300">Premium</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-300">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saveMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {recipe ? "Salvar" : "Criar Receita"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}