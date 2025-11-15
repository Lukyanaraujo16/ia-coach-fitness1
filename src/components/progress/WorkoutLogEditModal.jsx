import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Weight, Save } from "lucide-react";

export default function WorkoutLogEditModal({ log, onClose }) {
  const queryClient = useQueryClient();
  const [exercisesData, setExercisesData] = useState(
    log.exercises_completed?.map(ex => ({
      ...ex,
      max_weight: ex.max_weight || ""
    })) || []
  );

  const updateLogMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkoutLog.update(log.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['workout-logs']);
      onClose();
    },
  });

  const handleWeightChange = (index, value) => {
    const newData = [...exercisesData];
    newData[index].max_weight = value ? parseFloat(value) : undefined;
    setExercisesData(newData);
  };

  const handleSave = () => {
    updateLogMutation.mutate({
      exercises_completed: exercisesData
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <Card className="bg-slate-900 border-slate-800 max-w-md w-full max-h-[80vh] flex flex-col">
        <CardHeader className="border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg">Editar Cargas</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-slate-400 text-sm mt-2">{log.workout_title}</p>
        </CardHeader>

        <CardContent className="p-4 space-y-3 overflow-y-auto flex-1">
          {exercisesData.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Nenhum exercício registrado</p>
          ) : (
            exercisesData.map((exercise, index) => (
              <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Weight className="w-4 h-4 text-blue-400" />
                  <h4 className="text-white font-medium text-sm flex-1">
                    {exercise.exercise_name}
                  </h4>
                  <span className="text-slate-400 text-xs">
                    {exercise.sets_completed} séries
                  </span>
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-300 text-xs">Carga Máxima (kg)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="Ex: 40"
                    value={exercise.max_weight || ""}
                    onChange={(e) => handleWeightChange(index, e.target.value)}
                    className="bg-slate-900 border-slate-600 text-white h-10"
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>

        <div className="border-t border-slate-800 p-4 flex gap-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-slate-800 border-slate-600 text-slate-200"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateLogMutation.isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateLogMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </Card>
    </div>
  );
}