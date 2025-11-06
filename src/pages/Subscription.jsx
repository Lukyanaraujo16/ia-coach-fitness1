
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, Zap, Lock, Users, BarChart, HeartPulse } from "lucide-react";
import { motion } from "framer-motion";

export default function Subscription() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const isPremium = user?.subscription_status === 'premium';

  const features = [
    { icon: Zap, text: "Acesso ilimitado a todos os treinos", premium: false },
    { icon: Check, text: "Biblioteca completa de exercícios", premium: false },
    { icon: Sparkles, text: "Treinos personalizados com IA", premium: true },
    { icon: HeartPulse, text: "Planos de nutrição exclusivos", premium: true },
    { icon: Lock, text: "Programas avançados de treino", premium: true },
    { icon: BarChart, text: "Análises detalhadas de progresso", premium: true },
    { icon: Users, text: "Comunidade exclusiva Premium", premium: true },
    { icon: Crown, text: "Conteúdo exclusivo toda semana", premium: true },
  ];

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
          Desbloqueie seu <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Potencial Máximo
          </span>
        </h2>
        <p className="text-slate-400 max-w-md mx-auto">
          Transforme seu corpo com treinos exclusivos e acompanhamento personalizado 💥
        </p>
      </div>

      {/* Current Plan */}
      {isPremium && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border-yellow-700/50">
            <CardContent className="p-6 text-center">
              <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">Você é Premium! 🎉</h3>
              <p className="text-slate-300 text-sm mb-4">
                Aproveite todos os recursos exclusivos
              </p>
              <Button
                variant="outline"
                className="border-yellow-700 text-yellow-400 hover:bg-yellow-900/30"
              >
                Gerenciar Assinatura
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-white">Gratuito</CardTitle>
                {!isPremium && (
                  <Badge variant="outline" className="border-slate-700 text-slate-400">
                    Plano Atual
                  </Badge>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">R$ 0</span>
                <span className="text-slate-400">/mês</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {features.filter(f => !f.premium).map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <li key={idx} className="flex items-center gap-3 text-slate-300">
                      <Icon className="w-5 h-5 text-blue-400 flex-shrink-0" />
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
          <Card className="bg-gradient-to-br from-blue-900/50 to-purple-900/30 border-blue-700/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="absolute top-2 right-2 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">
              🔥 Mais Popular
            </div>
            <CardHeader className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-6 h-6 text-yellow-400" />
                <CardTitle className="text-white">Premium</CardTitle>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">R$ 4,99</span>
                <span className="text-slate-300">/mês</span>
              </div>
              <p className="text-sm text-slate-400 mt-2">
                ou <span className="text-green-400 font-semibold">R$ 49,90/ano</span> (economize 17%)
              </p>
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
              {!isPremium && (
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-blue-900/50 py-6">
                  <Crown className="w-5 h-5 mr-2" />
                  Assinar Premium Agora
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

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

      {/* Testimonial */}
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold">JM</span>
            </div>
            <div>
              <p className="text-slate-300 mb-2 italic">
                "O Premium mudou completamente minha rotina de treinos. Em 3 meses perdi 8kg e ganhei muito mais energia!"
              </p>
              <p className="text-slate-400 text-sm">
                João M. • Membro Premium há 6 meses
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guarantee */}
      <div className="text-center text-slate-400 text-sm">
        <p className="mb-1">✅ Cancele quando quiser</p>
        <p>💳 Pagamento 100% seguro</p>
      </div>
    </div>
  );
}
