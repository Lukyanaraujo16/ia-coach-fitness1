
import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Dumbbell, TrendingUp, Users, User, Crown, Shield, Apple, Sparkles } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
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

  const navigationItems = [
    { name: "Home", path: createPageUrl("Home"), icon: Home },
    { name: "Treinos", path: createPageUrl("Workouts"), icon: Dumbbell },
    { name: "Nutrição", path: createPageUrl("Nutrition"), icon: Apple },
    { name: "Progresso", path: createPageUrl("Progress"), icon: TrendingUp },
    { name: "Comunidade", path: createPageUrl("Community"), icon: Users },
    { name: "Perfil", path: createPageUrl("Profile"), icon: User },
  ];

  // Adiciona item AI Coach se for premium
  if (user?.subscription_status === 'premium') {
    navigationItems.splice(5, 0, {
      name: "Coach IA",
      path: createPageUrl("AICoach"),
      icon: Sparkles,
    });
  }

  // Adiciona item Admin se for admin
  if (user?.role === 'admin') {
    navigationItems.push({
      name: "Admin",
      path: createPageUrl("Admin"),
      icon: Shield,
    });
  }

  // Esconder navegação durante execução de treino, onboarding e setup
  const hideNavigation = ["WorkoutExecution", "Onboarding", "NutritionSetup", "WorkoutSetup"].includes(currentPageName);

  return (
    <div className={`min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 ${!hideNavigation ? 'pb-20' : ''}`}>
      <style>{`
        :root {
          --primary: #1E40AF;
          --primary-dark: #1E3A8A;
          --bg-dark: #0A0A0A;
          --bg-card: #1A1A1A;
        }
      `}</style>

      {/* Header - Escondido durante execução de treino, onboarding e setup */}
      {!hideNavigation && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">FitTrack+</h1>
            </div>
            <Link to={createPageUrl("Subscription")}>
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-full text-sm font-medium transition-all duration-300 shadow-lg shadow-blue-900/50">
                <Crown className="w-4 h-4" />
                Premium
              </button>
            </Link>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={!hideNavigation ? 'pt-20 max-w-7xl mx-auto px-4' : ''}>
        {children}
      </main>

      {/* Bottom Navigation - Escondido durante execução de treino, onboarding e setup */}
      {!hideNavigation && (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/50 z-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex overflow-x-auto scrollbar-hide py-2 px-2">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                      isActive
                        ? "bg-blue-600/20 text-blue-400"
                        : "text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""}`} />
                    <span className="text-xs font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
