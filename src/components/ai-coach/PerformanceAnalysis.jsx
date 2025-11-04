
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, Loader2, AlertCircle, CheckCircle, Zap, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function PerformanceAnalysis({ user, workoutLogs, currentWorkout }) {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      // Preparar dados para análise
      const recentLogs = workoutLogs.slice(0, 10);
      
      // Extrair dados de progressão de carga
      const weightProgressionData = recentLogs.flatMap(log => 
        (log.exercises_completed || []).map(ex => ({
          data: log.date,
          exercicio: ex.exercise_name,
          cargas: ex.sets_completed?.map(s => s.weight_used).filter(w => w > 0) || []
        }))
      ).filter(ex => ex.cargas.length > 0);

      const logsData = recentLogs.map(log => ({
        data: log.date,
        treino: log.workout_title,
        duracao: log.duration_minutes,
        calorias: log.calories_burned,
        dificuldade: log.difficulty_rating,
        exercicios_com_carga: (log.exercises_completed || []).length
      }));

      const prompt = `Você é um treinador experiente analisando o desempenho de um atleta.

**Perfil do Atleta:**
- Objetivo: ${user?.fitness_goal === 'lose_weight' ? 'Emagrecer' : user?.fitness_goal === 'gain_muscle' ? 'Ganhar massa muscular' : 'Manter forma'}
- Nível: ${user?.fitness_level === 'beginner' ? 'Iniciante' : user?.fitness_level === 'intermediate' ? 'Intermediário' : 'Avançado'}
- Meta semanal: ${user?.weekly_goal || 3} treinos

**Treino Atual:**
${currentWorkout ? `- ${currentWorkout.title} (${currentWorkout.days?.length} dias)` : 'Nenhum treino selecionado'}

**Histórico Recent (últimos 10 treinos):**
${JSON.stringify(logsData, null, 2)}

**Progressão de Cargas (detalhado):**
${weightProgressionData.length > 0 ? JSON.stringify(weightProgressionData, null, 2) : 'Nenhum dado de carga registrado'}

**Análise Solicitada:**
Forneça uma análise detalhada em formato JSON com:

1. **pontos_fortes**: Lista de 3 pontos positivos observados (considere evolução de carga se houver dados)
2. **areas_melhoria**: Lista de 3 áreas que precisam atenção
3. **sugestoes_treino**: Lista de 3-4 sugestões específicas para melhorar:
   - Se houver dados de carga, inclua sugestões ESPECÍFICAS de progressão (ex: "Aumente 2,5kg no supino reto no próximo treino")
   - Se não houver dados de carga, incentive o registro e sugira cargas iniciais apropriadas
   - Inclua mudanças de exercícios, volume, frequência se relevante
4. **motivacao**: Mensagem motivacional personalizada
5. **proximos_passos**: 3 ações concretas para os próximos treinos (seja específico com números e cargas quando possível)`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            pontos_fortes: { type: "array", items: { type: "string" } },
            areas_melhoria: { type: "array", items: { type: "string" } },
            sugestoes_treino: { type: "array", items: { type: "string" } },
            motivacao: { type: "string" },
            proximos_passos: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAnalysis(response);
    } catch (error) {
      // Silenciar erros de abort completamente
      if (!error.message?.includes('abort')) {
        console.error("Error analyzing performance:", error);
        alert("Erro ao analisar desempenho. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (workoutLogs.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">Nenhum treino registrado ainda</p>
          <p className="text-slate-500 text-sm">
            Complete alguns treinos para receber análises personalizadas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Análise de Desempenho
            </CardTitle>
            <Button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Gerar Análise
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="bg-blue-900/20 border-blue-700/50">
            <AlertCircle className="w-4 h-4 text-blue-400" />
            <AlertDescription className="text-blue-300">
              A IA irá analisar seus últimos {Math.min(workoutLogs.length, 10)} treinos e fornecer 
              insights personalizados sobre seu desempenho e sugestões de melhoria.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Pontos Fortes */}
          <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 border-green-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Pontos Fortes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.pontos_fortes?.map((ponto, index) => (
                  <li key={index} className="flex items-start gap-2 text-green-300">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>{ponto}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Áreas de Melhoria */}
          <Card className="bg-gradient-to-br from-orange-900/30 to-yellow-900/20 border-orange-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-400" />
                Áreas de Melhoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.areas_melhoria?.map((area, index) => (
                  <li key={index} className="flex items-start gap-2 text-orange-300">
                    <span className="text-orange-400 mt-1">→</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Sugestões de Treino */}
          <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/20 border-blue-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-400" />
                Sugestões de Treino
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {analysis.sugestoes_treino?.map((sugestao, index) => (
                  <li key={index} className="bg-slate-800/50 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">{index + 1}.</span>
                      <span className="text-slate-300">{sugestao}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Próximos Passos */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Próximos Passos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.proximos_passos?.map((passo, index) => (
                  <li key={index} className="flex items-start gap-2 text-slate-300">
                    <span className="text-purple-400 font-bold">{index + 1}.</span>
                    <span>{passo}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Motivação */}
          <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/30 border-purple-700/50">
            <CardContent className="p-6">
              <p className="text-white text-center font-medium italic">
                "{analysis.motivacao}"
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
