import React from "react";
import { Flame, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function StreakCounter({ currentStreak = 0, longestStreak = 0, compact = false }) {
  const getStreakColor = (streak) => {
    if (streak >= 30) return "from-purple-600 to-pink-600";
    if (streak >= 14) return "from-orange-600 to-red-600";
    if (streak >= 7) return "from-yellow-500 to-orange-500";
    return "from-blue-600 to-cyan-600";
  };

  const getStreakMessage = (streak) => {
    if (streak === 0) return "Comece sua sequência!";
    if (streak === 1) return "Bom começo!";
    if (streak < 7) return "Continue assim!";
    if (streak < 14) return "Você está pegando fogo! 🔥";
    if (streak < 30) return "Imparável! 💪";
    return "LENDÁRIO! 🏆";
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ scale: currentStreak > 0 ? [1, 1.2, 1] : 1 }}
          transition={{ repeat: currentStreak >= 7 ? Infinity : 0, duration: 2 }}
          className={`flex items-center gap-1 px-2 py-1 bg-gradient-to-r ${getStreakColor(currentStreak)} rounded-full`}
        >
          <Flame className="w-3 h-3 text-white" />
          <span className="text-white font-bold text-xs">{currentStreak}</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: currentStreak > 0 ? [1, 1.1, 1] : 1 }}
            transition={{ repeat: currentStreak >= 7 ? Infinity : 0, duration: 2 }}
            className={`w-14 h-14 bg-gradient-to-br ${getStreakColor(currentStreak)} rounded-xl flex items-center justify-center shadow-lg`}
          >
            <Flame className="w-7 h-7 text-white" />
          </motion.div>
          <div>
            <p className="text-slate-400 text-xs">Sequência Atual</p>
            <p className="text-white text-2xl font-bold">{currentStreak} {currentStreak === 1 ? "dia" : "dias"}</p>
            <p className="text-xs text-slate-500">{getStreakMessage(currentStreak)}</p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 text-yellow-400 mb-1">
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-slate-400 text-xs">Recorde</p>
          <p className="text-white font-bold">{longestStreak}</p>
        </div>
      </div>

      {currentStreak > 0 && (
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <p className="text-slate-300 text-xs text-center">
            {currentStreak < 7 ? (
              `Continue por mais ${7 - currentStreak} ${7 - currentStreak === 1 ? "dia" : "dias"} para o próximo marco!`
            ) : currentStreak < 14 ? (
              `Faltam ${14 - currentStreak} ${14 - currentStreak === 1 ? "dia" : "dias"} para 2 semanas! 🔥`
            ) : currentStreak < 30 ? (
              `${30 - currentStreak} ${30 - currentStreak === 1 ? "dia" : "dias"} para 1 mês completo! 💪`
            ) : (
              "Você é uma MÁQUINA! Continue assim! 🏆"
            )}
          </p>
        </div>
      )}
    </div>
  );
}