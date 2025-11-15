import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Flame, Target } from "lucide-react";

export default function ProfileStats({ user }) {
  const { data: workoutLogs = [] } = useQuery({
    queryKey: ['user-workout-logs', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allLogs = await base44.entities.WorkoutLog.list('-date');
      return allLogs.filter(log => log.user_email === user.email || log.created_by === user.email);
    },
    enabled: !!user?.email,
  });

  const totalWorkouts = workoutLogs.length;
  const totalCalories = workoutLogs.reduce((sum, log) => sum + (log.calories_burned || 0), 0);
  const currentWeight = user?.current_weight;
  const weightGoal = user?.weight_goal;

  return (
    <div className="grid grid-cols-3 gap-3">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4 text-center">
          <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{totalWorkouts}</p>
          <p className="text-xs text-slate-400">Treinos</p>
        </CardContent>
      </Card>
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4 text-center">
          <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{totalCalories}</p>
          <p className="text-xs text-slate-400">Calorias</p>
        </CardContent>
      </Card>
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4 text-center">
          <Target className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {currentWeight && weightGoal ? Math.abs(currentWeight - weightGoal).toFixed(1) : '-'}
          </p>
          <p className="text-xs text-slate-400">Meta (kg)</p>
        </CardContent>
      </Card>
    </div>
  );
}