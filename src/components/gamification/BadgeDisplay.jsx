import React from "react";
import { Trophy, Award, Star, Flame, Target, Users, Crown, Zap, Heart, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

const iconMap = {
  Trophy, Award, Star, Flame, Target, Users, Crown, Zap, Heart, TrendingUp
};

const rarityColors = {
  common: "from-slate-600 to-slate-700 border-slate-500",
  rare: "from-blue-600 to-blue-700 border-blue-500",
  epic: "from-purple-600 to-purple-700 border-purple-500",
  legendary: "from-yellow-500 to-orange-600 border-yellow-400"
};

const rarityGlow = {
  common: "shadow-slate-500/20",
  rare: "shadow-blue-500/40",
  epic: "shadow-purple-500/50",
  legendary: "shadow-yellow-500/60"
};

export default function BadgeDisplay({ badge, earned = false, size = "md", showDetails = true }) {
  const Icon = iconMap[badge.icon] || Trophy;
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20"
  };

  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10"
  };

  if (!earned && badge.is_secret) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`${sizeClasses[size]} bg-slate-800 border-2 border-slate-700 rounded-xl flex items-center justify-center relative`}
      >
        <div className="text-slate-600 text-2xl">?</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="relative group"
    >
      <div
        className={`${sizeClasses[size]} bg-gradient-to-br ${
          earned ? rarityColors[badge.rarity] : "from-slate-700 to-slate-800 border-slate-600"
        } border-2 rounded-xl flex items-center justify-center relative ${
          earned ? `shadow-lg ${rarityGlow[badge.rarity]}` : "opacity-40"
        } transition-all duration-300`}
      >
        <Icon className={`${iconSizes[size]} ${earned ? "text-white" : "text-slate-500"}`} />
        
        {earned && badge.rarity === "legendary" && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-yellow-500/20 to-transparent animate-pulse" />
        )}
      </div>

      {showDetails && (
        <Card className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 border-slate-800 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
          <CardContent className="p-3">
            <div className="flex items-start gap-2 mb-2">
              <div className={`w-8 h-8 bg-gradient-to-br ${rarityColors[badge.rarity]} border rounded-lg flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold text-sm">{badge.title}</h4>
                <p className="text-xs text-slate-400 capitalize">{badge.rarity}</p>
              </div>
            </div>
            <p className="text-slate-300 text-xs mb-2">{badge.description}</p>
            {badge.xp_reward && (
              <div className="flex items-center gap-1 text-blue-400 text-xs">
                <Zap className="w-3 h-3" />
                <span>+{badge.xp_reward} XP</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}