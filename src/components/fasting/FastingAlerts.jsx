import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Utensils, TrendingUp, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function FastingAlerts({ activeFast, logs = [], mealLogs = [], settings }) {
  const alerts = [];

  // Check for meal during fasting window
  if (activeFast) {
    const fastStart = new Date(activeFast.start_time);
    const now = new Date();
    
    const todayMeals = mealLogs.filter(meal => {
      const mealDate = new Date(meal.created_date);
      return mealDate >= fastStart && mealDate <= now;
    });

    if (todayMeals.length > 0) {
      alerts.push({
        type: "warning",
        icon: Utensils,
        title: "Refeição durante jejum!",
        message: `Você registrou ${todayMeals.length} refeição(ões) durante o jejum. Isso pode ter quebrado seu jejum.`,
        color: "from-red-900/30 to-red-800/20",
        borderColor: "border-red-700/50",
        iconColor: "text-red-400",
      });
    }
  }

  // Check for consecutive long fasts (warning for safety)
  const recentLogs = logs.filter(log => {
    const logDate = new Date(log.start_time);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return logDate >= weekAgo && log.status === 'completed';
  });

  const longFasts = recentLogs.filter(log => (log.duration_minutes || 0) >= 20 * 60);
  if (longFasts.length >= 3) {
    alerts.push({
      type: "caution",
      icon: AlertTriangle,
      title: "Muitos jejuns longos!",
      message: "Você completou 3+ jejuns de 20h+ esta semana. Considere alternar com jejuns mais curtos para melhor recuperação.",
      color: "from-yellow-900/30 to-yellow-800/20",
      borderColor: "border-yellow-700/50",
      iconColor: "text-yellow-400",
    });
  }

  // Streak achievement
  if (settings?.streak_days >= 7) {
    alerts.push({
      type: "success",
      icon: Award,
      title: `Sequência de ${settings.streak_days} dias! 🎉`,
      message: "Você está mantendo uma excelente consistência. Continue assim!",
      color: "from-green-900/30 to-green-800/20",
      borderColor: "border-green-700/50",
      iconColor: "text-green-400",
    });
  }

  // Suggest routine if consistent
  const consecutiveSameType = recentLogs.filter(log => log.fasting_type === settings?.preferred_fasting_type);
  if (consecutiveSameType.length >= 5 && !settings?.auto_start_enabled) {
    alerts.push({
      type: "suggestion",
      icon: TrendingUp,
      title: "Sugestão de rotina",
      message: `Você tem feito jejum ${settings?.preferred_fasting_type} consistentemente. Que tal ativar o modo automático?`,
      color: "from-blue-900/30 to-blue-800/20",
      borderColor: "border-blue-700/50",
      iconColor: "text-blue-400",
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((alert, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <Card className={`bg-gradient-to-r ${alert.color} border ${alert.borderColor}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <alert.icon className={`w-5 h-5 ${alert.iconColor} flex-shrink-0 mt-0.5`} />
                <div>
                  <p className="text-white font-medium">{alert.title}</p>
                  <p className="text-slate-300 text-sm mt-1">{alert.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}