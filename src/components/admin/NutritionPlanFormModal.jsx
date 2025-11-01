import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Trash2 } from "lucide-react";

export default function NutritionPlanFormModal({ plan, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goal: "lose_weight",
    daily_calories: 2000,
    macros_distribution: {
      protein_percentage: 30,
      carbs_percentage: 40,
      fat_percentage: 30,
    },
    meals: [],
    is_premium: false,
    tips: [],
  });

  const [newMeal, setNewMeal] = useState({ meal_type: "", time: "", suggestions: [""] });
  const [newTip, setNewTip] = useState("");

  useEffect(() => {
    if (plan) {
      setFormData({
        title: plan.title || "",
        description: plan.description || "",
        goal: plan.goal || "lose_weight",
        daily_calories: plan.daily_calories || 2000,
        macros_distribution: plan.macros_distribution || {
          protein_percentage: 30,
          carbs_percentage: 40,
          fat_percentage: 30,
        },
        meals: plan.meals || [],
        is_premium: plan.is_premium || false,
        tips: plan.tips || [],
      });
    }
  }, [plan]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (plan) {
        return base44.entities.NutritionPlan.update(plan.id, data);
      }
      return base44.entities.NutritionPlan.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-nutrition-plans']);
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const addMeal = () => {
    if (newMeal.meal_type && newMeal.time) {
      setFormData({
        ...formData,
        meals: [...formData.meals, { ...newMeal, suggestions: newMeal.suggestions.filter(s => s.trim()) }],
      });
      setNewMeal({ meal_type: "", time: "", suggestions: [""] });
    }
  };

  const removeMeal = (index) => {
    setFormData({
      ...formData,
      meals: formData.meals.filter((_, i) => i !== index),
    });
  };

  const addTip = () => {
    if (newTip.trim()) {
      setFormData({
        ...formData,
        tips: [...formData.tips, newTip.trim()],
      });
      setNewTip("");
    }
  };

  const removeTip = (index) => {
    setFormData({
      ...formData,
      tips: formData.tips.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="bg-slate-900 border-slate-800 max-w-3xl w-full my-8">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800">
          <CardTitle className="text-white">
            {plan ? "Editar Plano Alimentar" : "Novo Plano Alimentar"}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Título *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Ex: Plano Low Carb"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Objetivo *</Label>
                <Select
                  value={formData.goal}
                  onValueChange={(value) => setFormData({ ...formData, goal: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose_weight">🔥 Emagrecer</SelectItem>
                    <SelectItem value="gain_muscle">💪 Ganhar Massa</SelectItem>
                    <SelectItem value="maintain">⚖️ Manter</SelectItem>
                    <SelectItem value="performance">⚡ Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Descreva o plano alimentar..."
              />
            </div>

            {/* Calories & Macros */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Calorias/dia *</Label>
                <Input
                  type="number"
                  value={formData.daily_calories}
                  onChange={(e) => setFormData({ ...formData, daily_calories: parseInt(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Proteína %</Label>
                <Input
                  type="number"
                  value={formData.macros_distribution.protein_percentage}
                  onChange={(e) => setFormData({
                    ...formData,
                    macros_distribution: {
                      ...formData.macros_distribution,
                      protein_percentage: parseInt(e.target.value),
                    }
                  })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Carbos %</Label>
                <Input
                  type="number"
                  value={formData.macros_distribution.carbs_percentage}
                  onChange={(e) => setFormData({
                    ...formData,
                    macros_distribution: {
                      ...formData.macros_distribution,
                      carbs_percentage: parseInt(e.target.value),
                    }
                  })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Gorduras %</Label>
                <Input
                  type="number"
                  value={formData.macros_distribution.fat_percentage}
                  onChange={(e) => setFormData({
                    ...formData,
                    macros_distribution: {
                      ...formData.macros_distribution,
                      fat_percentage: parseInt(e.target.value),
                    }
                  })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            {/* Meals */}
            <div className="space-y-3">
              <Label className="text-slate-300">Refeições Sugeridas</Label>
              
              {formData.meals.map((meal, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-white font-medium">{meal.meal_type} - {meal.time}</p>
                    <p className="text-slate-400 text-sm">
                      {meal.suggestions.join(", ")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeMeal(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <div className="grid md:grid-cols-3 gap-2">
                <Input
                  placeholder="Ex: Café da Manhã"
                  value={newMeal.meal_type}
                  onChange={(e) => setNewMeal({ ...newMeal, meal_type: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <Input
                  placeholder="Ex: 7:00"
                  value={newMeal.time}
                  onChange={(e) => setNewMeal({ ...newMeal, time: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <Button
                  type="button"
                  onClick={addMeal}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>

            {/* Tips */}
            <div className="space-y-3">
              <Label className="text-slate-300">Dicas Nutricionais</Label>
              
              {formData.tips.map((tip, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg">
                  <p className="flex-1 text-slate-300 text-sm">{tip}</p>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeTip(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <div className="flex gap-2">
                <Input
                  placeholder="Digite uma dica nutricional..."
                  value={newTip}
                  onChange={(e) => setNewTip(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTip())}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <Button
                  type="button"
                  onClick={addTip}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>

            {/* Premium */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_premium"
                checked={formData.is_premium}
                onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="is_premium" className="text-slate-300">
                Plano Premium (exclusivo para assinantes)
              </Label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-slate-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {saveMutation.isPending ? "Salvando..." : "Salvar Plano"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}