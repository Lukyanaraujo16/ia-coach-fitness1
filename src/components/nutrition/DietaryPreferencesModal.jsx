import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Save, Plus, Trash2 } from "lucide-react";

const dietaryOptions = [
  { value: "vegetarian", label: "Vegetariano", emoji: "🥗" },
  { value: "vegan", label: "Vegano", emoji: "🌱" },
  { value: "pescatarian", label: "Pescetariano", emoji: "🐟" },
  { value: "keto", label: "Keto", emoji: "🥑" },
  { value: "paleo", label: "Paleo", emoji: "🥩" },
  { value: "low_carb", label: "Low Carb", emoji: "🚫🍞" },
  { value: "high_protein", label: "Alta Proteína", emoji: "💪" },
  { value: "gluten_free", label: "Sem Glúten", emoji: "🌾" },
  { value: "dairy_free", label: "Sem Lactose", emoji: "🥛" },
  { value: "halal", label: "Halal", emoji: "☪️" },
  { value: "kosher", label: "Kosher", emoji: "✡️" },
];

export default function DietaryPreferencesModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    dietary_preferences: user?.dietary_preferences || [],
    food_allergies: user?.food_allergies || [],
    disliked_foods: user?.disliked_foods || [],
    meals_per_day: user?.meals_per_day || 3,
  });

  const [newAllergy, setNewAllergy] = useState("");
  const [newDislike, setNewDislike] = useState("");

  const updatePreferencesMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      onSave();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updatePreferencesMutation.mutate(formData);
  };

  const togglePreference = (value) => {
    const current = formData.dietary_preferences || [];
    if (current.includes(value)) {
      setFormData({
        ...formData,
        dietary_preferences: current.filter(p => p !== value)
      });
    } else {
      setFormData({
        ...formData,
        dietary_preferences: [...current, value]
      });
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setFormData({
        ...formData,
        food_allergies: [...(formData.food_allergies || []), newAllergy.trim()]
      });
      setNewAllergy("");
    }
  };

  const removeAllergy = (index) => {
    setFormData({
      ...formData,
      food_allergies: formData.food_allergies.filter((_, i) => i !== index)
    });
  };

  const addDislike = () => {
    if (newDislike.trim()) {
      setFormData({
        ...formData,
        disliked_foods: [...(formData.disliked_foods || []), newDislike.trim()]
      });
      setNewDislike("");
    }
  };

  const removeDislike = (index) => {
    setFormData({
      ...formData,
      disliked_foods: formData.disliked_foods.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-slate-900 border-slate-800 max-w-3xl w-full max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 flex-shrink-0">
          <CardTitle className="text-white">Preferências Alimentares</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dietary Preferences */}
            <div className="space-y-3">
              <Label className="text-slate-300 text-base font-semibold">
                🥗 Preferências Dietéticas
              </Label>
              <p className="text-slate-400 text-sm">
                Selecione todas as dietas ou restrições que você segue
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {dietaryOptions.map((option) => {
                  const isSelected = formData.dietary_preferences?.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => togglePreference(option.value)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? "border-purple-600 bg-purple-600/20"
                          : "border-slate-800 bg-slate-800/50 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{option.emoji}</span>
                        <span className="text-white text-sm font-medium">
                          {option.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Meals Per Day */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-base font-semibold">
                🍴 Refeições por Dia
              </Label>
              <p className="text-slate-400 text-sm mb-3">
                Quantas refeições você prefere fazer por dia?
              </p>
              <div className="grid grid-cols-5 gap-2">
                {[3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setFormData({ ...formData, meals_per_day: num })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.meals_per_day === num
                        ? "border-blue-600 bg-blue-600/20"
                        : "border-slate-800 bg-slate-800/50 hover:border-slate-700"
                    }`}
                  >
                    <p className="text-white text-xl font-bold text-center">{num}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Food Allergies */}
            <div className="space-y-3">
              <Label className="text-slate-300 text-base font-semibold">
                ⚠️ Alergias e Intolerâncias
              </Label>
              <p className="text-slate-400 text-sm">
                Liste alimentos que você é alérgico ou intolerante
              </p>
              <div className="flex gap-2">
                <Input
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                  placeholder="Ex: amendoim, lactose..."
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <Button
                  type="button"
                  onClick={addAllergy}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.food_allergies?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.food_allergies.map((allergy, idx) => (
                    <Badge
                      key={idx}
                      className="bg-red-600/20 text-red-400 border border-red-600/30 pr-1"
                    >
                      {allergy}
                      <button
                        type="button"
                        onClick={() => removeAllergy(idx)}
                        className="ml-2 hover:bg-red-600/40 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Disliked Foods */}
            <div className="space-y-3">
              <Label className="text-slate-300 text-base font-semibold">
                🚫 Alimentos que Não Gosta
              </Label>
              <p className="text-slate-400 text-sm">
                Liste alimentos que você prefere evitar nas receitas
              </p>
              <div className="flex gap-2">
                <Input
                  value={newDislike}
                  onChange={(e) => setNewDislike(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDislike())}
                  placeholder="Ex: coentro, azeitona..."
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <Button
                  type="button"
                  onClick={addDislike}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.disliked_foods?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.disliked_foods.map((food, idx) => (
                    <Badge
                      key={idx}
                      className="bg-orange-600/20 text-orange-400 border border-orange-600/30 pr-1"
                    >
                      {food}
                      <button
                        type="button"
                        onClick={() => removeDislike(idx)}
                        className="ml-2 hover:bg-orange-600/40 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-800 sticky bottom-0 bg-slate-900 -mx-6 px-6 pb-6">
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
                disabled={updatePreferencesMutation.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {updatePreferencesMutation.isPending ? (
                  "Salvando..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Preferências
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}