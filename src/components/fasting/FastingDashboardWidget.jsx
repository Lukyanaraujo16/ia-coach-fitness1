import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Timer, ChevronRight, Droplets, Flame, Brain, Zap } from "lucide-react";
import { motion } from "framer-motion";

const FASTING_STAGES = [
  { hours: 0, icon: Droplets, title: "Início", description: "Insulina caindo", color: "text-blue-400", bg: "bg-blue-500" },
  { hours: 4, icon: Flame, title: "Queima de Gordura", description: "Usando gordura como energia", color: "text-orange-400", bg: "bg-orange-500" },
  { hours: 12, icon: Zap, title: "Cetose Leve", description: "Produção de cetonas", color: "text-yellow-400", bg: "bg-yellow-500" },
  { hours: 16, icon: Brain, title: "Autofagia", description: "Limpeza celular ativa", color: "text-purple-400", bg: "bg-purple-500" },
  { hours: 24, icon: Flame, title: "Cetose Profunda", description: "Máxima queima", color: "text-red-400", bg: "bg-red-500" },
];

export default function FastingDashboardWidget({ activeFast }) {
  const [elapsed, setElapsed] = useState(0);
  const [currentStage, setCurrentStage] = useState(null);

  useEffect(() => {
    if (!activeFast) {
      setElapsed(0);
      return;
    }

    const updateElapsed = () => {
      const start = new Date(activeFast.start_time);
      const now = new Date();
      const diff = Math.floor((now - start) / 1000);
      setElapsed(Math.max(0, diff));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeFast]);

  useEffect(() => {
    const hours = elapsed / 3600;
    const stage = [...FASTING_STAGES].reverse().find(s => hours >= s.hours);
    setCurrentStage(stage);
  }, [elapsed]);

  if (!activeFast) return null;

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const totalSeconds = activeFast.fasting_hours * 3600;
    return Math.min((elapsed / totalSeconds) * 100, 100);
  };

  const getRemainingTime = () => {
    const totalSeconds = activeFast.fasting_hours * 3600;
    const remaining = Math.max(0, totalSeconds - elapsed);
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    return `${h}h ${m}min restantes`;
  };

  const progress = getProgress();
  const StageIcon = currentStage?.icon || Timer;

  return (
    <Link to={createPageUrl("Fasting")}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-br from-green-900/40 to-emerald-900/30 border-green-700/50 hover:from-green-900/50 hover:to-emerald-900/40 transition-all cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-green-600/30 rounded-full flex items-center justify-center">
                  <Timer className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Jejum em Andamento</p>
                  <p className="text-slate-400 text-xs">{activeFast.fasting_type} • {getRemainingTime()}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>

            {/* Timer */}
            <div className="text-center mb-3">
              <p className="text-3xl font-bold text-white font-mono">{formatTime(elapsed)}</p>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Current Stage */}
            {currentStage && (
              <div className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg">
                <div className={`w-8 h-8 rounded-full ${currentStage.bg}/20 flex items-center justify-center`}>
                  <StageIcon className={`w-4 h-4 ${currentStage.color}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${currentStage.color}`}>{currentStage.title}</p>
                  <p className="text-slate-400 text-xs">{currentStage.description}</p>
                </div>
                <span className="text-green-400 font-bold text-sm">{Math.round(progress)}%</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}