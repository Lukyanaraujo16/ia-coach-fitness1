import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Lightbulb, X, Loader2, Send, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export default function AICoachAssistant({ exercise, user, isResting, previousLogs = [] }) {
  const [showTip, setShowTip] = useState(false);
  const [tip, setTip] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Análise proativa ao começar exercício
  useEffect(() => {
    if (exercise && !hasAnalyzed && previousLogs.length > 0) {
      analyzeAndSuggest();
      setHasAnalyzed(true);
    }
  }, [exercise?.exercise_name]);

  const analyzeAndSuggest = async () => {
    setIsLoading(true);
    setShowTip(true);
    
    try {
      // Buscar histórico deste exercício
      const exerciseHistory = previousLogs
        .filter(log => log.exercises_completed?.some(ex => ex.exercise_name === exercise.exercise_name))
        .slice(0, 5);

      const historyText = exerciseHistory.length > 0
        ? exerciseHistory.map(log => {
            const ex = log.exercises_completed.find(e => e.exercise_name === exercise.exercise_name);
            return `${log.date}: ${ex.sets_completed} séries, carga máxima ${ex.max_weight}kg`;
          }).join('\n')
        : 'Primeira vez fazendo este exercício';

      const prompt = `Você é um treinador pessoal experiente. Analise o histórico do usuário e dê uma dica PROATIVA.

Exercício Atual: ${exercise.exercise_name}
Nível: ${user.fitness_level}
Objetivo: ${user.fitness_goal}

Histórico recente deste exercício:
${historyText}

${exercise.notes ? `Observações: ${exercise.notes}` : ''}

${exerciseHistory.length > 0 
  ? 'Com base no histórico, dê UMA dica para melhorar performance OU alertar sobre progressão de carga OU corrigir execução.'
  : 'Como é a primeira vez, dê UMA dica essencial de execução e segurança.'}

Máximo 3 linhas, 1 emoji. Seja específico e acionável.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      setTip(response);
    } catch (error) {
      console.error('Erro ao analisar:', error);
      setTip('💪 Foque na execução correta! Qualidade > quantidade.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTip = async () => {
    setIsLoading(true);
    setShowTip(true);
    
    try {
      const prompt = `Você é um treinador pessoal experiente. O usuário está fazendo: ${exercise.exercise_name}

${exercise.notes ? `Observações: ${exercise.notes}` : ''}

Nível: ${user.fitness_level}
Objetivo: ${user.fitness_goal}

Dê UMA dica específica e prática sobre execução, erro comum a evitar ou como sentir o músculo.

Máximo 3 linhas, 1 emoji.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      setTip(response);
    } catch (error) {
      console.error('Erro ao gerar dica:', error);
      setTip('💡 Mantenha o foco na forma correta do movimento e controle a respiração!');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput;
    setChatInput('');
    setIsLoading(true);

    try {
      const prompt = `Você é um treinador pessoal respondendo durante o treino.

Exercício atual: ${exercise.exercise_name}
Usuário: ${user.nome_completo}
Nível: ${user.fitness_level}

Pergunta/Comentário: "${userMessage}"

Responda de forma BREVE e PRÁTICA (máximo 2-3 linhas). Se for dúvida técnica, seja específico. Se for motivacional, seja encorajador.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      setTip(response);
      setShowTip(true);
      setShowChat(false);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setTip('❌ Erro ao processar. Tente novamente!');
      setShowTip(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botões Flutuantes */}
      {!showTip && !showChat && !isResting && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed bottom-24 right-4 z-40 flex flex-col gap-3"
        >
          <Button
            onClick={() => setShowChat(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-900/50"
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </Button>
          <Button
            onClick={getTip}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-900/50"
          >
            <Sparkles className="w-6 h-6 text-white" />
          </Button>
        </motion.div>
      )}

      {/* Card de Dica */}
      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-4 right-4 z-40"
          >
            <Card className="bg-gradient-to-br from-purple-900/95 to-pink-900/95 border-purple-700 backdrop-blur-sm shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-600/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      Dica do Coach IA
                    </h4>
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                        <span className="text-slate-300 text-sm">Analisando...</span>
                      </div>
                    ) : (
                      <ReactMarkdown className="text-slate-100 text-sm leading-relaxed">
                        {tip}
                      </ReactMarkdown>
                    )}
                  </div>

                  <button
                    onClick={() => setShowTip(false)}
                    className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {!isLoading && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={() => { setShowTip(false); setShowChat(true); }}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-blue-600/50 text-blue-300 hover:bg-blue-600/20"
                    >
                      <MessageCircle className="w-3 h-3 mr-2" />
                      Conversar
                    </Button>
                    <Button
                      onClick={getTip}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-purple-600/50 text-purple-300 hover:bg-purple-600/20"
                    >
                      <Sparkles className="w-3 h-3 mr-2" />
                      Nova Dica
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Input */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-4 right-4 z-40"
          >
            <Card className="bg-gradient-to-br from-blue-900/95 to-cyan-900/95 border-blue-700 backdrop-blur-sm shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="w-5 h-5 text-blue-400" />
                  <h4 className="text-white font-bold flex-1">Converse com o Coach</h4>
                  <button
                    onClick={() => setShowChat(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ex: Como ajustar a pegada?"
                    disabled={isLoading}
                    className="bg-blue-950/50 border-blue-700 text-white placeholder:text-blue-300/50"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!chatInput.trim() || isLoading}
                    className="bg-blue-600 hover:bg-blue-700 px-4"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}