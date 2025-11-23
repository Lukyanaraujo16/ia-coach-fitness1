import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Loader2, Calendar, Zap, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function WeeklyInsights({ workoutLogs, progressEntries, user }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState(null);
  const queryClient = useQueryClient();

  // Buscar todas as análises salvas
  const { data: allAnalyses = [] } = useQuery({
    queryKey: ['weekly-analyses', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const analyses = await base44.entities.WeeklyAnalysis?.list('-created_date');
      return analyses.filter(a => a.created_by === user.email);
    },
    enabled: !!user?.email,
  });

  // Carregar análise mais recente ou selecionada
  useEffect(() => {
    if (allAnalyses.length > 0) {
      const targetAnalysis = selectedAnalysisId 
        ? allAnalyses.find(a => a.id === selectedAnalysisId)
        : allAnalyses[0];
      
      if (targetAnalysis?.analysis_data) {
        setInsights(targetAnalysis.analysis_data);
      }
    }
  }, [allAnalyses, selectedAnalysisId]);

  // Mutation para salvar análise
  const saveAnalysisMutation = useMutation({
    mutationFn: (data) => base44.entities.WeeklyAnalysis?.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['weekly-analysis']);
    },
  });

  const generateInsights = async () => {
    setLoading(true);
    try {
      // Filtrar últimos 7 dias
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const recentLogs = workoutLogs.filter(log => 
        new Date(log.date) >= weekAgo
      );

      const recentProgress = progressEntries.filter(entry => 
        new Date(entry.date) >= weekAgo
      );

      // Preparar contexto para a IA
      const context = {
        user: {
          name: user.nome_completo,
          goal: user.fitness_goal,
          level: user.fitness_level,
          weekly_goal: user.weekly_goal,
          current_weight: user.current_weight,
          weight_goal: user.weight_goal,
        },
        workouts_this_week: recentLogs.length,
        workouts_data: recentLogs.map(log => ({
          title: log.workout_title,
          date: log.date,
          duration: log.duration_minutes,
          exercises: log.exercises_completed?.map(ex => ({
            name: ex.exercise_name,
            sets: ex.sets_completed,
            max_weight: ex.max_weight,
          })) || [],
        })),
        progress_data: recentProgress.map(p => ({
          date: p.date,
          weight: p.weight,
          mood: p.mood,
          notes: p.notes,
        })),
      };

      const prompt = `Você é um treinador fitness experiente analisando o progresso semanal de um aluno.

CONTEXTO DO ALUNO:
${JSON.stringify(context, null, 2)}

Analise o desempenho desta semana e forneça insights detalhados sobre:

1. **Consistência**: O aluno atingiu a meta semanal de ${user.weekly_goal} treinos?
2. **Progressão de Carga**: Houve aumento nas cargas utilizadas?
3. **Pontos Fortes**: O que o aluno está fazendo bem?
4. **Áreas de Melhoria**: Onde pode melhorar?
5. **Tendências**: Padrões observados no comportamento de treino
6. **Recomendações Específicas**: 3 ações práticas para a próxima semana

Seja específico, use dados concretos e seja motivacional mas realista.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            consistency_score: {
              type: "number",
              description: "Score de 0-10 de consistência"
            },
            consistency_analysis: {
              type: "string",
              description: "Análise da consistência"
            },
            load_progression: {
              type: "string",
              description: "Análise de progressão de carga"
            },
            strengths: {
              type: "array",
              items: { type: "string" },
              description: "Pontos fortes identificados"
            },
            improvements: {
              type: "array",
              items: { type: "string" },
              description: "Áreas para melhorar"
            },
            trends: {
              type: "string",
              description: "Tendências observadas"
            },
            recommendations: {
              type: "array",
              items: { type: "string" },
              description: "Recomendações para próxima semana"
            },
            motivational_message: {
              type: "string",
              description: "Mensagem motivacional personalizada"
            }
          }
        }
      });

      setInsights(response);
      
      // Salvar análise
      try {
        await saveAnalysisMutation.mutateAsync({
          analysis_data: response,
          week_start: weekAgo.toISOString().split('T')[0],
          workouts_count: recentLogs.length,
        });
      } catch (error) {
        console.error("Erro ao salvar análise:", error);
      }
    } catch (error) {
      console.error("Error generating insights:", error);
      alert("Erro ao gerar insights. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!insights) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-12 text-center">
          <TrendingUp className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            Análise Semanal Inteligente
          </h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Deixe a IA analisar seus treinos da última semana e receber insights personalizados sobre seu progresso.
          </p>
          <Button
            onClick={generateInsights}
            disabled={loading || workoutLogs.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Gerar Análise Semanal
              </>
            )}
          </Button>
          {workoutLogs.length === 0 && (
            <p className="text-slate-500 text-sm mt-4">
              Complete alguns treinos para receber análises personalizadas
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Histórico de Análises */}
      {allAnalyses.length > 1 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">📊 Histórico de Análises</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allAnalyses.map((analysis) => (
                <button
                  key={analysis.id}
                  onClick={() => setSelectedAnalysisId(analysis.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedAnalysisId === analysis.id || (!selectedAnalysisId && analysis.id === allAnalyses[0].id)
                      ? 'bg-blue-900/30 border-blue-700 shadow-md'
                      : 'bg-slate-800/30 border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium text-sm">
                        Semana de {new Date(analysis.week_start).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {analysis.workouts_count} treinos • Criada em {new Date(analysis.created_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {(selectedAnalysisId === analysis.id || (!selectedAnalysisId && analysis.id === allAnalyses[0].id)) && (
                      <div className="w-2 h-2 bg-blue-400 rounded-full" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consistency Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Score de Consistência</h3>
              <div className="text-4xl font-bold text-blue-400">
                {insights.consistency_score}/10
              </div>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-1000"
                style={{ width: `${insights.consistency_score * 10}%` }}
              />
            </div>
            <p className="text-slate-300 text-sm mt-3">
              {insights.consistency_analysis}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Load Progression */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Progressão de Carga
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-300 leading-relaxed">
            {insights.load_progression}
          </p>
        </CardContent>
      </Card>

      {/* Strengths & Improvements */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">✅ Pontos Fortes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">📈 Áreas de Melhoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.improvements.map((improvement, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                  <span className="text-orange-400 mt-0.5">•</span>
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Trends */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Tendências Observadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-300 leading-relaxed">
            {insights.trends}
          </p>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-700/50">
        <CardHeader>
          <CardTitle className="text-white">🎯 Recomendações para Próxima Semana</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                <div className="w-6 h-6 bg-purple-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-400 text-xs font-bold">{idx + 1}</span>
                </div>
                <p className="text-slate-300 text-sm flex-1">{rec}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Motivational Message */}
      <Card className="bg-gradient-to-r from-green-900/30 to-blue-900/30 border-green-700/50">
        <CardContent className="p-6 text-center">
          <p className="text-green-400 font-semibold text-lg mb-2">
            💪 Mensagem do seu Treinador
          </p>
          <p className="text-white leading-relaxed">
            {insights.motivational_message}
          </p>
        </CardContent>
      </Card>

      {/* Regenerate Button */}
      <Button
        onClick={generateInsights}
        disabled={loading}
        variant="outline"
        className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Regenerando...
          </>
        ) : (
          "Atualizar Análise"
        )}
      </Button>
    </div>
  );
}