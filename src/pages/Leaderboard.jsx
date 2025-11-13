import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, TrendingUp, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("all");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin(createPageUrl("Leaderboard"));
      }
    };
    loadUser();
  }, []);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  // Filtrar usuários ativos e ordenar por XP
  const sortedUsers = allUsers
    .filter(u => u.is_active !== false)
    .sort((a, b) => {
      const xpA = activeTab === 'all' ? (a.xp || 0) : 
                  activeTab === 'weekly' ? (a.weekly_xp || 0) : 
                  (a.monthly_xp || 0);
      const xpB = activeTab === 'all' ? (b.xp || 0) : 
                  activeTab === 'weekly' ? (b.weekly_xp || 0) : 
                  (b.monthly_xp || 0);
      return xpB - xpA;
    })
    .slice(0, 50);

  const currentUserRank = sortedUsers.findIndex(u => u.id === user?.id) + 1;

  const getRankIcon = (rank) => {
    if (rank === 1) return { icon: Trophy, color: "text-yellow-400", bg: "bg-yellow-500/20" };
    if (rank === 2) return { icon: Medal, color: "text-slate-300", bg: "bg-slate-500/20" };
    if (rank === 3) return { icon: Award, color: "text-orange-400", bg: "bg-orange-500/20" };
    return { icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/20" };
  };

  const getPodiumBg = (rank) => {
    if (rank === 1) return "from-yellow-900/50 to-yellow-800/20 border-yellow-700/50";
    if (rank === 2) return "from-slate-800/50 to-slate-700/20 border-slate-600/50";
    if (rank === 3) return "from-orange-900/50 to-orange-800/20 border-orange-700/50";
  };

  const getXpValue = (user) => {
    if (activeTab === 'all') return user.xp || 0;
    if (activeTab === 'weekly') return user.weekly_xp || 0;
    return user.monthly_xp || 0;
  };

  const leaderboardEnabled = user?.leaderboard_enabled !== false;

  if (!user) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  if (!leaderboardEnabled) {
    return (
      <div className="py-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="py-24 text-center">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Ranking Temporariamente Desativado
            </h3>
            <p className="text-slate-400 max-w-md mx-auto">
              O ranking está em manutenção no momento. Volte em breve!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold text-white">🏆 Ranking</h2>
        <p className="text-slate-400">Veja quem está liderando a comunidade</p>
      </div>

      {/* Current User Position */}
      {currentUserRank > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{currentUserRank}º</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Sua Posição</p>
                    <p className="text-blue-300 text-sm">{getXpValue(user).toLocaleString()} XP</p>
                  </div>
                </div>
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800 w-full grid grid-cols-3">
          <TabsTrigger value="all" className="data-[state=active]:bg-blue-600">
            Geral
          </TabsTrigger>
          <TabsTrigger value="weekly" className="data-[state=active]:bg-blue-600">
            Semanal
          </TabsTrigger>
          <TabsTrigger value="monthly" className="data-[state=active]:bg-blue-600">
            Mensal
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Top 3 Podium */}
      {sortedUsers.length >= 3 && (
        <div className="grid md:grid-cols-3 gap-4">
          {[2, 1, 3].map((position) => {
            const userAtPosition = sortedUsers[position - 1];
            if (!userAtPosition) return null;
            const { icon: Icon, color, bg } = getRankIcon(position);
            
            return (
              <motion.div
                key={position}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: position * 0.1 }}
                className={position === 1 ? "md:order-2" : position === 2 ? "md:order-1" : "md:order-3"}
              >
                <Card className={`bg-gradient-to-br ${getPodiumBg(position)} border relative ${position === 1 ? 'md:scale-110' : ''}`}>
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 ${bg} rounded-full flex items-center justify-center mx-auto mb-3`}>
                      <Icon className={`w-8 h-8 ${color}`} />
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold text-lg">{position}º</span>
                    </div>
                    <h4 className="text-white font-bold text-lg mb-1">
                      {userAtPosition.nome_completo || 'Usuário'}
                    </h4>
                    <p className={`${color} font-semibold text-xl`}>
                      {getXpValue(userAtPosition).toLocaleString()} XP
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Ranking Completo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedUsers.map((rankedUser, index) => {
              const rank = index + 1;
              const { icon: Icon, color, bg } = getRankIcon(rank);
              const isCurrentUser = rankedUser.id === user?.id;
              
              return (
                <motion.div
                  key={rankedUser.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrentUser 
                      ? "bg-blue-900/30 border-blue-600/50" 
                      : "bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center`}>
                        {rank <= 3 ? (
                          <Icon className={`w-5 h-5 ${color}`} />
                        ) : (
                          <span className="text-slate-400 font-bold">{rank}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            {rankedUser.nome_completo?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className={`font-semibold ${isCurrentUser ? 'text-blue-300' : 'text-white'}`}>
                            {rankedUser.nome_completo || 'Usuário'}
                            {isCurrentUser && <span className="ml-2 text-xs">(Você)</span>}
                          </p>
                          <p className="text-slate-400 text-sm">Level {rankedUser.level || 1}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${rank <= 3 ? color : 'text-white'}`}>
                        {getXpValue(rankedUser).toLocaleString()}
                      </p>
                      <p className="text-slate-500 text-xs">XP</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {sortedUsers.length === 0 && (
            <p className="text-center text-slate-400 py-12">
              Nenhum usuário no ranking ainda
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}