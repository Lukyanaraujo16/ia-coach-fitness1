import React from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

// Sistema de níveis: XP necessário cresce exponencialmente
const getXPForLevel = (level) => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

const getLevelInfo = (xp) => {
  let currentLevel = 1;
  let totalXPForCurrentLevel = 0;
  
  while (totalXPForCurrentLevel + getXPForLevel(currentLevel) <= xp) {
    totalXPForCurrentLevel += getXPForLevel(currentLevel);
    currentLevel++;
  }
  
  const xpInCurrentLevel = xp - totalXPForCurrentLevel;
  const xpNeededForNextLevel = getXPForLevel(currentLevel);
  const progress = (xpInCurrentLevel / xpNeededForNextLevel) * 100;
  
  return {
    level: currentLevel,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    progress: Math.min(progress, 100),
  };
};

const getLevelTitle = (level) => {
  if (level >= 50) return "Lenda Fitness";
  if (level >= 40) return "Mestre Supremo";
  if (level >= 30) return "Campeão Elite";
  if (level >= 25) return "Gladiador";
  if (level >= 20) return "Titã";
  if (level >= 15) return "Guerreiro";
  if (level >= 10) return "Atleta";
  if (level >= 5) return "Aprendiz";
  return "Iniciante";
};

export default function XPBar({ xp = 0, compact = false }) {
  const { level, xpInCurrentLevel, xpNeededForNextLevel, progress } = getLevelInfo(xp);
  const title = getLevelTitle(level);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-1 bg-blue-600/20 border border-blue-600/30 rounded-full">
          <Zap className="w-3 h-3 text-blue-400" />
          <span className="text-blue-400 font-bold text-xs">Nv {level}</span>
        </div>
        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden max-w-[100px]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">Nível {level}</span>
              <span className="text-blue-400 text-sm">• {title}</span>
            </div>
            <p className="text-slate-400 text-xs">
              {xpInCurrentLevel} / {xpNeededForNextLevel} XP
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-xs">Total</p>
          <p className="text-white font-bold">{xp.toLocaleString()} XP</p>
        </div>
      </div>
      
      <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative"
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </motion.div>
      </div>
    </div>
  );
}