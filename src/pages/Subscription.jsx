import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, Zap, Lock, Users, BarChart, HeartPulse, Loader2, ExternalLink, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Subscription() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin(createPageUrl("Subscription"));
      }
    };
    loadUser();
  }, []);

  const handleSubscribe = async (plan) => {
    setLoading(true);
    setSelectedPlan(plan);
    
    try {
      const response = await base44.functions.invoke('createCheckoutSession', {
        plan: plan,
        successUrl: window.location.origin + createPageUrl("Dashboard") + "?payment=success",
        cancelUrl: window.location.origin + createPageUrl("Subscription") + "?payment=cancelled"
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('Erro ao criar sessão de pagamento');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Erro ao processar pagamento. Tente novamente.');
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('createPortalSession', {
        returnUrl: window.location.origin + createPageUrl("Profile")
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('Erro ao acessar portal');
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast.error('Erro ao acessar gerenciamento. Tente novamente.');
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  const isPremium = user?.subscription_status === 'premium' || user?.subscription_status === 'lifetime';
  const isTrial = user?.subscription_status === 'trial';
  const isLifetime = user?.subscription_status === 'lifetime';

  const plans = [
    {
      id: 'monthly',
      name: 'Mensal',
      price: '9,90',
      period: '/mês',
      description: 'Flexibilidade total',
      pricePerMonth: '9,90',
      popular: false
    },
    {
      id: 'semiannual',
      name: 'Semestral',
      price: '49,90',
      period: '/6 meses',
      description: 'Economize 16%',
      pricePerMonth: '8,32',
      popular: true
    },
    {
      id: 'annual',
      name: 'Anual',
      price: '89,90',
      period: '/ano',
      description: 'Economize 25%',
      pricePerMonth: '7,49',
      popular: false
    }
  ];

  const features = [
    { icon: Zap, text: "Acesso ilimitado a todos os treinos", premium: false },
    { icon: Check, text: "Biblioteca completa de exercícios", premium: false },
    { icon: Sparkles, text: "Treinos personalizados com IA", premium: true },
    { icon: HeartPulse, text: "Planos de nutrição exclusivos", premium: true },
    { icon: Lock, text: "Programas avançados de treino", premium: true },
    { icon: BarChart, text: "Análises detalhadas de progresso", premium: true },
    { icon: Users, text: "Coach IA no WhatsApp 24/7", premium: true },
    { icon: Crown, text: "Conteúdo exclusivo toda semana", premium: true },
  ];

  // Calcular dias restantes do trial
  const getTrialDaysRemaining = () => {
    if (!user?.premium_trial_end_date) return 0;
    const endDate = new Date(user.premium_trial_end_date);
    const now = new Date();
    const diff = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const trialDaysRemaining = getTrialDaysRemaining();

  return (
    <div className="py-6 space-y-6">
      <div className="text-center space-y-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-yellow-900/50"
        >
          <Crown className="w-10 h-10 text-white" />
        </motion.div>
        <h2 className="text-4xl font-bold text-white">
          {isPremium ? 'Você é Premium!' : isTrial ? 'Continue Premium!' : 'Desbloqueie seu'}
          {!isPremium && !isTrial && <br />}
          {!isPremium && !isTrial && (
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Potencial Máximo
            </span>
          )}
        </h2>
        {isTrial && (
          <div className="inline-flex items-center gap-2 bg-orange-600/20 border border-orange-600/30 rounded-full px-4 py-2">
            <Clock className="w-4 h-4 text-orange-400" />
            <span className="text-orange-300 text-sm font-medium">
              {trialDaysRemaining} dia{trialDaysRemaining !== 1 ? 's' : ''} restante{trialDaysRemaining !== 1 ? 's' : ''} do período de teste
            </span>
          </div>
        )}
        <p className="text-slate-400 max-w-md mx-auto">
          {isPremium 
            ? 'Aproveite todos os recursos exclusivos do seu plano' 
            : isTrial 
            ? 'Assine agora para continuar com acesso total após o período de teste'
            : 'Transforme seu corpo com treinos exclusivos e acompanhamento personalizado 💥'
          }
        </p>
      </div>

      {/* Current Plan Status */}
      {(isPremium || isLifetime) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border-yellow-700/50">
            <CardContent className="p-6 text-center">
              <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">
                {isLifetime ? 'Membro Vitalício! 🎉' : 'Você é Premium! 🎉'}
              </h3>
              <p className="text-slate-300 text-sm mb-2">
                {isLifetime 
                  ? 'Você tem acesso vitalício a todos os recursos'
                  : `Plano ${user.subscription_plan === 'monthly' ? 'Mensal' : user.subscription_plan === 'semiannual' ? 'Semestral' : 'Anual'}`
                }
              </p>
              {user.subscription_end_date && !isLifetime && (
                <p className="text-slate-400 text-xs mb-4">
                  Válido até {new Date(user.subscription_end_date).toLocaleDateString('pt-BR')}
                </p>
              )}
              {user.stripe_customer_id && !isLifetime && (
                <Button
                  onClick={handleManageSubscription}
                  disabled={loading}
                  variant="outline"
                  className="border-yellow-700 text-yellow-400 hover:bg-yellow-900/30"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4 mr-2" />
                  )}
                  Gerenciar Assinatura
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Pricing Cards - Only show if not premium */}
      {!isPremium && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className={`relative overflow-hidden h-full ${
                  plan.popular 
                    ? 'bg-gradient-to-br from-blue-900/50 to-purple-900/30 border-blue-600 scale-105' 
                    : 'bg-slate-900/50 border-slate-800'
                }`}>
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-yellow-500 text-black px-3 py-1 text-xs font-bold rounded-bl-lg">
                      🔥 Mais Popular
                    </div>
                  )}
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className={`w-5 h-5 ${plan.popular ? 'text-yellow-400' : 'text-blue-400'}`} />
                      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-4xl font-bold text-white">R$ {plan.price}</span>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">{plan.period}</p>
                    <p className="text-green-400 text-sm mb-6">
                      R$ {plan.pricePerMonth}/mês • {plan.description}
                    </p>
                    
                    <Button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={loading}
                      className={`w-full mt-auto ${
                        plan.popular
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500'
                          : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                    >
                      {loading && selectedPlan === plan.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Crown className="w-4 h-4 mr-2" />
                          Assinar Agora
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Free vs Premium Comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="bg-slate-900/50 border-slate-800 h-full">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-white">Gratuito</CardTitle>
                    {!isTrial && !isPremium && (
                      <Badge variant="outline" className="border-slate-700 text-slate-400">
                        Plano Atual
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm">Recursos básicos para começar</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {features.filter(f => !f.premium).map((feature, idx) => {
                      const Icon = feature.icon;
                      return (
                        <li key={idx} className="flex items-center gap-3 text-slate-300">
                          <Icon className="w-5 h-5 text-slate-500 flex-shrink-0" />
                          <span>{feature.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Premium Plan */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="bg-gradient-to-br from-blue-900/50 to-purple-900/30 border-blue-700/50 relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
                <CardHeader className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-6 h-6 text-yellow-400" />
                    <CardTitle className="text-white">Premium</CardTitle>
                    {isTrial && (
                      <Badge className="bg-orange-600/20 text-orange-300 border-orange-600/30">
                        Em Teste
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm">Acesso completo a todos os recursos</p>
                </CardHeader>
                <CardContent className="space-y-4 relative">
                  <ul className="space-y-3">
                    {features.map((feature, idx) => {
                      const Icon = feature.icon;
                      return (
                        <li key={idx} className="flex items-center gap-3 text-white">
                          <Icon className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                          <span>{feature.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      )}

      {/* Benefits Grid */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-center">Por que escolher Premium?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-7 h-7 text-blue-400" />
              </div>
              <h4 className="text-white font-semibold mb-2">IA Personalizada</h4>
              <p className="text-slate-400 text-sm">
                Treinos criados especialmente para você com inteligência artificial avançada
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Crown className="w-7 h-7 text-purple-400" />
              </div>
              <h4 className="text-white font-semibold mb-2">Conteúdo Exclusivo</h4>
              <p className="text-slate-400 text-sm">
                Acesso a programas avançados e conteúdo novo liberado toda semana
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-green-600/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Zap className="w-7 h-7 text-green-400" />
              </div>
              <h4 className="text-white font-semibold mb-2">Resultados Mais Rápidos</h4>
              <p className="text-slate-400 text-sm">
                Análises detalhadas e insights personalizados para acelerar seu progresso
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guarantee */}
      <div className="text-center text-slate-400 text-sm space-y-1">
        <p>✅ Cancele quando quiser</p>
        <p>💳 Pagamento 100% seguro via Stripe</p>
        <p>🔒 Seus dados estão protegidos</p>
      </div>
    </div>
  );
}