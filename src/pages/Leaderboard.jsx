import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Crown, Zap, TrendingUp, Award } from "lucide-react";
import { motion } from "framer-motion";
import XPBar from "../components/gamification/XPBar";

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("all_time");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: users = [] } = useQuery({
    queryKey: ['all-users-leaderboard'],
    queryFn: () => base44.entities.User.list(),
  });

  // Ordenar usuários por XP
  const getSortedUsers = () => {
    const activeUsers = users.filter(u => u.is_active !== false);
    
    if (activeTab === "weekly") {
      return [...activeUsers].sort((a, b) => (b.weekly_xp || 0) - (a.weekly_xp || 0)).slice(0, 50);
    } else if (activeTab === "monthly") {
      return [...activeUsers].sort((a, b) => (b.monthly_xp || 0) - (a.monthly_xp || 0)).slice(0, 50);
    } else {
      return [...activeUsers].sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 50);
    }
  };

  const sortedUsers = getSortedUsers();
  const currentUserRank = sortedUsers.findIndex(u => u.email === user?.email) + 1;

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-600" />;
    return null;
  };

  const getRankBg = (rank) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-900/30 to-yellow-800/20 border-yellow-700/50";
    if (rank === 2) return "bg-gradient-to-r from-slate-700/30 to-slate-600/20 border-slate-500/50";
    if (rank === 3) return "bg-gradient-to-r from-orange-900/30 to-orange-800/20 border-orange-700/50";
    return "bg-slate-900/50 border-slate-800";
  };

  const getXPValue = (user) => {
    if (activeTab === "weekly") return user.weekly_xp || 0;
    if (activeTab === "monthly") return user.monthly_xp || 0;
    return user.xp || 0;
  };

  return (
    <div className="py-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-400" />
          Ranking
        </h2>
        <p className="text-slate-400">
          Compete com outros atletas e alcance o topo!
        </p>
      </div>

      {/* Current User Position */}
      {user && currentUserRank > 0 && (
        <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/20 border-blue-700/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                {currentUserRank <= 3 ? getRankIcon(currentUserRank) : `#${currentUserRank}`}
              </div>
              <div className="flex-1">
                <p className="text-slate-400 text-sm">Sua Posição</p>
                <p className="text-white text-xl font-bold">{user.full_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400 font-semibold">{getXPValue(user).toLocaleString()} XP</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-xs">Nível</p>
                <p className="text-white text-2xl font-bold">{user.level || 1}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800 w-full grid grid-cols-3">
          <TabsTrigger value="all_time" className="data-[state=active]:bg-blue-600">
            <Trophy className="w-4 h-4 mr-2" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="weekly" className="data-[state=active]:bg-blue-600">
            <TrendingUp className="w-4 h-4 mr-2" />
            Semanal
          </TabsTrigger>
          <TabsTrigger value="monthly" className="data-[state=active]:bg-blue-600">
            <Award className="w-4 h-4 mr-2" />
            Mensal
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Top 3 Podium */}
      {sortedUsers.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 mb-6">
          {/* 2nd Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mb-2 shadow-lg">
              <Medal className="w-8 h-8 text-slate-300" />
            </div>
            <div className="bg-slate-800 rounded-lg p-3 text-center w-full">
              <p className="text-white font-semibold text-sm truncate">{sortedUsers[1]?.full_name}</p>
              <p className="text-slate-400 text-xs mt-1">{getXPValue(sortedUsers[1]).toLocaleString()} XP</p>
            </div>
          </motion.div>

          {/* 1st Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center -mt-4"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mb-2 shadow-2xl shadow-yellow-500/50 relative">
              <Crown className="w-10 h-10 text-white" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold">
                1
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-900/50 to-orange-900/30 border border-yellow-700/50 rounded-lg p-3 text-center w-full">
              <p className="text-white font-bold truncate">{sortedUsers[0]?.full_name}</p>
              <p className="text-yellow-400 text-sm font-semibold mt-1">{getXPValue(sortedUsers[0]).toLocaleString()} XP</p>
            </div>
          </motion.div>

          {/* 3rd Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl flex items-center justify-center mb-2 shadow-lg">
              <Medal className="w-8 h-8 text-orange-300" />
            </div>
            <div className="bg-slate-800 rounded-lg p-3 text-center w-full">
              <p className="text-white font-semibold text-sm truncate">{sortedUsers[2]?.full_name}</p>
              <p className="text-slate-400 text-xs mt-1">{getXPValue(sortedUsers[2]).toLocaleString()} XP</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="space-y-2">
        {sortedUsers.map((leaderUser, index) => {
          const rank = index + 1;
          const isCurrentUser = leaderUser.email === user?.email;
          
          return (
            <motion.div
              key={leaderUser.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <Card className={`${getRankBg(rank)} ${isCurrentUser ? "ring-2 ring-blue-500" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 text-center">
                      {rank <= 3 ? (
                        getRankIcon(rank)
                      ) : (
                        <span className="text-slate-400 font-bold text-lg">#{rank}</span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold ${isCurrentUser ? "text-blue-400" : "text-white"}`}>
                          {leaderUser.full_name}
                          {isCurrentUser && <span className="text-xs text-blue-400 ml-2">(Você)</span>}
                        </p>
                      </div>
                      <XPBar xp={leaderUser.xp || 0} compact />
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 text-blue-400 mb-1">
                        <Zap className="w-4 h-4" />
                        <span className="font-bold">{getXPValue(leaderUser).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-500 text-xs">XP</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {sortedUsers.length === 0 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="py-12 text-center">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Nenhum usuário no ranking ainda</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}