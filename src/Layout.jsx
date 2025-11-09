import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Dumbbell, TrendingUp, Users, User, Crown, Shield, Apple, Sparkles, Menu, X, LogOut, Trophy, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

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
  ];

  if (user?.community_enabled !== false) {
    navigationItems.push({ name: "Comunidade", path: createPageUrl("Community"), icon: Users });
  }

  navigationItems.push({ name: "Ranking", path: createPageUrl("Leaderboard"), icon: Trophy });
  navigationItems.push({ name: "Perfil", path: createPageUrl("Profile"), icon: User });

  if (user?.subscription_status === 'premium') {
    navigationItems.splice(6, 0, {
      name: "Coach IA",
      path: createPageUrl("AICoach"),
      icon: Sparkles,
    });
  }

  if (user?.role === 'admin') {
    navigationItems.push({
      name: "Admin",
      path: createPageUrl("Admin"),
      icon: Shield,
    });
  }

  // Esconder navegação em páginas especiais E na página Welcome
  const hideNavigation = ["WorkoutExecution", "Onboarding", "NutritionSetup", "WorkoutSetup", "LandingPage", "Welcome"].includes(currentPageName);

  const isPremium = user?.subscription_status === 'premium';

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 ${!hideNavigation ? 'pb-20 md:pb-0' : ''}`}>
      <style>{`
        :root {
          --primary: #1E40AF;
          --primary-dark: #1E3A8A;
          --bg-dark: #0A0A0A;
          --bg-card: #1A1A1A;
        }
      `}</style>

      {!hideNavigation && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to={createPageUrl("Home")} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">FitTrack+</h1>
            </Link>
            <div className="flex items-center gap-2">
              <nav className="hidden md:flex items-center gap-1">
                {navigationItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </Link>
                  );
                })}
                {!isPremium && (
                  <Link to={createPageUrl("Subscription")}>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg text-sm font-medium transition-all duration-300 shadow-lg shadow-blue-900/50 ml-2">
                      <Crown className="w-4 h-4" />
                      Premium
                    </button>
                  </Link>
                )}
              </nav>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenu(!showMenu)}
                className="text-white hover:bg-slate-800 md:hidden"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </header>
      )}

      <main className={!hideNavigation ? 'pt-20 max-w-7xl mx-auto px-4' : ''}>
        {children}
      </main>

      {showMenu && !hideNavigation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden" onClick={() => setShowMenu(false)}>
          <div className="fixed inset-y-0 right-0 w-64 bg-slate-900 shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h2 className="text-white font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenu(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setShowMenu(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
              
              <Link
                to={createPageUrl("MyWorkouts")}
                onClick={() => setShowMenu(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  location.pathname === createPageUrl("MyWorkouts")
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Dumbbell className="w-5 h-5" />
                <span className="font-medium">Meus Treinos</span>
              </Link>

              <Link
                to={createPageUrl("Badges")}
                onClick={() => setShowMenu(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  location.pathname === createPageUrl("Badges")
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white hover:hover:bg-slate-800"
                }`}
              >
                <Award className="w-5 h-5" />
                <span className="font-medium">Conquistas</span>
              </Link>

              {!isPremium && (
                <Link
                  to={createPageUrl("Subscription")}
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >
                  <Crown className="w-5 h-5" />
                  <span className="font-medium">Assinar Premium</span>
                </Link>
              )}
            </nav>

            <div className="p-4 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowMenu(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-900/20 w-full transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sair da Conta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {!hideNavigation && (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/50 z-50 md:hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-4 gap-1 p-2">
              {navigationItems.slice(0, 4).map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all ${
                      isActive
                        ? "bg-blue-600/20 text-blue-400"
                        : "text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""}`} />
                    <span className="text-[10px] font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}