
import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Dumbbell, TrendingUp, Users, Apple, Zap, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = await base44.auth.isAuthenticated();
        if (isAuthenticated) {
          navigate(createPageUrl("Dashboard"));
        }
      } catch (error) {
        // Usuário não está logado, continua na página Home
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogin = () => {
    // Redireciona para login e depois para Dashboard (onde o fluxo de onboarding é verificado)
    base44.auth.redirectToLogin(createPageUrl("Dashboard"));
  };

  const features = [
    {
      icon: Dumbbell,
      title: "Treinos Personalizados",
      description: "Programas de treino criados especialmente para você com IA avançada",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400"
    },
    {
      icon: Apple,
      title: "Nutrição Inteligente",
      description: "Planos alimentares personalizados para atingir seus objetivos",
      image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400"
    },
    {
      icon: TrendingUp,
      title: "Acompanhamento Completo",
      description: "Monitore seu progresso com gráficos detalhados e análises",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"
    },
    {
      icon: Users,
      title: "Comunidade Motivadora",
      description: "Conecte-se com outros atletas e compartilhe suas conquistas",
      image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400"
    }
  ];

  const freeFeatures = [
    "Acesso a biblioteca de exercícios",
    "Registro de treinos",
    "Acompanhamento de peso",
    "Até 5 treinos disponíveis",
    "Comunidade IA Coach"
  ];

  const premiumFeatures = [
    "Tudo do plano Free",
    "Treinos ilimitados com IA",
    "Planos de nutrição personalizados",
    "Coach IA com análises detalhadas",
    "Programas avançados exclusivos",
    "Conteúdo novo toda semana",
    "Sem anúncios"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header with Logo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-center">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904da724b4ce40db58404e7/c84efc51a_LogoIA.png" 
            alt="IA Coach Fitness" 
            className="h-10"
          />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center justify-center pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20" />
        <div className="relative max-w-7xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <Card className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-blue-700/50 max-w-md mx-auto">
              <CardContent className="p-8 space-y-6">
                <Zap className="w-14 h-14 text-yellow-400 mx-auto" />
                <h2 className="text-3xl font-bold text-white leading-tight">
                  Pronto para transformar seu corpo?
                </h2>
                <p className="text-slate-300 text-base">
                  Junte-se a milhares de pessoas que já estão alcançando seus objetivos
                </p>
                <Button
                  onClick={handleLogin}
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-6 text-base font-semibold shadow-2xl shadow-blue-900/50 hover:shadow-blue-800/60 hover:scale-105 transition-all duration-300"
                >
                  Começar Agora - É Grátis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  onClick={handleLogin}
                  size="lg"
                  variant="outline"
                  className="w-full border-2 border-slate-600 bg-slate-800/50 text-white hover:bg-slate-700 hover:border-slate-500 px-8 py-6 text-base font-semibold hover:scale-105 transition-all duration-300"
                >
                  Já tenho conta
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-slate-400 text-lg">
              Recursos completos para alcançar seus objetivos fitness
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-slate-900/50 border-slate-800 overflow-hidden hover:border-blue-600/50 transition-all group">
                    <div className="h-48 bg-gradient-to-br from-blue-900/30 to-slate-900 relative overflow-hidden">
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                    </div>
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                      <p className="text-slate-400">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Escolha seu plano
            </h2>
            <p className="text-slate-400 text-lg">
              Comece grátis e faça upgrade quando quiser
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-slate-900/50 border-slate-800 h-full">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Gratuito</h3>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-5xl font-bold text-white">R$ 0</span>
                    <span className="text-slate-400">/mês</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {freeFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-slate-300">
                        <Check className="w-5 h-5 text-blue-400 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={handleLogin}
                    variant="outline"
                    className="w-full border-2 border-slate-600 bg-slate-800 text-white hover:bg-slate-700 hover:border-slate-500 py-6 text-base font-semibold"
                  >
                    Começar Grátis
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Premium Plan */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-blue-900/50 to-purple-900/30 border-blue-700/50 relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute top-4 right-4 bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                  🔥 Mais Popular
                </div>
                <CardContent className="p-8 relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-6 h-6 text-yellow-400" />
                    <h3 className="text-2xl font-bold text-white">Premium</h3>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold text-white">R$ 4,99</span>
                    <span className="text-slate-300">/mês</span>
                  </div>
                  <p className="text-sm text-slate-400 mb-6">
                    ou <span className="text-green-400 font-semibold">R$ 49,90/ano</span> (economize 17%)
                  </p>
                  <ul className="space-y-4 mb-8">
                    {premiumFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-white">
                        <Check className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={handleLogin}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-6 shadow-2xl shadow-blue-900/50 hover:shadow-blue-800/60 hover:scale-105 transition-all duration-300 text-base"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Começar com Premium
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 pb-16">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-blue-700/50">
              <CardContent className="p-8 space-y-6 text-center">
                <Zap className="w-14 h-14 text-yellow-400 mx-auto" />
                <h2 className="text-3xl font-bold text-white">
                  Transforme sua vida hoje!
                </h2>
                <p className="text-slate-300 text-base">
                  Milhares de pessoas já alcançaram seus objetivos. Você é o próximo!
                </p>
                <Button
                  onClick={handleLogin}
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-6 text-base font-semibold shadow-2xl shadow-blue-900/50 hover:shadow-blue-800/60 hover:scale-105 transition-all duration-300"
                >
                  Começar Minha Transformação
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto text-center text-slate-400 text-sm">
          <p>© 2025 IA Coach Fitness. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
