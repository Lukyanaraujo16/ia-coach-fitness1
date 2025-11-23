import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Lightbulb, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export default function AICoachAssistant({ exercise, user, isResting }) {
  const [showTip, setShowTip] = useState(false);
  const [tip, setTip] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getTip = async () => {
    setIsLoading(true);
    setShowTip(true);
    
    try {
      const prompt = `Você é um treinador pessoal experiente. O usuário está fazendo o exercício: ${exercise.exercise_name}

${exercise.notes ? `Observações do treino: ${exercise.notes}` : ''}

Informações do usuário:
- Nível: ${user.fitness_level}
- Objetivo: ${user.fitness_goal}

Dê UMA dica específica e prática sobre:
- Execução correta (postura, movimento, respiração)
- OU um erro comum a evitar
- OU como sentir o músculo trabalhando

Seja direto, use no máximo 3 linhas e 1 emoji. Foque no mais importante para executar o exercício com segurança e eficiência.`;

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

  return (
    <>
      {/* Botão Flutuante */}
      {!showTip && !isResting && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed bottom-24 right-4 z-40"
        >
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
                  <Button
                    onClick={getTip}
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 border-purple-600/50 text-purple-300 hover:bg-purple-600/20"
                  >
                    <Sparkles className="w-3 h-3 mr-2" />
                    Nova Dica
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}