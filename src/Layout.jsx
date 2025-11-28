import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Dumbbell, TrendingUp, Users, User, Shield, Apple, Sparkles, Menu, X, LogOut, Trophy, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import TrialChecker from "./components/TrialChecker";
import PWAManager from "./components/PWAManager";
import NotificationChecker from "./components/NotificationChecker";
import NotificationPermissionModal from "./components/pwa/NotificationPermissionModal";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Páginas públicas que não precisam de autenticação
  const publicPages = ["Home", "LandingPage"];
  const isPublicPage = publicPages.includes(currentPageName);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Verificar se é primeira vez no PWA e ainda não pediu notificação
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                    window.navigator.standalone === true;
      const hasAskedPermission = localStorage.getItem('notification-permission-asked');
      
      // Desabilitado temporariamente
      // if (isPWA && !hasAskedPermission && Notification.permission === 'default') {
      //   setTimeout(() => {
      //     setShowNotificationModal(true);
      //   }, 2000);
      // }
    } catch (error) {
      // Em páginas públicas, ignora o erro silenciosamente
      if (!isPublicPage) {
        console.error("Error loading user:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, [currentPageName]);

  useEffect(() => {
    // Adicionar meta tags do PWA dinamicamente
    const addMetaTag = (name, content) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    addMetaTag('theme-color', '#1E40AF');
    addMetaTag('apple-mobile-web-app-capable', 'yes');
    addMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
    addMetaTag('apple-mobile-web-app-title', 'IA Coach');

    // Desabilitar sugestão de tradução do Chrome
    let translateMeta = document.querySelector('meta[name="google"]');
    if (!translateMeta) {
      translateMeta = document.createElement('meta');
      translateMeta.name = 'google';
      document.head.appendChild(translateMeta);
    }
    translateMeta.content = 'notranslate';

    // Adicionar lang pt-BR no html
    document.documentElement.lang = 'pt-BR';

    // Adicionar link para manifest
    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      manifestLink.href = '/manifest.json';
      document.head.appendChild(manifestLink);
    }

    // Adicionar link para ícone
    let iconLink = document.querySelector('link[rel="apple-touch-icon"]');
    if (!iconLink) {
      iconLink = document.createElement('link');
      iconLink.rel = 'apple-touch-icon';
      iconLink.href = '/icon-192.png';
      document.head.appendChild(iconLink);
    }
  }, []);

  const handleTrialExpired = () => {
    loadUser();
  };

  const isPremium = user?.subscription_status === 'premium' || user?.subscription_status === 'trial' || user?.subscription_status === 'lifetime';

  const desktopNavigationItems = [
    { name: "Home", path: createPageUrl("Dashboard"), icon: Home },
    { name: "Treinos", path: createPageUrl("Workouts"), icon: Dumbbell },
    { name: "Nutrição", path: createPageUrl("Nutrition"), icon: Apple },
    { name: "Perfil", path: createPageUrl("Profile"), icon: User },
  ];

  if (isPremium) {
    desktopNavigationItems.splice(3, 0, {
      name: "Coach IA",
      path: createPageUrl("AICoach"),
      icon: Sparkles,
    });
  }

  if (user?.role === 'admin') {
    desktopNavigationItems.push({
      name: "Admin",
      path: createPageUrl("Admin"),
      icon: Shield,
    });
  }

  const mobileNavigationItems = [
    { name: "Home", path: createPageUrl("Dashboard"), icon: Home },
    { name: "Treinos", path: createPageUrl("Workouts"), icon: Dumbbell },
    { name: "Nutrição", path: createPageUrl("Nutrition"), icon: Apple },
  ];

  if (isPremium) {
    mobileNavigationItems.push({
      name: "Coach IA",
      path: createPageUrl("AICoach"),
      icon: Sparkles,
    });
  }

  const sideMenuItems = [
    { name: "Home", path: createPageUrl("Dashboard"), icon: Home },
    { name: "Treinos", path: createPageUrl("Workouts"), icon: Dumbbell },
    { name: "Nutrição", path: createPageUrl("Nutrition"), icon: Apple },
    { name: "Progresso", path: createPageUrl("Progress"), icon: TrendingUp },
    { name: "Perfil", path: createPageUrl("Profile"), icon: User },
    { name: "Meus Treinos", path: createPageUrl("MyWorkouts"), icon: Dumbbell },
    { name: "Conquistas", path: createPageUrl("Badges"), icon: Award },
  ];

  if (isPremium) {
    sideMenuItems.splice(3, 0, {
      name: "Coach IA",
      path: createPageUrl("AICoach"),
      icon: Sparkles,
    });
  }

  if (user?.community_enabled !== false) {
    sideMenuItems.splice(4, 0, { name: "Comunidade", path: createPageUrl("Community"), icon: Users });
  }

  if (user?.leaderboard_enabled !== false) {
    sideMenuItems.splice(5, 0, { name: "Ranking", path: createPageUrl("Leaderboard"), icon: Trophy });
  }

  if (user?.role === 'admin') {
    sideMenuItems.push({
      name: "Admin",
      path: createPageUrl("Admin"),
      icon: Shield,
    });
  }

  const specialPages = ["WorkoutExecution", "Onboarding", "NutritionSetup", "WorkoutSetup", "LandingPage", "Home"];
  // Esconde navegação apenas em páginas especiais OU se está carregando em páginas autenticadas
  const hideNavigation = specialPages.includes(currentPageName);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const logoUrl = user?.app_logo_url || "https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png";

  return (
    <div className={`min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 ${!hideNavigation ? 'pb-20 md:pb-0' : ''}`}>
      <PWAManager />
      {user && <NotificationChecker user={user} />}
      {showNotificationModal && (
        <NotificationPermissionModal onClose={() => setShowNotificationModal(false)} />
      )}

      <style>{`
        :root {
          --primary: #1E40AF;
          --primary-dark: #1E3A8A;
          --bg-dark: #0A0A0A;
          --bg-card: #1A1A1A;
        }
      `}</style>

      {user && <TrialChecker user={user} onTrialExpired={handleTrialExpired} />}

      {!hideNavigation && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2">
              <img 
                src={logoUrl} 
                alt="IA Coach Fitness" 
                className="h-8"
              />
            </Link>
            <div className="flex items-center gap-2">
              <nav className="hidden md:flex items-center gap-1">
                {desktopNavigationItems.map((item) => {
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
              {sideMenuItems.map((item) => {
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
              {mobileNavigationItems.map((item) => {
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