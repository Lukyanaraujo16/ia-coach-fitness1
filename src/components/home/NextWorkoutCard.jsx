import React, { useState, useEffect, useRef } from "react";
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
  const hasLoadedUser = useRef(false);

  useEffect(() => {
    let mounted = true;
    
    const loadUser = async () => {
      if (hasLoadedUser.current || !mounted) return;
      
      try {
        const currentUser = await base44.auth.me();
        if (!mounted) return;
        
        hasLoadedUser.current = true;
        setUser(currentUser);
      } catch (error) {
        console.error("Error:", error);
      }
    };
    
    loadUser();
    
    return () => {
      mounted = false;
    };
  }, []);

  const workoutId = user?.selected_workout_id;

  const { data: workout } = useQuery({
    queryKey: ['selected-workout', workoutId],
    queryFn: async () => {
      const workouts = await base44.entities.Workout.list();
      return workouts.find(w => w.id === workoutId);
    },
    enabled: Boolean(workoutId),
    staleTime: 60000,
  });

  if (!user?.selected_workout_id || !workout) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-12 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold mb-2">Nenhum Treino Selecionado</h3>
            <p className="text-slate-400 text-sm mb-4">
              Escolha um treino para começar sua jornada fitness!
            </p>
            <Link to={createPageUrl("Workouts")}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Escolher Treino
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentDayNumber = user.current_workout_day || 1;
  const currentDay = workout.days?.find(d => d.day_number === currentDayNumber);
  const completedDays = user.completed_workout_days || [];
  const totalDays = workout.days?.length || 0;

  return (
    <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-800/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Próximo Treino
          </CardTitle>
          <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded">
            Dia {currentDayNumber}/{totalDays}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-white font-bold text-lg mb-1">{currentDay?.title || "Treino"}</h3>
          <p className="text-slate-400 text-sm">{workout.title}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <p className="text-white font-bold text-sm">{workout.duration_minutes}min</p>
            <p className="text-slate-500 text-xs">Duração</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <Zap className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
            <p className="text-white font-bold text-sm">{currentDay?.exercises?.length || 0}</p>
            <p className="text-slate-500 text-xs">Exercícios</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <TrendingUp className="w-4 h-4 text-green-400 mx-auto mb-1" />
            <p className="text-white font-bold text-sm">{difficultyLabels[workout.difficulty]}</p>
            <p className="text-slate-500 text-xs">Nível</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Progresso</span>
          <span className="text-blue-400 font-semibold">
            {completedDays.length}/{totalDays} dias
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
            style={{ width: `${(completedDays.length / totalDays) * 100}%` }}
          />
        </div>

        <Button
          onClick={() => navigate(`${createPageUrl("WorkoutExecution")}?id=${workout.id}&day=${currentDayNumber}`)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 h-12 text-base font-semibold"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Iniciar Treino
        </Button>
      </CardContent>
    </Card>
  );
}