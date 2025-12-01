import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  ChevronRight,
  Lightbulb,
  Clock,
  TrendingUp,
  AlertCircle,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FastingAIPreCheck({ 
  user, 
  fastingLogs = [], 
  mealLogs = [], 
  settings,
  selectedType,
  onConfirm,
  onCancel 
}) {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRead, setHasRead] = useState(false);

  useEffect(() => {
    generatePreCheckAnalysis();
  }, []);

  const generatePreCheckAnalysis = async () => {
    setIsLoading(true);
    
    try {
      // Prepare context
      const completedFasts = fastingLogs.filter(f => f.status === 'completed');
      const brokenFasts = fastingLogs.filter(f => f.status === 'broken');
      const recentFasts = fastingLogs.slice(0, 10);
      
      // Last fast info
      const lastFast = fastingLogs[0];
      const lastFastDate = lastFast ? new Date(lastFast.start_time) : null;
      const hoursSinceLastFast = lastFastDate 
        ? Math.floor((new Date() - lastFastDate) / (1000 * 60 * 60))
        : null;

      // Recent meals (last 24h)
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const recentMeals = mealLogs.filter(m => new Date(m.created_date) >= last24h);
      const lastMeal = mealLogs[0];
      const lastMealTime = lastMeal ? new Date(lastMeal.created_date) : null;
      const hoursSinceLastMeal = lastMealTime 
        ? Math.round((now - lastMealTime) / (1000 * 60 * 60) * 10) / 10
        : null;

      // Analyze patterns
      const avgDuration = completedFasts.length > 0 
        ? completedFasts.reduce((sum, f) => sum + (f.duration_minutes || 0), 0) / completedFasts.length / 60
        : 0;
      
      const successRate = fastingLogs.length > 0 
        ? Math.round((completedFasts.length / (completedFasts.length + brokenFasts.length)) * 100)
        : 100;

      // Check for concerning patterns
      const consecutiveBroken = [];
      for (const fast of recentFasts) {
        if (fast.status === 'broken') consecutiveBroken.push(fast);
        else break;
      }

      // Current time analysis
      const currentHour = now.getHours();
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um nutricionista especializado em jejum intermitente. O usuário está prestes a iniciar um jejum. Analise o contexto e forneça orientações ANTES dele começar.

DADOS DO USUÁRIO:
- Nome: ${user?.nome_completo || 'Usuário'}
- Objetivo: ${user?.fitness_goal || 'não definido'}
- Nível de experiência com jejum: ${completedFasts.length === 0 ? 'Iniciante (primeiro jejum)' : completedFasts.length < 5 ? 'Iniciante' : completedFasts.length < 20 ? 'Intermediário' : 'Experiente'}

JEJUM QUE VAI INICIAR:
- Tipo: ${selectedType}
- Horário atual: ${currentHour}h

HISTÓRICO DE JEJUM:
- Total de jejuns completados: ${completedFasts.length}
- Jejuns quebrados: ${brokenFasts.length}
- Taxa de sucesso: ${successRate}%
- Duração média dos jejuns completados: ${avgDuration.toFixed(1)} horas
- Jejuns quebrados consecutivos recentes: ${consecutiveBroken.length}
- Horas desde último jejum: ${hoursSinceLastFast || 'Nunca fez jejum'}
- Último jejum foi: ${lastFast?.status || 'N/A'}

ALIMENTAÇÃO RECENTE:
- Horas desde última refeição: ${hoursSinceLastMeal || 'Sem registro'}
- Refeições nas últimas 24h: ${recentMeals.length}
- Última refeição: ${lastMeal?.meal_type || 'Sem registro'}

ANALISE E RESPONDA:
1. Se há algum ALERTA ou preocupação que o usuário precisa saber antes de iniciar
2. Uma DICA personalizada para este jejum específico
3. Se o horário atual é adequado ou se há uma sugestão melhor
4. Uma mensagem de ENCORAJAMENTO

IMPORTANTE:
- Se for o primeiro jejum, seja acolhedor e educativo
- Se teve jejuns quebrados recentes, seja empático e sugira ajustes
- Se está indo bem, parabenize e motive
- Seja conciso e prático
- Use português brasileiro`,
        response_json_schema: {
          type: "object",
          properties: {
            has_alert: { 
              type: "boolean", 
              description: "Se há algum alerta importante" 
            },
            alert_message: { 
              type: "string", 
              description: "Mensagem de alerta (se houver)" 
            },
            alert_type: {
              type: "string",
              enum: ["warning", "info", "success"],
              description: "Tipo do alerta"
            },
            personalized_tip: { 
              type: "string", 
              description: "Dica personalizada para este jejum (2-3 linhas)" 
            },
            timing_analysis: {
              type: "string",
              description: "Análise sobre o horário escolhido (1-2 linhas)"
            },
            is_good_timing: {
              type: "boolean",
              description: "Se o horário é adequado"
            },
            suggested_end_time: {
              type: "string",
              description: "Horário sugerido para término (HH:MM)"
            },
            encouragement: { 
              type: "string", 
              description: "Mensagem de encorajamento personalizada (1-2 linhas)" 
            },
            quick_tips: {
              type: "array",
              items: { type: "string" },
              description: "3 dicas rápidas para o jejum"
            }
          }
        }
      });

      setAnalysis(result);
    } catch (error) {
      console.error("Error generating pre-check:", error);
      // Fallback - allow to continue even if AI fails
      setAnalysis({
        has_alert: false,
        personalized_tip: "Mantenha-se hidratado durante o jejum. Água, chá e café sem açúcar são permitidos.",
        timing_analysis: "Bom momento para iniciar seu jejum!",
        is_good_timing: true,
        encouragement: "Você está no caminho certo! Cada jejum é um passo para seus objetivos. 💪",
        quick_tips: [
          "Beba bastante água",
          "Mantenha-se ocupado",
          "Durma bem"
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!hasRead) {
      setHasRead(true);
      return;
    }
    onConfirm();
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <Card className="bg-slate-900 border-slate-700 w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Analisando seu histórico...</h3>
            <p className="text-slate-400 text-sm">A IA está preparando orientações personalizadas para seu jejum</p>
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto mt-4" />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <Card className="bg-slate-900 border-slate-700 w-full max-w-md my-4">
        <CardContent className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-purple-600/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Análise da IA</h3>
                <p className="text-slate-400 text-xs">Antes de iniciar seu jejum {selectedType}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Alert if exists */}
          {analysis?.has_alert && analysis?.alert_message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg border ${
                analysis.alert_type === 'warning' 
                  ? 'bg-orange-900/30 border-orange-700/50' 
                  : analysis.alert_type === 'success'
                  ? 'bg-green-900/30 border-green-700/50'
                  : 'bg-blue-900/30 border-blue-700/50'
              }`}
            >
              <div className="flex items-start gap-2">
                {analysis.alert_type === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                ) : analysis.alert_type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                )}
                <p className={`text-sm ${
                  analysis.alert_type === 'warning' 
                    ? 'text-orange-300' 
                    : analysis.alert_type === 'success'
                    ? 'text-green-300'
                    : 'text-blue-300'
                }`}>
                  {analysis.alert_message}
                </p>
              </div>
            </motion.div>
          )}

          {/* Timing Analysis */}
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className={`w-4 h-4 ${analysis?.is_good_timing ? 'text-green-400' : 'text-orange-400'}`} />
              <span className="text-white text-sm font-medium">Horário</span>
              {analysis?.is_good_timing && (
                <span className="text-green-400 text-xs bg-green-900/30 px-2 py-0.5 rounded-full">Adequado</span>
              )}
            </div>
            <p className="text-slate-300 text-sm">{analysis?.timing_analysis}</p>
            {analysis?.suggested_end_time && (
              <p className="text-blue-400 text-xs mt-2">
                ⏰ Término previsto: {analysis.suggested_end_time}
              </p>
            )}
          </div>

          {/* Personalized Tip */}
          <div className="p-3 bg-purple-900/20 border border-purple-700/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              <span className="text-white text-sm font-medium">Dica Personalizada</span>
            </div>
            <p className="text-slate-300 text-sm">{analysis?.personalized_tip}</p>
          </div>

          {/* Quick Tips */}
          {analysis?.quick_tips && analysis.quick_tips.length > 0 && (
            <div className="space-y-2">
              <p className="text-slate-400 text-xs font-medium uppercase">Lembre-se:</p>
              <div className="flex flex-wrap gap-2">
                {analysis.quick_tips.map((tip, idx) => (
                  <span 
                    key={idx}
                    className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-full"
                  >
                    {tip}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Encouragement */}
          <div className="p-3 bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-700/30 rounded-lg">
            <p className="text-green-400 text-sm font-medium text-center">
              {analysis?.encouragement}
            </p>
          </div>

          {/* Confirmation */}
          <div className="space-y-3 pt-2">
            {!hasRead ? (
              <Button
                onClick={handleConfirm}
                className="w-full bg-purple-600 hover:bg-purple-700 h-12"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Li e entendi as orientações
              </Button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <p className="text-center text-slate-400 text-sm">
                  Pronto para começar seu jejum?
                </p>
                <Button
                  onClick={handleConfirm}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 h-12"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Iniciar Jejum Agora
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}
            
            <Button
              variant="ghost"
              onClick={onCancel}
              className="w-full text-slate-400 hover:text-white"
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}