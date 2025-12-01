import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Square, Clock, Flame, Droplets, Brain, Zap, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const FASTING_STAGES = [
  { hours: 0, icon: Droplets, title: "Início", description: "Níveis de insulina começam a cair", color: "text-blue-400" },
  { hours: 4, icon: Flame, title: "Queima de Gordura", description: "Corpo começa a usar gordura como energia", color: "text-orange-400" },
  { hours: 12, icon: Zap, title: "Cetose Leve", description: "Produção de cetonas aumenta", color: "text-yellow-400" },
  { hours: 16, icon: Brain, title: "Autofagia", description: "Processo de limpeza celular ativado", color: "text-purple-400" },
  { hours: 24, icon: Flame, title: "Cetose Profunda", description: "Máxima queima de gordura", color: "text-red-400" },
];

export default function FastingTimer({ activeFast, onStart, onEnd, settings, selectedType }) {
  const [elapsed, setElapsed] = useState(0);
  const [currentStage, setCurrentStage] = useState(null);
  const [showTypeWarning, setShowTypeWarning] = useState(false);

  const handleStartClick = () => {
    if (!selectedType) {
      setShowTypeWarning(true);
      toast.error("Escolha um tipo de jejum primeiro! 👆", {
        description: "Selecione entre 14/10, 16/8, 18/6, 20/4, 24h ou personalizado abaixo.",
        duration: 4000,
      });
      setTimeout(() => setShowTypeWarning(false), 3000);
      return;
    }
    onStart();
  };

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

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!activeFast) return 0;
    const totalSeconds = activeFast.fasting_hours * 3600;
    return Math.min((elapsed / totalSeconds) * 100, 100);
  };

  const getRemainingTime = () => {
    if (!activeFast) return "00:00:00";
    const totalSeconds = activeFast.fasting_hours * 3600;
    const remaining = Math.max(0, totalSeconds - elapsed);
    return formatTime(remaining);
  };

  const progress = getProgress();
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
      <CardContent className="p-6">
        {/* Timer Circle */}
        <div className="relative flex items-center justify-center mb-6">
          <svg className="w-64 h-64 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-slate-700"
            />
            {/* Progress circle */}
            <motion.circle
              cx="128"
              cy="128"
              r="120"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.5 }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {activeFast ? (
              <>
                <p className="text-slate-400 text-sm mb-1">Tempo em jejum</p>
                <p className="text-4xl font-bold text-white font-mono">{formatTime(elapsed)}</p>
                <p className="text-slate-400 text-sm mt-2">Restante: {getRemainingTime()}</p>
                <p className="text-green-400 font-semibold mt-1">{Math.round(progress)}%</p>
                <p className="text-blue-400 text-xs mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Termina às {new Date(activeFast.planned_end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                </p>
              </>
            ) : (
              <>
                <Clock className="w-12 h-12 text-slate-500 mb-2" />
                <p className="text-slate-400 text-center">Pronto para<br />começar?</p>
              </>
            )}
          </div>
        </div>

        {/* Current Stage */}
        {activeFast && currentStage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center ${currentStage.color}`}>
                <currentStage.icon className="w-6 h-6" />
              </div>
              <div>
                <p className={`font-semibold ${currentStage.color}`}>{currentStage.title}</p>
                <p className="text-slate-400 text-sm">{currentStage.description}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!activeFast ? (
                        <div className="space-y-3">
                          <Button
                            onClick={handleStartClick}
                            className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-lg"
                          >
                            <Play className="w-6 h-6 mr-2" />
                            Iniciar Jejum
                          </Button>
                          <AnimatePresence>
                            {showTypeWarning && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-2 p-3 bg-orange-900/30 border border-orange-700/50 rounded-lg"
                              >
                                <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                                <p className="text-orange-300 text-sm">
                                  Escolha um tipo de jejum abaixo antes de iniciar!
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
            <Button
              onClick={onEnd}
              variant="outline"
              className="w-full h-14 border-red-600 text-red-400 hover:bg-red-600/20 text-lg"
            >
              <Square className="w-6 h-6 mr-2" />
              Encerrar Jejum
            </Button>
          )}
        </div>

        {/* Fasting Type Info */}
        {activeFast && (
          <div className="mt-4 text-center space-y-1">
            <p className="text-slate-400 text-sm">
              Jejum {activeFast.fasting_type} • {activeFast.fasting_hours}h jejum / {activeFast.eating_hours}h alimentação
            </p>
            <p className="text-blue-400 text-sm font-medium">
              🔔 Seu jejum termina às {new Date(activeFast.planned_end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}