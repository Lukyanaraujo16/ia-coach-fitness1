import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb, Loader2, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

export default function PersonalizedAdvice({ workoutLogs, progressEntries, user }) {
  const [question, setQuestion] = useState("");
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);

  const quickQuestions = [
    "Como melhorar minha postura no supino?",
    "Quando devo aumentar a carga?",
    "Quanto tempo de descanso entre séries?",
    "Como evitar platô no treino?",
    "Dicas para ganhar massa muscular",
  ];

  const getAdvice = async (customQuestion = null) => {
    const questionToAsk = customQuestion || question;
    if (!questionToAsk.trim()) return;

    setLoading(true);
    try {
      // Preparar contexto do usuário
      const recentLogs = workoutLogs.slice(0, 10);
      const recentProgress = progressEntries.slice(0, 5);

      const context = {
        user: {
          name: user.full_name,
          goal: user.fitness_goal,
          level: user.fitness_level,
          current_weight: user.current_weight,
          weight_goal: user.weight_goal,
          training_location: user.training_location,
        },
        recent_workouts: recentLogs.map(log => ({
          title: log.workout_title,
          exercises: log.exercises_completed?.map(ex => ({
            name: ex.exercise_name,
            max_weight: ex.max_weight,
          })) || [],
        })),
        progress: recentProgress.map(p => ({
          weight: p.weight,
          notes: p.notes,
        })),
      };

      const prompt = `Você é um personal trainer experiente e certificado respondendo a uma dúvida do seu aluno.

CONTEXTO DO ALUNO:
${JSON.stringify(context, null, 2)}

PERGUNTA DO ALUNO:
"${questionToAsk}"

Forneça um conselho DETALHADO e PRÁTICO que:
1. Seja específico para o nível e objetivo do aluno
2. Inclua passos práticos e acionáveis
3. Considere o histórico recente de treinos
4. Use linguagem clara e acessível
5. Seja motivacional mas realista

Estruture sua resposta em:
- Resposta Direta (2-3 frases)
- Explicação Técnica (como e porquê)
- Passos Práticos (lista numerada)
- Dica Extra (bonus tip)`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            direct_answer: {
              type: "string",
              description: "Resposta direta e concisa"
            },
            technical_explanation: {
              type: "string",
              description: "Explicação técnica detalhada"
            },
            practical_steps: {
              type: "array",
              items: { type: "string" },
              description: "Passos práticos para implementar"
            },
            bonus_tip: {
              type: "string",
              description: "Dica extra valiosa"
            },
            related_exercises: {
              type: "array",
              items: { type: "string" },
              description: "Exercícios relacionados ao tópico"
            }
          }
        }
      });

      setAdvice({ question: questionToAsk, ...response });
      setQuestion("");
    } catch (error) {
      console.error("Error getting advice:", error);
      alert("Erro ao obter conselho. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Ask Question Card */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            Pergunte ao seu Treinador
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Ex: Como melhorar minha postura no agachamento?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
          />
          <Button
            onClick={() => getAdvice()}
            disabled={loading || !question.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Lightbulb className="w-4 h-4 mr-2" />
                Obter Conselho Personalizado
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Questions */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-sm">⚡ Perguntas Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => getAdvice(q)}
                disabled={loading}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
              >
                {q}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advice Display */}
      {advice && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Question Asked */}
          <Card className="bg-blue-900/20 border-blue-700/50">
            <CardContent className="p-4">
              <p className="text-blue-400 text-sm font-semibold mb-1">Sua Pergunta:</p>
              <p className="text-white">{advice.question}</p>
            </CardContent>
          </Card>

          {/* Direct Answer */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base">💡 Resposta Direta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 leading-relaxed">
                {advice.direct_answer}
              </p>
            </CardContent>
          </Card>

          {/* Technical Explanation */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base">📚 Explicação Técnica</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 leading-relaxed">
                {advice.technical_explanation}
              </p>
            </CardContent>
          </Card>

          {/* Practical Steps */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base">✅ Passos Práticos</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {advice.practical_steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-400 text-xs font-bold">{idx + 1}</span>
                    </div>
                    <p className="text-slate-300 text-sm flex-1">{step}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Bonus Tip */}
          <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-700/50">
            <CardHeader>
              <CardTitle className="text-white text-base">🎁 Dica Extra</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 leading-relaxed">
                {advice.bonus_tip}
              </p>
            </CardContent>
          </Card>

          {/* Related Exercises */}
          {advice.related_exercises && advice.related_exercises.length > 0 && (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-base">🏋️ Exercícios Relacionados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {advice.related_exercises.map((exercise, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1.5 bg-slate-800 rounded-full text-slate-300 text-sm"
                    >
                      {exercise}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}