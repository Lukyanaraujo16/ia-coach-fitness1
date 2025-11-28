import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Check, Crown, Dumbbell, TrendingUp, Users, Apple, Zap, ArrowRight, 
  Star, Play, Shield, Clock, Target, Sparkles, MessageCircle, 
  ChevronRight, Award, BarChart3, Heart, Brain
} from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState("https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png");

  // SEO Meta Tags
  useEffect(() => {
    // Title
    document.title = "IA Coach Fitness - Seu Personal Trainer com Inteligência Artificial | Treinos e Nutrição Personalizados";
    
    // Meta Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = "Transforme seu corpo com o IA Coach Fitness. Treinos personalizados com IA, planos de nutrição inteligentes, coach disponível 24/7. Comece grátis e alcance seus objetivos fitness!";

    // Meta Keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.name = 'keywords';
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.content = "personal trainer, treino personalizado, IA fitness, coach fitness, nutrição personalizada, app de treino, exercícios em casa, academia, dieta, emagrecimento, ganho de massa, musculação";

    // Open Graph Tags
    const ogTags = [
      { property: 'og:title', content: 'IA Coach Fitness - Seu Personal Trainer com IA' },
      { property: 'og:description', content: 'Treinos personalizados, nutrição inteligente e coach 24/7. Transforme seu corpo com tecnologia de ponta!' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://iacoachfitness.com.br' },
      { property: 'og:image', content: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png' },
      { property: 'og:site_name', content: 'IA Coach Fitness' },
      { property: 'og:locale', content: 'pt_BR' }
    ];

    ogTags.forEach(tag => {
      let meta = document.querySelector(`meta[property="${tag.property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', tag.property);
        document.head.appendChild(meta);
      }
      meta.content = tag.content;
    });

    // Twitter Card Tags
    const twitterTags = [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'IA Coach Fitness - Seu Personal Trainer com IA' },
      { name: 'twitter:description', content: 'Treinos personalizados, nutrição inteligente e coach 24/7. Comece grátis!' },
      { name: 'twitter:image', content: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png' }
    ];

    twitterTags.forEach(tag => {
      let meta = document.querySelector(`meta[name="${tag.name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = tag.name;
        document.head.appendChild(meta);
      }
      meta.content = tag.content;
    });

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = 'https://iacoachfitness.com.br';

    // Schema.org JSON-LD
    let schemaScript = document.querySelector('script[type="application/ld+json"]');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.type = 'application/ld+json';
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "IA Coach Fitness",
      "description": "Aplicativo de personal trainer com inteligência artificial. Treinos personalizados, nutrição inteligente e coach disponível 24/7.",
      "url": "https://iacoachfitness.com.br",
      "applicationCategory": "HealthApplication",
      "operatingSystem": "Web, iOS, Android",
      "offers": {
        "@type": "Offer",
        "price": "9.90",
        "priceCurrency": "BRL",
        "description": "Plano mensal Premium"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "10000",
        "bestRating": "5"
      },
      "author": {
        "@type": "Organization",
        "name": "IA Coach Fitness"
      }
    });

    return () => {
      // Cleanup não necessário para SEO tags
    };
  }, []);

  useEffect(() => {
    const checkAuthAndLoadLogo = async () => {
      try {
        // Verifica se o usuário está autenticado
        const isAuthenticated = await base44.auth.isAuthenticated();
        if (isAuthenticated) {
          // Usuário logado - redireciona para Dashboard
          navigate(createPageUrl("Dashboard"));
          return;
        }
      } catch (error) {
        // Não está autenticado - continua na Home
      }

      try {
        // Apenas tenta carregar o logo do admin
        const users = await base44.entities.User.list();
        const adminUser = users.find(u => u.role === 'admin' && u.app_logo_url);
        if (adminUser?.app_logo_url) {
          setLogoUrl(adminUser.app_logo_url);
        }
      } catch (error) {
        // Ignora erro - usa logo padrão
      }
    };
    checkAuthAndLoadLogo();
  }, [navigate]);

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl("Dashboard"));
  };

  const features = [
    {
      icon: Dumbbell,
      title: "Treinos Personalizados com IA",
      description: "Programas criados especialmente para seu objetivo, nível e local de treino",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80"
    },
    {
      icon: Apple,
      title: "Nutrição Inteligente",
      description: "Planos alimentares personalizados com análise de fotos das refeições",
      image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80"
    },
    {
      icon: Brain,
      title: "Coach IA 24/7",
      description: "Tire dúvidas, receba insights e ajuste treinos a qualquer momento",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80"
    },
    {
      icon: TrendingUp,
      title: "Acompanhamento Completo",
      description: "Monitore peso, medidas, cargas e evolução com gráficos detalhados",
      image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80"
    },
    {
      icon: Users,
      title: "Comunidade Motivadora",
      description: "Conecte-se com outros atletas, compartilhe conquistas e participe de desafios",
      image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&q=80"
    },
    {
      icon: MessageCircle,
      title: "Coach no WhatsApp",
      description: "Registre treinos e tire dúvidas direto pelo WhatsApp",
      image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80"
    }
  ];

  const stats = [
    { value: "10K+", label: "Usuários Ativos" },
    { value: "500K+", label: "Treinos Realizados" },
    { value: "98%", label: "Satisfação" },
    { value: "4.9", label: "Avaliação", icon: Star }
  ];

  const testimonials = [
    {
      name: "João M.",
      avatar: "JM",
      text: "Em 3 meses perdi 12kg com os treinos personalizados. O coach de IA é incrível!",
      result: "-12kg em 3 meses"
    },
    {
      name: "Maria S.",
      avatar: "MS",
      text: "Nunca fui de academia, mas o app me ajudou a criar o hábito. Treino em casa todos os dias!",
      result: "Treina há 6 meses"
    },
    {
      name: "Pedro L.",
      avatar: "PL",
      text: "A nutrição personalizada mudou minha relação com a comida. Finalmente entendi como comer bem.",
      result: "+5kg de massa magra"
    }
  ];

  const plans = [
    {
      name: "Mensal",
      price: "9,90",
      period: "/mês",
      description: "Flexibilidade total",
      popular: false
    },
    {
      name: "Semestral",
      price: "49,90",
      period: "/6 meses",
      description: "R$ 8,32/mês • Economize 16%",
      popular: true
    },
    {
      name: "Anual",
      price: "89,90",
      period: "/ano",
      description: "R$ 7,49/mês • Economize 25%",
      popular: false
    }
  ];

  const premiumFeatures = [
    "Treinos ilimitados com IA",
    "Planos de nutrição personalizados",
    "Coach IA com análises detalhadas",
    "Análise de fotos de refeições",
    "Coach no WhatsApp 24/7",
    "Programas avançados exclusivos",
    "Desafios semanais com prêmios",
    "Suporte prioritário"
  ];

  const freeFeatures = [
    "Biblioteca de exercícios",
    "Registro de treinos básico",
    "Acompanhamento de peso",
    "Comunidade IA Coach",
    "5 treinos disponíveis"
  ];

  const appScreenshots = [
    "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&q=80",
    "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=80",
    "https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400&q=80"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <img src={logoUrl} alt="IA Coach Fitness" className="h-10" />
          <Button
            onClick={handleLogin}
            variant="outline"
            className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
          >
            Entrar
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center pt-20">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-slate-950" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-20 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-600/30 rounded-full px-4 py-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 text-sm font-medium">3 dias grátis de Premium</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              Seu Personal Trainer
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400"> com IA</span>
            </h1>
            
            <p className="text-xl text-slate-300 max-w-lg">
              Treinos personalizados, nutrição inteligente e um coach disponível 24/7. 
              Transforme seu corpo com a tecnologia mais avançada.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleLogin}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-6 text-lg font-semibold shadow-2xl shadow-blue-900/50 hover:scale-105 transition-all"
              >
                Começar Grátis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={handleLogin}
                size="lg"
                variant="outline"
                className="border-2 border-slate-600 bg-slate-800/50 text-white hover:bg-slate-700 px-8 py-6 text-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Ver Como Funciona
              </Button>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-3">
                {['JM', 'MS', 'PL', 'AS'].map((initials, i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 border-2 border-slate-900 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{initials}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-400 text-sm">+10.000 usuários satisfeitos</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative hidden md:block"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-3xl blur-2xl" />
              <img
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80"
                alt="Fitness App"
                className="relative rounded-3xl shadow-2xl border border-slate-800"
              />
              <div className="absolute -bottom-6 -left-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold">+25%</p>
                    <p className="text-slate-400 text-sm">Força Aumentada</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold">AI Coach</p>
                    <p className="text-slate-400 text-sm">Online 24/7</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2">
                  <p className="text-4xl md:text-5xl font-bold text-white">{stat.value}</p>
                  {stat.icon && <stat.icon className="w-6 h-6 text-yellow-400 fill-yellow-400" />}
                </div>
                <p className="text-slate-400 mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
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
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Tudo para sua
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400"> transformação</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Uma plataforma completa com inteligência artificial para você alcançar seus objetivos fitness
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <Card className="bg-slate-900/50 border-slate-800 overflow-hidden hover:border-blue-600/50 transition-all group h-full">
                    <div className="h-40 relative overflow-hidden">
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <div className="w-12 h-12 bg-blue-600/20 backdrop-blur rounded-xl flex items-center justify-center border border-blue-600/30">
                          <Icon className="w-6 h-6 text-blue-400" />
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                      <p className="text-slate-400 text-sm">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Como funciona?
            </h2>
            <p className="text-slate-400 text-lg">
              Em poucos minutos você terá seu plano personalizado
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Crie sua conta", desc: "Cadastro rápido e gratuito", icon: Shield },
              { step: "2", title: "Conte seus objetivos", desc: "Responda algumas perguntas", icon: Target },
              { step: "3", title: "Receba seu plano", desc: "IA cria treino e dieta", icon: Brain },
              { step: "4", title: "Transforme-se", desc: "Siga o plano e evolua", icon: Award }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center relative"
              >
                {idx < 3 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-600/50 to-purple-600/50" />
                )}
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/50">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 border-2 border-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-blue-400 font-bold text-sm">{item.step}</span>
                  </div>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Histórias de
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400"> sucesso</span>
            </h2>
            <p className="text-slate-400 text-lg">
              Veja o que nossos usuários estão dizendo
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-slate-900/50 border-slate-800 h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-slate-300 mb-6 italic">"{testimonial.text}"</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">{testimonial.avatar}</span>
                        </div>
                        <p className="text-white font-semibold">{testimonial.name}</p>
                      </div>
                      <div className="bg-green-600/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                        {testimonial.result}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-slate-900/30" id="pricing">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-6"
          >
            <div className="inline-flex items-center gap-2 bg-green-600/20 border border-green-600/30 rounded-full px-4 py-2 mb-6">
              <Zap className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-sm font-medium">3 dias grátis para testar Premium</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Escolha seu plano
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Comece com 3 dias grátis de Premium. Cancele quando quiser.
            </p>
          </motion.div>

          {/* Premium Plans */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            {plans.map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className={`relative overflow-hidden h-full ${
                  plan.popular 
                    ? 'bg-gradient-to-br from-blue-900/50 to-purple-900/30 border-blue-600' 
                    : 'bg-slate-900/50 border-slate-800'
                }`}>
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-yellow-500 text-black px-4 py-1 text-sm font-bold rounded-bl-lg">
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
                      <span className="text-slate-400">{plan.period}</span>
                    </div>
                    <p className="text-sm text-green-400 mb-6">{plan.description}</p>
                    
                    <Button
                      onClick={handleLogin}
                      className={`w-full mt-auto ${
                        plan.popular
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500'
                          : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                    >
                      Começar Grátis
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Features Comparison */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Features */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-slate-900/50 border-slate-800 h-full">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">Gratuito</h3>
                  <p className="text-slate-400 text-sm mb-6">Recursos básicos para começar</p>
                  <ul className="space-y-3">
                    {freeFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-slate-300">
                        <Check className="w-5 h-5 text-slate-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Premium Features */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/20 border-blue-700/50 h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-xl font-bold text-white">Premium</h3>
                  </div>
                  <p className="text-slate-400 text-sm mb-6">Acesso completo a todos os recursos</p>
                  <ul className="space-y-3">
                    {premiumFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-white">
                        <Check className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-blue-700/50 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
              <CardContent className="p-8 md:p-12 text-center relative">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-yellow-900/50">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Comece sua transformação hoje!
                </h2>
                <p className="text-slate-300 text-lg mb-8 max-w-lg mx-auto">
                  Junte-se a milhares de pessoas que já estão alcançando seus objetivos com o IA Coach Fitness.
                </p>
                <Button
                  onClick={handleLogin}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-12 py-6 text-lg font-semibold shadow-2xl shadow-blue-900/50 hover:scale-105 transition-all"
                >
                  Começar Grátis - 3 Dias Premium
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <p className="text-slate-400 text-sm mt-4">
                  ✅ Sem compromisso • 💳 Sem cartão de crédito
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <img src={logoUrl} alt="IA Coach Fitness" className="h-8" />
            <div className="flex items-center gap-6 text-slate-400 text-sm">
              <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Suporte</a>
            </div>
          </div>
          <div className="text-center text-slate-500 text-sm mt-8">
            <p>© 2025 IA Coach Fitness. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}