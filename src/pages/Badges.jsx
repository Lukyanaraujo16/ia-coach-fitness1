import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Award, Star, Target } from "lucide-react";
import BadgeDisplay from "../components/gamification/BadgeDisplay";

export default function Badges() {
  const [activeTab, setActiveTab] = useState("all");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: badges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: () => base44.entities.Badge.list(),
  });

  const userBadges = user?.badges || [];
  const earnedCount = badges.filter(b => userBadges.includes(b.id)).length;
  const totalCount = badges.filter(b => !b.is_secret).length + earnedCount;

  const filteredBadges = badges.filter(badge => {
    if (activeTab === "all") return true;
    if (activeTab === "earned") return userBadges.includes(badge.id);
    return badge.category === activeTab;
  });

  const categories = [
    { value: "all", label: "Todos", icon: Star },
    { value: "earned", label: "Conquistados", icon: Trophy },
    { value: "workout", label: "Treinos", icon: Target },
    { value: "community", label: "Comunidade", icon: Award },
  ];

  return (
    <div className="py-6 space-y-6">
      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-400" />
          Conquistas
        </h2>
        <p className="text-slate-400">
          Complete desafios e ganhe badges especiais!
        </p>
      </div>

      {/* Progress Summary */}
      <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/20 border-purple-700/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-300 text-sm">Progresso</p>
              <p className="text-white text-3xl font-bold">
                {earnedCount} / {totalCount}
              </p>
            </div>
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
              <Trophy className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (earnedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800 w-full grid grid-cols-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <TabsTrigger key={cat.value} value={cat.value} className="data-[state=active]:bg-purple-600">
                <Icon className="w-4 h-4 mr-2" />
                {cat.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Badges Grid */}
      <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
        {filteredBadges.map((badge) => {
          const earned = userBadges.includes(badge.id);
          return (
            <div key={badge.id} className="flex flex-col items-center gap-2">
              <BadgeDisplay badge={badge} earned={earned} size="md" />
              <p className="text-slate-300 text-xs text-center font-medium">
                {!earned && badge.is_secret ? "???" : badge.title}
              </p>
            </div>
          );
        })}
      </div>

      {filteredBadges.length === 0 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="py-12 text-center">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Nenhuma conquista nesta categoria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}