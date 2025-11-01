import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Save, AlertCircle } from "lucide-react";

export default function NutritionGoalsModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    daily_calorie_goal: user?.daily_calorie_goal || 2000,
    macro_protein_percentage: user?.macro_protein_percentage || 30,
    macro_carbs_percentage: user?.macro_carbs_percentage || 40,
    macro_fat_percentage: user?.macro_fat_percentage || 30,
  });

  const updateGoalsMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      onSave();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const total = formData.macro_protein_percentage + formData.macro_carbs_percentage + formData.macro_fat_percentage;
    if (total !== 100) {
      alert("A soma dos macronutrientes deve ser exatamente 100%");
      return;
    }

    updateGoalsMutation.mutate(formData);
  };

  const total = formData.macro_protein_percentage + formData.macro_carbs_percentage + formData.macro_fat_percentage;
  const isValid = total === 100;

  // Calcular gramas aproximadas
  const proteinGrams = Math.round((formData.daily_calorie_goal * (formData.macro_protein_percentage / 100)) / 4);
  const carbsGrams = Math.round((formData.daily_calorie_goal * (formData.macro_carbs_percentage / 100)) / 4);
  const fatGrams = Math.round((formData.daily_calorie_goal * (formData.macro_fat_percentage / 100)) / 9);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-slate-900 border-slate-800 max-w-2xl w-full max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 flex-shrink-0">
          <CardTitle className="text-white">Configurar Metas Nutricionais</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-400 font-semibold mb-1">
                    Personalize suas metas
                  </p>
                  <p className="text-slate-300 text-sm">
                    Defina suas metas diárias de calorias e distribuição de macronutrientes. 
                    As barras de progresso serão atualizadas conforme você registra suas refeições.
                  </p>
                </div>
              </div>
            </div>

            {/* Calorias */}
            <div className="space-y-2">
              <Label className="text-slate-300">Meta Diária de Calorias *</Label>
              <Input
                type="number"
                min="1000"
                max="5000"
                value={formData.daily_calorie_goal}
                onChange={(e) => setFormData({ ...formData, daily_calorie_goal: parseInt(e.target.value) || 2000 })}
                className="bg-slate-800 border-slate-700 text-white text-lg font-semibold"
                required
              />
              <p className="text-slate-500 text-xs">
                Recomendado: 1500-2500 kcal para maioria das pessoas
              </p>
            </div>

            {/* Distribuição de Macros */}
            <div className="space-y-4">
              <Label className="text-slate-300">Distribuição de Macronutrientes (%)</Label>
              
              <div className="space-y-4">
                {/* Proteínas */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-blue-400">Proteínas</Label>
                    <span className="text-blue-400 font-bold">{proteinGrams}g</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.macro_protein_percentage}
                      onChange={(e) => setFormData({ ...formData, macro_protein_percentage: parseInt(e.target.value) || 0 })}
                      className="bg-slate-800 border-slate-700 text-white w-24"
                    />
                    <span className="text-slate-400">%</span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all"
                        style={{ width: `${formData.macro_protein_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Carboidratos */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-orange-400">Carboidratos</Label>
                    <span className="text-orange-400 font-bold">{carbsGrams}g</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.macro_carbs_percentage}
                      onChange={(e) => setFormData({ ...formData, macro_carbs_percentage: parseInt(e.target.value) || 0 })}
                      className="bg-slate-800 border-slate-700 text-white w-24"
                    />
                    <span className="text-slate-400">%</span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-600 transition-all"
                        style={{ width: `${formData.macro_carbs_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Gorduras */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-yellow-400">Gorduras</Label>
                    <span className="text-yellow-400 font-bold">{fatGrams}g</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.macro_fat_percentage}
                      onChange={(e) => setFormData({ ...formData, macro_fat_percentage: parseInt(e.target.value) || 0 })}
                      className="bg-slate-800 border-slate-700 text-white w-24"
                    />
                    <span className="text-slate-400">%</span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-600 transition-all"
                        style={{ width: `${formData.macro_fat_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className={`p-4 rounded-lg ${
                isValid
                  ? 'bg-green-900/20 border border-green-800/50'
                  : 'bg-red-900/20 border border-red-800/50'
              }`}>
                <p className={`font-bold ${isValid ? 'text-green-400' : 'text-red-400'}`}>
                  Total: {total}%
                </p>
                {!isValid && (
                  <p className="text-red-300 text-sm mt-1">
                    A soma deve ser exatamente 100%
                  </p>
                )}
              </div>
            </div>

            {/* Sugestões Comuns */}
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-slate-300 font-semibold mb-3">Distribuições Comuns:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({
                    ...formData,
                    macro_protein_percentage: 30,
                    macro_carbs_percentage: 40,
                    macro_fat_percentage: 30,
                  })}
                  className="border-slate-700 text-slate-300"
                >
                  Balanceada (30/40/30)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({
                    ...formData,
                    macro_protein_percentage: 40,
                    macro_carbs_percentage: 30,
                    macro_fat_percentage: 30,
                  })}
                  className="border-slate-700 text-slate-300"
                >
                  Alta Proteína (40/30/30)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({
                    ...formData,
                    macro_protein_percentage: 30,
                    macro_carbs_percentage: 20,
                    macro_fat_percentage: 50,
                  })}
                  className="border-slate-700 text-slate-300"
                >
                  Low Carb (30/20/50)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({
                    ...formData,
                    macro_protein_percentage: 25,
                    macro_carbs_percentage: 55,
                    macro_fat_percentage: 20,
                  })}
                  className="border-slate-700 text-slate-300"
                >
                  Alta Carbos (25/55/20)
                </Button>
              </div>
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
                disabled={!isValid || updateGoalsMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {updateGoalsMutation.isPending ? (
                  "Salvando..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Metas
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