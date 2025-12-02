import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, X, Loader2, Send, MessageCircle, 
  AlertTriangle, Lightbulb, TrendingUp, CheckCircle,
  Dumbbell, Apple, Scale, Camera, Timer, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { format, differenceInDays, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function GlobalAICoach({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [proactiveAlert, setProactiveAlert] = useState(null);
  const [showProactiveAlert, setShowProactiveAlert] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const messagesEndRef = useRef(null);
  const hasCheckedProactive = useRef(false);

  // Fetch all user data
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile-coach', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: workoutLogs = [] } = useQuery({
    queryKey: ['workout-logs-coach', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const logs = await base44.entities.WorkoutLog.list('-date');
      return logs.filter(log => log.user_email === user.email || log.created_by === user.email);
    },
    enabled: !!user?.email,
  });

  const { data: progressEntries = [] } = useQuery({
    queryKey: ['progress-entries-coach', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const entries = await base44.entities.ProgressEntry.list('-date');
      return entries.filter(e => e.created_by === user.email);
    },
    enabled: !!user?.email,
  });

  const { data: bodyAnalyses = [] } = useQuery({
    queryKey: ['body-analyses-coach', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const analyses = await base44.entities.BodyAnalysis.list('-date');
      return analyses.filter(a => a.created_by === user.email || a.user_email === user.email);
    },
    enabled: !!user?.email,
  });

  const { data: mealLogs = [] } = useQuery({
    queryKey: ['meal-logs-coach', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const logs = await base44.entities.MealLog.list('-date');
      return logs.filter(log => log.created_by === user.email);
    },
    enabled: !!user?.email,
  });

  const { data: fastingLogs = [] } = useQuery({
    queryKey: ['fasting-logs-coach', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const logs = await base44.entities.FastingLog.list('-start_time');
      return logs.filter(log => log.user_email === user.email || log.created_by === user.email);
    },
    enabled: !!user?.email,
  });

  const { data: userWorkouts = [] } = useQuery({
    queryKey: ['user-workouts-coach', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const workouts = await base44.entities.Workout.list();
      return workouts.filter(w => w.created_for_user === user.email);
    },
    enabled: !!user?.email,
  });

  const { data: nutritionPlans = [] } = useQuery({
    queryKey: ['nutrition-plans-coach', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const plans = await base44.entities.NutritionPlan.list();
      return plans.filter(p => p.created_for_user === user.email);
    },
    enabled: !!user?.email,
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Proactive analysis
  useEffect(() => {
    if (user && userProfile && workoutLogs && !hasCheckedProactive.current) {
      hasCheckedProactive.current = true;
      checkProactiveAlerts();
    }
  }, [user, userProfile, workoutLogs]);

  const checkProactiveAlerts = async () => {
    const alerts = [];
    const today = new Date();

    // Check workout frequency - need to update workout after 30 days
    const completedWorkouts = workoutLogs.filter(log => log.status !== 'cancelled');
    if (completedWorkouts.length >= 30) {
      const firstWorkout = completedWorkouts[completedWorkouts.length - 1];
      if (firstWorkout?.date) {
        const daysSinceStart = differenceInDays(today, parseISO(firstWorkout.date));
        if (daysSinceStart >= 30) {
          alerts.push({
            type: 'workout_update',
            icon: Dumbbell,
            color: 'text-blue-400',
            title: 'Hora de atualizar seu treino!',
            message: `Você completou ${completedWorkouts.length} treinos em ${daysSinceStart} dias. É hora de evoluir seu programa de treino!`,
            action: 'update_workout'
          });
        }
      }
    }

    // Check last weight/measurement update
    const lastProgress = progressEntries[0];
    if (lastProgress?.date) {
      const daysSinceProgress = differenceInDays(today, parseISO(lastProgress.date));
      if (daysSinceProgress >= 14) {
        alerts.push({
          type: 'progress_update',
          icon: Scale,
          color: 'text-green-400',
          title: 'Atualize suas medidas!',
          message: `Faz ${daysSinceProgress} dias desde sua última atualização de peso/medidas. Registre seu progresso!`,
          action: 'update_progress'
        });
      }
    } else if (progressEntries.length === 0) {
      alerts.push({
        type: 'first_progress',
        icon: Scale,
        color: 'text-green-400',
        title: 'Registre seu progresso!',
        message: 'Você ainda não registrou seu peso e medidas. Isso ajuda a acompanhar sua evolução!',
        action: 'update_progress'
      });
    }

    // Check body analysis
    const lastAnalysis = bodyAnalyses[0];
    if (lastAnalysis?.date) {
      const daysSinceAnalysis = differenceInDays(today, parseISO(lastAnalysis.date));
      if (daysSinceAnalysis >= 30) {
        alerts.push({
          type: 'body_analysis',
          icon: Camera,
          color: 'text-purple-400',
          title: 'Nova análise corporal?',
          message: `Sua última análise corporal foi há ${daysSinceAnalysis} dias. Faça uma nova para comparar sua evolução!`,
          action: 'new_analysis'
        });
      }
    }

    // Check nutrition - no meals logged today
    const todayMeals = mealLogs.filter(log => log.date === format(today, 'yyyy-MM-dd'));
    if (todayMeals.length === 0 && today.getHours() >= 12) {
      alerts.push({
        type: 'nutrition',
        icon: Apple,
        color: 'text-orange-400',
        title: 'Registre suas refeições!',
        message: 'Você ainda não registrou nenhuma refeição hoje. Mantenha o controle da sua nutrição!',
        action: 'log_meal'
      });
    }

    // Show first alert if exists
    if (alerts.length > 0) {
      setTimeout(() => {
        setProactiveAlert(alerts[0]);
        setShowProactiveAlert(true);
      }, 3000);
    }
  };

  const buildUserContext = () => {
    const profile = userProfile || {};
    const recentWorkouts = workoutLogs.slice(0, 10);
    const recentProgress = progressEntries.slice(0, 5);
    const recentMeals = mealLogs.slice(0, 10);
    const lastAnalysis = bodyAnalyses[0];
    const recentFasts = fastingLogs.slice(0, 5);

    return `
## CONTEXTO COMPLETO DO USUÁRIO

### Perfil
- Nome: ${user?.full_name || profile.nome_completo || 'Usuário'}
- Email: ${user?.email}
- Objetivo: ${profile.objetivo || user?.fitness_goal || 'não definido'}
- Nível: ${profile.nivel_fitness || user?.fitness_level || 'não definido'}
- Peso atual: ${profile.peso_atual || user?.current_weight || 'não registrado'}kg
- Peso meta: ${profile.peso_meta || user?.target_weight || 'não definido'}kg
- Altura: ${profile.altura || user?.height || 'não informada'}cm
- Meta calórica: ${profile.meta_calorica_diaria || user?.daily_calorie_goal || 2000} kcal/dia
- Meta de treinos/semana: ${profile.meta_treinos_semana || user?.weekly_goal || 4}
- Local de treino: ${profile.local_treino || user?.training_location || 'não definido'}
- Restrições alimentares: ${profile.restricoes_alimentares?.join(', ') || 'nenhuma'}

### Últimos Treinos (${recentWorkouts.length})
${recentWorkouts.slice(0, 5).map(w => `- ${w.date}: ${w.workout_title} (${w.duration_minutes || '?'} min)`).join('\n') || 'Nenhum treino registrado'}

### Progresso Recente
${recentProgress.slice(0, 3).map(p => `- ${p.date}: Peso ${p.weight}kg${p.body_fat_percentage ? `, Gordura ${p.body_fat_percentage}%` : ''}`).join('\n') || 'Nenhum registro de progresso'}

### Última Análise Corporal
${lastAnalysis ? `- Data: ${lastAnalysis.date}
- Gordura corporal: ${lastAnalysis.estimated_body_fat}%
- Massa muscular: ${lastAnalysis.estimated_muscle_mass}%
- Pontuação: ${lastAnalysis.overall_score}/100
- Biotipo: ${lastAnalysis.body_type}` : 'Nenhuma análise realizada'}

### Refeições de Hoje
${recentMeals.filter(m => m.date === format(new Date(), 'yyyy-MM-dd')).map(m => `- ${m.meal_type}: ${m.total_calories} kcal`).join('\n') || 'Nenhuma refeição registrada hoje'}

### Jejum Intermitente
${recentFasts.slice(0, 3).map(f => `- ${f.fasting_type}: ${f.status} (${f.duration_minutes ? Math.round(f.duration_minutes/60) + 'h' : 'em andamento'})`).join('\n') || 'Nenhum jejum registrado'}

### Treinos Personalizados do Usuário
${userWorkouts.length > 0 ? userWorkouts.map(w => `- ${w.title} (${w.difficulty})`).join('\n') : 'Nenhum treino personalizado'}

### Estatísticas
- Total de treinos: ${workoutLogs.length}
- Treinos últimos 7 dias: ${workoutLogs.filter(w => differenceInDays(new Date(), parseISO(w.date)) <= 7).length}
- Dias desde último treino: ${workoutLogs[0]?.date ? differenceInDays(new Date(), parseISO(workoutLogs[0].date)) : 'N/A'}
- Jejuns completados: ${fastingLogs.filter(f => f.status === 'completed').length}
`;
  };

  const sendMessage = async (customMessage = null) => {
    const message = customMessage || inputValue.trim();
    if (!message || isLoading) return;

    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setIsLoading(true);

    try {
      const userContext = buildUserContext();
      const conversationHistory = messages.slice(-6).map(m => `${m.role === 'user' ? 'Usuário' : 'Coach'}: ${m.content}`).join('\n');

      const systemPrompt = `Você é a Coach IA do app IA Coach Fitness. Você é uma treinadora pessoal experiente, nutricionista e especialista em bem-estar.

## SUA PERSONALIDADE
- Animada, motivadora e encorajadora
- Use emojis naturalmente (💪🔥✅🎯📊)
- Sempre chame o usuário pelo primeiro nome
- Seja específica e acionável nas dicas
- Fale português brasileiro natural

## SUAS CAPACIDADES
Você tem ACESSO TOTAL aos dados do usuário e pode:
1. Analisar treinos, nutrição, jejum e progresso
2. Sugerir mudanças em treinos (se for treino do usuário)
3. Sugerir ajustes na dieta
4. Alertar sobre necessidade de atualizações
5. Motivar e dar dicas personalizadas

## AÇÕES QUE VOCÊ PODE PROPOR
Se o usuário confirmar, você pode sugerir ações como:
- [AÇÃO: ATUALIZAR_TREINO] - para sugerir novo treino
- [AÇÃO: SUBSTITUIR_EXERCICIO] - para trocar exercício
- [AÇÃO: AJUSTAR_DIETA] - para ajustar metas nutricionais
- [AÇÃO: REGISTRAR_PROGRESSO] - para lembrar de registrar peso

Quando sugerir uma ação que modifica dados, SEMPRE peça confirmação primeiro!
Exemplo: "Posso ajustar sua meta calórica de 2000 para 1800 kcal? Confirma?"

${userContext}

## HISTÓRICO DA CONVERSA
${conversationHistory}

## INSTRUÇÕES
1. Responda de forma útil e personalizada
2. Use os dados do usuário para dar respostas específicas
3. Se sugerir alterações, peça confirmação
4. Máximo 4-5 linhas por resposta (seja conciso)
5. Sempre termine com uma pergunta ou ação sugerida`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}\n\nUsuário: ${message}`,
        add_context_from_internet: false,
      });

      // Check if there's a pending action in the response
      const actionMatch = response.match(/\[AÇÃO: (\w+)\]/);
      if (actionMatch) {
        setPendingAction(actionMatch[1]);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response.replace(/\[AÇÃO: \w+\]/g, '').trim() }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '❌ Ops, tive um problema. Tenta de novo?' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProactiveAction = () => {
    setShowProactiveAlert(false);
    setIsOpen(true);
    
    // Send initial message based on alert type
    const alert = proactiveAlert;
    if (alert) {
      setTimeout(() => {
        let message = '';
        switch(alert.action) {
          case 'update_workout':
            message = 'Quero atualizar meu treino, pode me ajudar?';
            break;
          case 'update_progress':
            message = 'Quero registrar meu peso e medidas atuais';
            break;
          case 'new_analysis':
            message = 'Quero fazer uma nova análise corporal';
            break;
          case 'log_meal':
            message = 'Me ajuda a registrar minhas refeições de hoje';
            break;
          default:
            message = 'Olá! Preciso de ajuda.';
        }
        sendMessage(message);
      }, 500);
    }
  };

  if (!user) return null;

  const isPremium = user?.subscription_status === 'premium' || user?.subscription_status === 'trial' || user?.subscription_status === 'lifetime';

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-24 right-4 z-50 md:bottom-6"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-900/50 relative"
            >
              <Sparkles className="w-6 h-6 text-white" />
              {showProactiveAlert && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proactive Alert Card */}
      <AnimatePresence>
        {showProactiveAlert && proactiveAlert && !isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed bottom-40 right-4 z-50 md:bottom-24 max-w-xs"
          >
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-purple-700/50 shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center ${proactiveAlert.color}`}>
                    <proactiveAlert.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold text-sm flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      {proactiveAlert.title}
                    </h4>
                    <p className="text-slate-300 text-xs mt-1">{proactiveAlert.message}</p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={handleProactiveAction}
                        className="bg-purple-600 hover:bg-purple-700 text-xs h-7"
                      >
                        Ver mais
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowProactiveAlert(false)}
                        className="text-slate-400 hover:text-white text-xs h-7"
                      >
                        Depois
                      </Button>
                    </div>
                  </div>
                  <button onClick={() => setShowProactiveAlert(false)} className="text-slate-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-20 bottom-24 left-4 right-4 md:inset-auto md:bottom-6 md:right-4 md:top-auto md:w-96 md:h-[600px] z-50 flex flex-col"
          >
            <Card className="bg-slate-900/98 backdrop-blur-xl border-purple-700/50 shadow-2xl flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-900 to-pink-900 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">Coach IA</h3>
                    <p className="text-purple-200 text-xs">Sua treinadora pessoal</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                    <h4 className="text-white font-semibold mb-2">Olá, {user?.full_name?.split(' ')[0]}! 👋</h4>
                    <p className="text-slate-400 text-sm mb-4">
                      Sou sua Coach IA. Posso te ajudar com treinos, nutrição, análises e muito mais!
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendMessage('Como está meu progresso?')}
                        className="border-purple-700 text-purple-300 hover:bg-purple-900/30 text-xs"
                      >
                        <TrendingUp className="w-3 h-3 mr-1" /> Meu progresso
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendMessage('Preciso de dicas para meu treino')}
                        className="border-purple-700 text-purple-300 hover:bg-purple-900/30 text-xs"
                      >
                        <Dumbbell className="w-3 h-3 mr-1" /> Dicas de treino
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendMessage('Me dá dicas de nutrição')}
                        className="border-purple-700 text-purple-300 hover:bg-purple-900/30 text-xs"
                      >
                        <Apple className="w-3 h-3 mr-1" /> Nutrição
                      </Button>
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800 text-slate-100'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="text-sm">{msg.content}</p>
                      ) : (
                        <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                        <span className="text-slate-400 text-sm">Pensando...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-slate-800">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Pergunte qualquer coisa..."
                    disabled={isLoading}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                  <Button
                    onClick={() => sendMessage()}
                    disabled={!inputValue.trim() || isLoading}
                    className="bg-purple-600 hover:bg-purple-700 px-4"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}