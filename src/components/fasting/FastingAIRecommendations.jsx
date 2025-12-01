import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  TrendingUp, 
  Clock, 
  Utensils, 
  ChevronRight, 
  Loader2,
  Brain,
  Target,
  Calendar,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FastingAIRecommendations({ user, fastingLogs = [], mealLogs = [], settings }) {
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  const generateRecommendations = async () => {
    setIsLoading(true);
    
    try {
      // Prepare user context
      const completedFasts = fastingLogs.filter(f => f.status === 'completed');
      const recentFasts = completedFasts.slice(0, 10);
      const brokenFasts = fastingLogs.filter(f => f.status === 'broken').length;
      
      // Analyze fasting patterns
      const fastingTypes = recentFasts.reduce((acc, f) => {
        acc[f.fasting_type] = (acc[f.fasting_type] || 0) + 1;
        return acc;
      }, {});
      
      const avgDuration = recentFasts.length > 0 
        ? recentFasts.reduce((sum, f) => sum + (f.duration_minutes || 0), 0) / recentFasts.length / 60
        : 0;

      // Analyze meal patterns
      const recentMeals = mealLogs.slice(0, 20);
      const mealTimes = recentMeals.map(m => {
        const date = new Date(m.created_date);
        return date.getHours();
      });
      
      const avgMealTime = mealTimes.length > 0 
        ? Math.round(mealTimes.reduce((a, b) => a + b, 0) / mealTimes.length)
        : 12;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um nutricionista especialista em jejum intermitente. Analise os dados do usuário e forneça recomendações personalizadas.

DADOS DO USUÁRIO:
- Nome: ${user?.nome_completo || 'Usuário'}
- Objetivo: ${user?.fitness_goal || 'não definido'}
- Meta calórica diária: ${user?.daily_calorie_goal || 2000} kcal
- Macros: ${user?.macro_protein_percentage || 30}% proteína, ${user?.macro_carbs_percentage || 40}% carboidratos, ${user?.macro_fat_percentage || 30}% gordura

HISTÓRICO DE JEJUM:
- Total de jejuns completados: ${completedFasts.length}
- Jejuns quebrados: ${brokenFasts}
- Taxa de sucesso: ${completedFasts.length > 0 ? Math.round((completedFasts.length / (completedFasts.length + brokenFasts)) * 100) : 0}%
- Tipos de jejum mais usados: ${JSON.stringify(fastingTypes)}
- Duração média dos jejuns: ${avgDuration.toFixed(1)} horas
- Tipo preferido atual: ${settings?.preferred_fasting_type || '16/8'}

PADRÕES DE ALIMENTAÇÃO:
- Horário médio das refeições: ${avgMealTime}h
- Refeições recentes analisadas: ${recentMeals.length}

FORNEÇA RECOMENDAÇÕES EM JSON com:
1. recommended_fasting_type: O tipo de jejum ideal para o próximo passo do usuário (14/10, 16/8, 18/6, 20/4, 24h)
2. fasting_type_reason: Explicação de 2-3 linhas do porquê esse tipo é recomendado
3. ideal_start_time: Horário ideal para INICIAR o jejum (formato HH:MM)
4. ideal_end_time: Horário ideal para ENCERRAR o jejum (formato HH:MM)
5. schedule_reason: Explicação de 2-3 linhas sobre os horários recomendados
6. post_fast_meal: Objeto com sugestão de primeira refeição pós-jejum contendo:
   - meal_name: Nome da refeição
   - foods: Array de 3-5 alimentos sugeridos
   - calories: Calorias aproximadas
   - protein: Proteínas em gramas
   - carbs: Carboidratos em gramas
   - fat: Gorduras em gramas
   - tips: Dica de 1-2 linhas sobre como quebrar o jejum
7. weekly_plan: Array de 3 dicas curtas (1 linha cada) para a semana
8. motivation: Frase motivacional personalizada (1-2 linhas)

Seja específico e prático. Use português brasileiro.`,
        response_json_schema: {
          type: "object",
          properties: {
            recommended_fasting_type: { type: "string" },
            fasting_type_reason: { type: "string" },
            ideal_start_time: { type: "string" },
            ideal_end_time: { type: "string" },
            schedule_reason: { type: "string" },
            post_fast_meal: {
              type: "object",
              properties: {
                meal_name: { type: "string" },
                foods: { type: "array", items: { type: "string" } },
                calories: { type: "number" },
                protein: { type: "number" },
                carbs: { type: "number" },
                fat: { type: "number" },
                tips: { type: "string" }
              }
            },
            weekly_plan: { type: "array", items: { type: "string" } },
            motivation: { type: "string" }
          }
        }
      });

      setRecommendations(result);
    } catch (error) {
      console.error("Error generating recommendations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!recommendations && !isLoading) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-700/50">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">Recomendações da IA</h3>
          <p className="text-slate-400 text-sm mb-4">
            Receba sugestões personalizadas de jejum, horários ideais e planos de refeição baseados no seu histórico.
          </p>
          <Button
            onClick={generateRecommendations}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Gerar Recomendações
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-700/50">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-12 h-12 text-purple-400 mx-auto animate-spin mb-4" />
          <p className="text-slate-300">Analisando seu histórico e gerando recomendações...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          Recomendações da IA
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={generateRecommendations}
          className="text-purple-400 hover:text-purple-300"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Atualizar
        </Button>
      </div>

      {/* Motivation */}
      {recommendations.motivation && (
        <Card className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-700/50">
          <CardContent className="p-4">
            <p className="text-purple-300 text-sm italic">💪 {recommendations.motivation}</p>
          </CardContent>
        </Card>
      )}

      {/* Recommended Fasting Type */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Target className="w-5 h-5 text-green-400" />
            Tipo de Jejum Recomendado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-3">
            <div className="text-4xl font-bold text-green-400">
              {recommendations.recommended_fasting_type}
            </div>
            <div className="flex-1">
              <p className="text-slate-300 text-sm">{recommendations.fasting_type_reason}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ideal Schedule */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Horários Ideais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="text-center p-3 bg-slate-800/50 rounded-lg">
              <p className="text-slate-400 text-xs mb-1">Iniciar Jejum</p>
              <p className="text-2xl font-bold text-blue-400">{recommendations.ideal_start_time}</p>
            </div>
            <div className="text-center p-3 bg-slate-800/50 rounded-lg">
              <p className="text-slate-400 text-xs mb-1">Encerrar Jejum</p>
              <p className="text-2xl font-bold text-green-400">{recommendations.ideal_end_time}</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm">{recommendations.schedule_reason}</p>
        </CardContent>
      </Card>

      {/* Post-Fast Meal */}
      {recommendations.post_fast_meal && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Utensils className="w-5 h-5 text-orange-400" />
              Refeição Pós-Jejum Sugerida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <p className="text-white font-medium">{recommendations.post_fast_meal.meal_name}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {recommendations.post_fast_meal.foods?.map((food, idx) => (
                  <span key={idx} className="px-2 py-1 bg-slate-800 rounded-full text-slate-300 text-xs">
                    {food}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="text-center p-2 bg-slate-800/50 rounded">
                <p className="text-green-400 font-bold text-sm">{recommendations.post_fast_meal.calories}</p>
                <p className="text-slate-500 text-xs">kcal</p>
              </div>
              <div className="text-center p-2 bg-slate-800/50 rounded">
                <p className="text-blue-400 font-bold text-sm">{recommendations.post_fast_meal.protein}g</p>
                <p className="text-slate-500 text-xs">Prot</p>
              </div>
              <div className="text-center p-2 bg-slate-800/50 rounded">
                <p className="text-orange-400 font-bold text-sm">{recommendations.post_fast_meal.carbs}g</p>
                <p className="text-slate-500 text-xs">Carbs</p>
              </div>
              <div className="text-center p-2 bg-slate-800/50 rounded">
                <p className="text-yellow-400 font-bold text-sm">{recommendations.post_fast_meal.fat}g</p>
                <p className="text-slate-500 text-xs">Gord</p>
              </div>
            </div>

            {recommendations.post_fast_meal.tips && (
              <p className="text-slate-400 text-sm p-2 bg-green-900/20 rounded-lg border border-green-800/30">
                💡 {recommendations.post_fast_meal.tips}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Weekly Plan */}
      {recommendations.weekly_plan && recommendations.weekly_plan.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-yellow-400" />
              Dicas para a Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.weekly_plan.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-yellow-400 font-bold">{idx + 1}.</span>
                  <span className="text-slate-300 text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}