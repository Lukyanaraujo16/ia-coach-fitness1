import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Zap, TrendingUp } from "lucide-react";

export default function NextWorkoutCard() {
  const { data: workouts = [] } = useQuery({
    queryKey: ['workouts'],
    queryFn: () => base44.entities.Workout.list('-created_date', 1),
  });

  const nextWorkout = workouts[0];

  if (!nextWorkout) {
    return (
      <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-700/50 backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <Zap className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <h3 className="text-white font-semibold mb-2">Nenhum treino agendado</h3>
          <p className="text-slate-400 text-sm mb-4">
            Explore nossa biblioteca e escolha seu próximo desafio
          </p>
          <Link to={createPageUrl("Workouts")}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Ver Treinos
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-700/50 backdrop-blur-sm overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
      <CardHeader>
        <CardTitle className="text-white">Próximo Treino</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{nextWorkout.title}</h3>
          <p className="text-slate-300 text-sm">{nextWorkout.description}</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{nextWorkout.duration_minutes}min</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm capitalize">{nextWorkout.difficulty}</span>
          </div>
        </div>
        <Link to={createPageUrl("Workouts")}>
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Iniciar Treino
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}