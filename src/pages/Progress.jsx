import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import WeightChart from "../components/progress/WeightChart";
import ProgressForm from "../components/progress/ProgressForm";
import WorkoutHistory from "../components/progress/WorkoutHistory";
import ProgressPhotos from "../components/progress/ProgressPhotos";

export default function Progress() {
  const [activeTab, setActiveTab] = useState("weight");
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: progressEntries = [] } = useQuery({
    queryKey: ['progress-entries'],
    queryFn: () => base44.entities.ProgressEntry.list('-date'),
  });

  const { data: workoutLogs = [] } = useQuery({
    queryKey: ['workout-logs'],
    queryFn: () => base44.entities.WorkoutLog.list('-date'),
  });

  const createProgressMutation = useMutation({
    mutationFn: (data) => base44.entities.ProgressEntry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['progress-entries']);
      setShowForm(false);
    },
  });

  const handleSubmitProgress = (data) => {
    createProgressMutation.mutate(data);
  };

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Progresso</h2>
        {activeTab === "weight" && (
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <ProgressForm
          onSubmit={handleSubmitProgress}
          onCancel={() => setShowForm(false)}
          isLoading={createProgressMutation.isPending}
        />
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800 w-full">
          <TabsTrigger value="weight" className="flex-1 data-[state=active]:bg-blue-600">
            Peso
          </TabsTrigger>
          <TabsTrigger value="workouts" className="flex-1 data-[state=active]:bg-blue-600">
            Treinos
          </TabsTrigger>
          <TabsTrigger value="photos" className="flex-1 data-[state=active]:bg-blue-600">
            Fotos
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      {activeTab === "weight" && <WeightChart data={progressEntries} />}
      {activeTab === "workouts" && <WorkoutHistory logs={workoutLogs} />}
      {activeTab === "photos" && <ProgressPhotos entries={progressEntries} />}
    </div>
  );
}