import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Flame, Trash2, Edit } from "lucide-react";
import WorkoutLogEditModal from "./WorkoutLogEditModal";

export default function WorkoutHistory({ logs = [] }) {
  const queryClient = useQueryClient();
  const [editingLog, setEditingLog] = useState(null);

  const deleteLogMutation = useMutation({
    mutationFn: (logId) => base44.entities.WorkoutLog.delete(logId),
    onSuccess: () => {
      queryClient.invalidateQueries(['workout-logs']);
    },
  });

  const handleDeleteLog = (logId, workoutTitle) => {
    if (confirm(`Tem certeza que deseja excluir o treino "${workoutTitle}"?`)) {
      deleteLogMutation.mutate(logId);
    }
  };

  if (logs.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-12 text-center">
          <p className="text-slate-400">Nenhum treino registrado ainda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {logs.map((log) => (
          <Card key={log.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-2">{log.workout_title}</h4>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(log.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{log.duration_minutes}min</span>
                    </div>
                    {log.calories_burned && (
                      <div className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span>{log.calories_burned} kcal</span>
                      </div>
                    )}
                  </div>
                  {log.notes && (
                    <p className="text-slate-500 text-sm mt-2">{log.notes}</p>
                  )}
                  {log.exercises_completed && log.exercises_completed.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {log.exercises_completed.map((ex, idx) => (
                        <div key={idx} className="text-xs text-slate-400 flex items-center gap-2">
                          <span>• {ex.exercise_name}</span>
                          {ex.max_weight && (
                            <span className="text-blue-400 font-medium">
                              {ex.max_weight}kg
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {log.difficulty_rating && (
                    <div className="flex flex-col items-center">
                      <div className="text-2xl font-bold text-blue-400">{log.difficulty_rating}</div>
                      <div className="text-xs text-slate-500">/ 5</div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingLog(log)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-950/50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteLog(log.id, log.workout_title)}
                      disabled={deleteLogMutation.isPending}
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingLog && (
        <WorkoutLogEditModal
          log={editingLog}
          onClose={() => setEditingLog(null)}
        />
      )}
    </>
  );
}