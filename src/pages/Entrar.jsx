import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, Sparkles, TrendingUp, Users } from "lucide-react";

export default function Entrar() {
  const navigate = useNavigate();

  useEffect(() => {
    // Se já estiver logado, redireciona para o Dashboard
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          navigate(createPageUrl("Dashboard"));
        }
      } catch (error) {
        // Não está logado, continua na página
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl("Dashboard"));
  };

  const features = [
    { icon: Dumbbell, text: "Treinos Personalizados" },
    { icon: Sparkles, text: "Coach IA 24/7" },
    { icon: TrendingUp, text: "Acompanhe seu Progresso" },
    { icon: Users, text: "Comunidade Ativa" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904da724b4ce40db58404e7/ff4e4563c_LogoIA.png" 
          alt="IA Coach Fitness" 
          className="h-10 mx-auto"
        />
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        <div className="max-w-md w-full space-y-8">
          {/* Hero Text */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Seu Personal Trainer com{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Inteligência Artificial
              </span>
            </h1>
            <p className="text-slate-400 text-lg">
              Treine de forma inteligente, alcance seus objetivos mais rápido
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-slate-300 text-sm font-medium">{feature.text}</span>
                </div>
              );
            })}
          </div>

          {/* Login Card */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-white">
                  Comece sua transformação
                </h2>
                <p className="text-slate-400 text-sm">
                  Entre com sua conta ou crie uma nova para começar
                </p>
              </div>

              <Button
                onClick={handleLogin}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base"
              >
                Entrar ou Criar Conta
              </Button>

              <p className="text-center text-slate-500 text-xs">
                Ao continuar, você concorda com nossos{" "}
                <a href="#" className="text-blue-400 hover:underline">
                  Termos de Uso
                </a>{" "}
                e{" "}
                <a href="#" className="text-blue-400 hover:underline">
                  Política de Privacidade
                </a>
              </p>
            </CardContent>
          </Card>

          {/* Social Proof */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className="w-5 h-5 text-yellow-400 fill-current"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            <p className="text-slate-400 text-sm">
              Avaliado com <span className="text-white font-semibold">4.9/5</span> por nossos usuários
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-slate-600 text-xs">
          © 2024 IA Coach Fitness. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}