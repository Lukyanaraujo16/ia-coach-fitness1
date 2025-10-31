import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Flame } from "lucide-react";

export default function WorkoutHistory({ logs = [] }) {
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
              </div>
              {log.difficulty_rating && (
                <div className="flex flex-col items-center">
                  <div className="text-2xl font-bold text-blue-400">{log.difficulty_rating}</div>
                  <div className="text-xs text-slate-500">/ 5</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}