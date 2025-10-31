import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, Zap, Lock } from "lucide-react";
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
    { icon: Crown, text: "Planos de nutrição exclusivos", premium: true },
    { icon: Lock, text: "Programas avançados de treino", premium: true },
    { icon: Check, text: "Análises detalhadas de progresso", premium: true },
    { icon: Sparkles, text: "Suporte prioritário", premium: true },
    { icon: Crown, text: "Conteúdo exclusivo toda semana", premium: true },
  ];

  return (
    <div className="py-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">FitTrack+ Premium</h2>
        <p className="text-slate-400">
          Leve seu treino ao próximo nível
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
              <h3 className="text-white font-semibold mb-2">Você é Premium!</h3>
              <p className="text-slate-300 text-sm">
                Aproveite todos os recursos exclusivos
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-white">Gratuito</CardTitle>
              <Badge variant="outline" className="border-slate-700 text-slate-400">
                Atual
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">R$ 0</span>
              <span className="text-slate-400">/mês</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {features.filter(f => !f.premium).map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-slate-300">
                  <feature.icon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                Premium
              </CardTitle>
              <Badge className="bg-yellow-500 text-black">
                Mais Popular
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">R$ 29,90</span>
              <span className="text-slate-300">/mês</span>
            </div>
            <p className="text-sm text-slate-400 mt-2">ou R$ 299,90/ano (economize 17%)</p>
          </CardHeader>
          <CardContent className="space-y-4 relative">
            <ul className="space-y-3">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-white">
                  <feature.icon className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
            {!isPremium && (
              <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-900/50">
                <Crown className="w-4 h-4 mr-2" />
                Assinar Premium
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Benefits */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Por que Premium?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-blue-400" />
              </div>
              <h4 className="text-white font-semibold mb-2">IA Personalizada</h4>
              <p className="text-slate-400 text-sm">
                Treinos criados especialmente para você com inteligência artificial
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Crown className="w-6 h-6 text-purple-400" />
              </div>
              <h4 className="text-white font-semibold mb-2">Conteúdo Exclusivo</h4>
              <p className="text-slate-400 text-sm">
                Acesso a programas avançados e conteúdo liberado semanalmente
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-green-400" />
              </div>
              <h4 className="text-white font-semibold mb-2">Resultados Rápidos</h4>
              <p className="text-slate-400 text-sm">
                Análises detalhadas e insights para acelerar seu progresso
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}