
import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AIChat({ user }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Olá! Sou seu treinador virtual. Posso te ajudar com:

• Dúvidas sobre exercícios e técnicas
• Dicas de nutrição e suplementação
• Orientações sobre progressão de treinos
• Motivação e estratégias mentais
• Correção de erros comuns

O que você gostaria de saber?`
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Contexto do usuário para melhorar as respostas
      const userContext = `
Perfil do usuário:
- Nome: ${user?.full_name}
- Objetivo: ${user?.fitness_goal === 'lose_weight' ? 'Emagrecer' : user?.fitness_goal === 'gain_muscle' ? 'Ganhar massa muscular' : 'Manter forma'}
- Nível: ${user?.fitness_level === 'beginner' ? 'Iniciante' : user?.fitness_level === 'intermediate' ? 'Intermediário' : 'Avançado'}
- Treina em: ${user?.training_location === 'gym' ? 'Academia' : user?.training_location === 'home' ? 'Casa' : 'Academia e Casa'}
- Peso atual: ${user?.current_weight || 'não informado'}kg
- Meta de peso: ${user?.weight_goal || 'não informado'}kg
      `.trim();

      const prompt = `Você é um treinador pessoal experiente e motivador. Responda de forma clara, amigável e profissional.

${userContext}

Pergunta do usuário: ${userMessage}

Forneça uma resposta útil, prática e motivadora. Se relevante, sugira exercícios ou dicas específicas.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false,
      });

      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      // Silenciar erros de abort completamente
      if (!error.message?.includes('abort')) {
        console.error("Error calling AI:", error);
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: "Desculpe, tive um problema ao processar sua mensagem. Tente novamente." 
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-400" />
          Chat com Treinador IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages */}
        <div className="h-[500px] overflow-y-auto space-y-4 p-4 bg-slate-800/30 rounded-lg">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700/50 text-slate-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-slate-700/50 p-3 rounded-2xl">
                <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua pergunta..."
            disabled={isLoading}
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Como melhorar minha técnica no supino?")}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Técnica de supino
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Como aumentar minha carga de treino de forma segura?")}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Progressão de carga
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Qual a melhor estratégia de nutrição para meu objetivo?")}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Dicas de nutrição
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
