import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Target, TrendingUp, RefreshCw, Loader2, ChefHat, Sparkles, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function MyNutritionPlan({ user }) {
  const queryClient = useQueryClient();
  const [showSubstitution, setShowSubstitution] = useState(false);
  const [substitutionRequest, setSubstitutionRequest] = useState("");
  const [substituting, setSubstituting] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const handleGeneratePDF = async () => {
    setGeneratingPDF(true);
    try {
      const response = await base44.functions.invoke('generateNutritionPDF', {});
      
      // response.data é um data URL (data:application/pdf;base64,...)
      const link = document.createElement('a');
      link.href = response.data.data;
      link.download = response.data.filename || `plano-nutricional-${user.nome_completo?.replace(/\s+/g, '-') || 'usuario'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('✅ PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('❌ Erro ao gerar PDF: ' + (error.response?.data?.error || error.message || 'Tente novamente'));
    } finally {
      setGeneratingPDF(false);
    }
  };

  const nutritionPlan = user?.selected_nutrition_plan_data;
  const hasNutritionPlan = nutritionPlan && nutritionPlan.meal_timing;

  const handleSubstitution = async () => {
    if (!substitutionRequest.trim()) {
      alert("Por favor, descreva o que deseja substituir");
      return;
    }

    setSubstituting(true);
    try {
      const calorieGoal = nutritionPlan.daily_calories;
      const proteinPercentage = nutritionPlan.macros.protein_percentage;
      const carbsPercentage = nutritionPlan.macros.carbs_percentage;
      const fatPercentage = nutritionPlan.macros.fat_percentage;

      const budgetText = user.budget === 'low' 
        ? 'ECONÔMICO - Use alimentos básicos e acessíveis'
        : user.budget === 'moderate'
        ? 'MODERADO - Equilíbrio entre qualidade e custo'
        : 'FLEXÍVEL - Sem restrições de orçamento';

      const prompt = `Você é um nutricionista experiente ajustando um plano alimentar.

PLANO ATUAL DO ALUNO:
${JSON.stringify(nutritionPlan.meal_timing, null, 2)}

ORÇAMENTO: ${budgetText}

SOLICITAÇÃO DE SUBSTITUIÇÃO:
"${substitutionRequest}"

METAS NUTRICIONAIS (NÃO DEVEM MUDAR):
- Calorias totais: ${calorieGoal} kcal
- Proteínas: ${proteinPercentage}%
- Carboidratos: ${carbsPercentage}%
- Gorduras: ${fatPercentage}%

INSTRUÇÕES:
1. MANTENHA TODAS as outras refeições EXATAMENTE IGUAIS
2. SUBSTITUA APENAS o(s) alimento(s) mencionado(s) pelo usuário
3. A nova sugestão deve ter calorias e macros SIMILARES ao alimento substituído
4. RESPEITE o orçamento do aluno na substituição
5. Use ingredientes BRASILEIROS e acessíveis
6. Retorne o plano completo com ${nutritionPlan.meal_timing.length} refeições

Gere o novo plano de refeições com a substituição solicitada:`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            meal_timing: {
              type: "array",
              minItems: nutritionPlan.meal_timing.length,
              maxItems: nutritionPlan.meal_timing.length,
              items: {
                type: "object",
                properties: {
                  time: { type: "string" },
                  meal_type: { type: "string" },
                  suggestion: { type: "string" },
                  calories: { type: "number" }
                },
                required: ["time", "meal_type", "suggestion", "calories"]
              }
            }
          },
          required: ["meal_timing"]
        }
      });

      const updatedPlan = {
        ...nutritionPlan,
        meal_timing: response.meal_timing
      };

      await base44.auth.updateMe({
        selected_nutrition_plan_data: updatedPlan
      });

      queryClient.invalidateQueries(['user']);
      setShowSubstitution(false);
      setSubstitutionRequest("");
      
      window.location.reload();
    } catch (error) {
      console.error("Error substituting:", error);
      alert("Erro ao substituir alimento. Tente novamente.");
    } finally {
      setSubstituting(false);
    }
  };

  if (!hasNutritionPlan) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-12 text-center">
          <ChefHat className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold text-xl mb-2">
            Você ainda não tem um plano nutricional
          </h3>
          <p className="text-slate-400 mb-6">
            Configure seu plano personalizado através da aba "Explorar" ou refaça o onboarding
          </p>
          <Button
            onClick={() => window.location.href = '/page/Profile'}
            variant="outline"
            className="border-green-600 text-green-400 hover:bg-green-900/20"
          >
            Ir para Perfil
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 border-green-700/50">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-green-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-green-400" />
              </div>
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-white mb-1">
                  Seu Plano Nutricional Personalizado
                </h2>
                <p className="text-slate-300 text-sm md:text-base">
                  Criado especialmente para você com IA
                </p>
              </div>
            </div>
            <Button
              onClick={handleGeneratePDF}
              disabled={generatingPDF}
              className="bg-green-600 hover:bg-green-700 w-full md:w-auto"
            >
              {generatingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calorie Goal */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">🎯 Meta Diária</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <p className="text-5xl font-bold text-green-400">
              {Math.round(nutritionPlan.daily_calories)}
            </p>
            <p className="text-slate-400">calorias por dia</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-900/20 rounded-lg">
              <p className="text-blue-400 font-bold text-xl">
                {nutritionPlan.macros.protein_percentage}%
              </p>
              <p className="text-slate-400 text-xs">Proteínas</p>
              <p className="text-slate-500 text-xs">
                {Math.round(nutritionPlan.daily_calories * (nutritionPlan.macros.protein_percentage / 100) / 4)}g
              </p>
            </div>
            <div className="p-3 bg-orange-900/20 rounded-lg">
              <p className="text-orange-400 font-bold text-xl">
                {nutritionPlan.macros.carbs_percentage}%
              </p>
              <p className="text-slate-400 text-xs">Carboidratos</p>
              <p className="text-slate-500 text-xs">
                {Math.round(nutritionPlan.daily_calories * (nutritionPlan.macros.carbs_percentage / 100) / 4)}g
              </p>
            </div>
            <div className="p-3 bg-yellow-900/20 rounded-lg">
              <p className="text-yellow-400 font-bold text-xl">
                {nutritionPlan.macros.fat_percentage}%
              </p>
              <p className="text-slate-400 text-xs">Gorduras</p>
              <p className="text-slate-500 text-xs">
                {Math.round(nutritionPlan.daily_calories * (nutritionPlan.macros.fat_percentage / 100) / 9)}g
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {nutritionPlan.recommendations && nutritionPlan.recommendations.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">💡 Recomendações Personalizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {nutritionPlan.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Meal Timing */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-sm">🍽️ Seu Plano Alimentar</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSubstitution(!showSubstitution)}
              className="border-orange-600 text-orange-400 hover:bg-orange-900/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Substituir Alimento
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatePresence>
            {showSubstitution && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-orange-900/20 border border-orange-600/30 rounded-lg space-y-3"
              >
                <p className="text-orange-300 text-sm font-semibold">
                  🔄 Solicitar Substituição
                </p>
                <p className="text-slate-400 text-xs">
                  Descreva o que deseja substituir. Ex: "Substituir o frango do almoço por peixe" ou "Trocar banana por maçã no café"
                </p>
                <Textarea
                  value={substitutionRequest}
                  onChange={(e) => setSubstitutionRequest(e.target.value)}
                  placeholder="Descreva a substituição que deseja..."
                  className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowSubstitution(false);
                      setSubstitutionRequest("");
                    }}
                    className="flex-1 border-slate-700"
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubstitution}
                    disabled={substituting || !substitutionRequest.trim()}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    {substituting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Substituindo...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Substituir
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            {nutritionPlan.meal_timing.map((meal, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-all"
              >
                <div className="flex-shrink-0">
                  <p className="text-green-400 font-bold">{meal.time}</p>
                  <p className="text-slate-500 text-xs">{meal.meal_type}</p>
                </div>
                <div className="flex-1">
                  <p className="text-slate-300 text-sm">{meal.suggestion}</p>
                  <p className="text-blue-400 text-xs mt-1">{meal.calories} kcal</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Foods */}
      {nutritionPlan.recommended_foods && nutritionPlan.recommended_foods.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">✅ Alimentos Recomendados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {nutritionPlan.recommended_foods.map((food, idx) => (
                <Badge
                  key={idx}
                  className="bg-green-600/20 text-green-300 border-green-600/30 justify-start"
                >
                  {food}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Foods to Avoid */}
      {nutritionPlan.foods_to_avoid && nutritionPlan.foods_to_avoid.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">❌ Alimentos a Evitar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {nutritionPlan.foods_to_avoid.map((food, idx) => (
                <Badge
                  key={idx}
                  className="bg-red-600/20 text-red-300 border-red-600/30 justify-start"
                >
                  {food}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      {nutritionPlan.tips && nutritionPlan.tips.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">💡 Dicas de Nutrição</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {nutritionPlan.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                  <TrendingUp className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Hydration */}
      {nutritionPlan.hydration_goal && (
        <Card className="bg-blue-900/20 border-blue-800/50">
          <CardContent className="p-4 flex items-center gap-3">
            <span className="text-3xl">💧</span>
            <div>
              <p className="text-blue-400 font-semibold text-sm">Meta de Hidratação</p>
              <p className="text-slate-300 text-sm">{nutritionPlan.hydration_goal}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}