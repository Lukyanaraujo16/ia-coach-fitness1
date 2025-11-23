import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export default function CoachChatbot({ user, workoutLogs, progressEntries }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Mensagem inicial de boas-vindas
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Olá ${user?.nome_completo?.split(' ')[0] || 'atleta'}! 👋\n\nSou seu treinador pessoal com IA. Estou aqui para:\n\n• 💪 Tirar dúvidas sobre treinos e exercícios\n• 🍎 Dar conselhos sobre nutrição\n• 📊 Analisar seu progresso\n• 🎯 Ajustar seu plano de treino\n• 🔥 Motivar você a alcançar seus objetivos\n\nComo posso te ajudar hoje?`,
        timestamp: new Date()
      }]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Preparar contexto do usuário
      const recentWorkouts = workoutLogs.slice(0, 5);
      const recentProgress = progressEntries.slice(0, 3);
      
      const context = `
Informações do Usuário:
- Nome: ${user.nome_completo}
- Objetivo: ${user.fitness_goal}
- Nível: ${user.fitness_level}
- Peso Atual: ${user.current_weight}kg
- Meta de Peso: ${user.weight_goal}kg
- Local de Treino: ${user.training_location}

Treinos Recentes (${recentWorkouts.length}):
${recentWorkouts.map(w => `- ${w.workout_title} (${w.date}): ${w.duration_minutes}min, ${w.exercises_completed?.length || 0} exercícios`).join('\n')}

Progresso Recente:
${recentProgress.map(p => `- ${p.date}: ${p.weight}kg${p.body_fat_percentage ? `, ${p.body_fat_percentage}% gordura` : ''}`).join('\n')}

Pergunta do Usuário: ${input}
      `;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um treinador pessoal brasileiro experiente e motivador. Responda de forma amigável, direta e prática.

${context}

Dê uma resposta personalizada, considerando o contexto do usuário. Se for uma pergunta sobre exercícios, seja específico. Se for sobre nutrição, dê conselhos práticos. Se for motivacional, seja encorajador mas realista.

Mantenha a resposta concisa (máximo 4 parágrafos) e use emojis quando apropriado.`,
        add_context_from_internet: false
      });

      const assistantMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('❌ Erro ao processar mensagem');
      
      const errorMessage = {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    "Como melhorar minha postura no agachamento?",
    "Dicas para ganhar massa muscular?",
    "Como posso melhorar meu treino de peito?",
    "Qual a melhor hora para treinar?"
  ];

  return (
    <div className="space-y-4">
      {/* Chat Container */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="border-b border-slate-800">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            Chat com Treinador IA
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Messages */}
          <div className="h-[500px] overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-100'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <ReactMarkdown 
                      className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                        ul: ({ children }) => <ul className="ml-4 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="ml-4 mb-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                  <p className="text-xs opacity-60 mt-2">
                    {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-800 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    <span className="text-slate-400 text-sm">Pensando...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-800 p-4 space-y-3">
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(question)}
                    className="text-xs bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            )}
            
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua pergunta ou dúvida..."
                disabled={isLoading}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 px-6"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}