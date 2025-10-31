import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, ChevronDown, ChevronUp } from "lucide-react";

const categoryColors = {
  chest: "bg-red-500/20 text-red-400",
  back: "bg-blue-500/20 text-blue-400",
  legs: "bg-green-500/20 text-green-400",
  shoulders: "bg-yellow-500/20 text-yellow-400",
  arms: "bg-purple-500/20 text-purple-400",
  core: "bg-orange-500/20 text-orange-400",
  cardio: "bg-pink-500/20 text-pink-400",
};

function ExerciseCard({ exercise }) {
  const [expanded, setExpanded] = useState(false);

  if (!exercise) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm hover:border-slate-700 transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-white font-semibold">{exercise.name}</h4>
                {exercise.is_premium && (
                  <Lock className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className={categoryColors[exercise.category] || categoryColors.chest}>
                  {exercise.category}
                </Badge>
                <Badge variant="outline" className="text-slate-400 border-slate-700">
                  {exercise.difficulty}
                </Badge>
                <Badge variant="outline" className="text-slate-400 border-slate-700">
                  {exercise.equipment}
                </Badge>
              </div>
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {exercise.description && (
                      <p className="text-slate-400 text-sm mb-2">{exercise.description}</p>
                    )}
                    {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {exercise.muscle_groups.map((muscle, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-slate-800 text-slate-400 rounded"
                          >
                            {muscle}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ExerciseLibrary({ exercises = [], loading, searchQuery = "" }) {
  const filteredExercises = exercises.filter((ex) =>
    ex?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <p className="text-slate-400 text-center py-12">Carregando exercícios...</p>;
  }

  if (filteredExercises.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Nenhum exercício encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredExercises.map((exercise) => (
        <ExerciseCard key={exercise.id} exercise={exercise} />
      ))}
    </div>
  );
}