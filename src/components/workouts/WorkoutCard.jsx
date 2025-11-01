import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Zap, Lock } from "lucide-react";

const categoryColors = {
  strength: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  cardio: "bg-red-500/20 text-red-400 border-red-500/30",
  hiit: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  flexibility: "bg-green-500/20 text-green-400 border-green-500/30",
  full_body: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const categoryLabels = {
  strength: "Força",
  cardio: "Cardio",
  hiit: "HIIT",
  flexibility: "Flexibilidade",
  full_body: "Corpo Inteiro",
};

const difficultyColors = {
  beginner: "bg-green-500/20 text-green-400",
  intermediate: "bg-yellow-500/20 text-yellow-400",
  advanced: "bg-red-500/20 text-red-400",
};

const difficultyLabels = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

export default function WorkoutCard({ workout }) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(createPageUrl("WorkoutDetail") + `?id=${workout.id}`);
  };

  const totalExercises = workout.days?.reduce((sum, day) => sum + (day.exercises?.length || 0), 0) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm overflow-hidden hover:border-blue-600/50 transition-all duration-300">
        {workout.image_url && (
          <div className="h-40 bg-gradient-to-br from-blue-900/30 to-slate-900 relative overflow-hidden">
            <img
              src={workout.image_url}
              alt={workout.title}
              className="w-full h-full object-cover opacity-60"
            />
            {workout.is_premium && (
              <div className="absolute top-3 right-3 bg-yellow-500/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span className="text-xs font-semibold">Premium</span>
              </div>
            )}
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-white text-lg">{workout.title}</CardTitle>
          </div>
          <p className="text-slate-400 text-sm line-clamp-2">{workout.description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge className={categoryColors[workout.category]}>
              {categoryLabels[workout.category] || workout.category}
            </Badge>
            <Badge className={difficultyColors[workout.difficulty]}>
              {difficultyLabels[workout.difficulty]}
            </Badge>
            <Badge variant="outline" className="text-slate-400 border-slate-700">
              {workout.days?.length || 0} dias
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-slate-300 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{workout.duration_minutes}min</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              <span>{totalExercises} exercícios</span>
            </div>
          </div>
          <Button 
            onClick={handleViewDetails}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Ver Treino
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}