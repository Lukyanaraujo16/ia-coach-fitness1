import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Zap, TrendingUp, CheckCircle, Calendar } from "lucide-react";

const difficultyLabels = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

export default function NextWorkoutCard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: workout } = useQuery({
    queryKey: ['selected-workout', user?.selected_workout_id],
    queryFn: async () => {
      if (!user?.selected_workout_id) return null;
      const workouts = await base44.entities.Workout.list();
      return workouts.find(w => w.id === user.selected_workout_id);
    },
    enabled: !!user?.selected_workout_id,
  });

  if (!user?.selected_workout_id || !workout) {
    return (
      <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-700/50 backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <Zap className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <h3 className="text-white font-semibold mb-2">Nenhum treino selecionado</h3>
          <p className="text-slate-400 text-sm mb-4">
            Escolha um treino para começar sua jornada
          </p>
          <Link to={createPageUrl("WorkoutSelection")}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Escolher Treino
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const currentDay = user.current_workout_day || 1;
  const completedDays = user.completed_workout_days || [];
  const totalDays = workout.days?.length || 0;
  const currentDayData = workout.days?.find(d => d.day_number === currentDay);

  const handleStartDay = () => {
    navigate(createPageUrl("WorkoutExecution") + `?id=${workout.id}&day=${currentDay}`);
  };

  return (
    <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-700/50 backdrop-blur-sm overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
      <CardHeader>
        <CardTitle className="text-white">Próximo Treino</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{workout.title}</h3>
          <p className="text-slate-300 text-sm">{workout.description}</p>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
          <Calendar className="w-5 h-5 text-blue-400" />
          <div className="flex-1">
            <p className="text-white font-semibold">Dia {currentDay} de {totalDays}</p>
            <p className="text-slate-400 text-sm">{currentDayData?.exercises?.length || 0} exercícios</p>
          </div>
          {completedDays.includes(currentDay) && (
            <CheckCircle className="w-5 h-5 text-green-400" />
          )}
        </div>

        {/* Progress dos dias */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Progresso do Ciclo</span>
            <span className="text-blue-400 font-semibold">{completedDays.length}/{totalDays}</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
              <div
                key={day}
                className={`h-2 flex-1 rounded-full ${
                  completedDays.includes(day)
                    ? 'bg-green-500'
                    : day === currentDay
                    ? 'bg-blue-500'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{workout.duration_minutes}min</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm capitalize">{difficultyLabels[workout.difficulty]}</span>
          </div>
        </div>

        <Button onClick={handleStartDay} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          {completedDays.includes(currentDay) ? 'Refazer Dia' : 'Iniciar Dia'} {currentDay}
        </Button>
      </CardContent>
    </Card>
  );
}