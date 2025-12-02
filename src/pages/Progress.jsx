import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import WeightChart from "../components/progress/WeightChart";
import ProgressForm from "../components/progress/ProgressForm";
import WorkoutHistory from "../components/progress/WorkoutHistory";
import ProgressPhotoTimeline from "../components/progress/ProgressPhotoTimeline";
import ExerciseWeightProgress from "../components/progress/ExerciseWeightProgress";

export default function Progress() {
  const [activeTab, setActiveTab] = useState("weight");
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const { data: progressEntries = [] } = useQuery({
    queryKey: ['progress-entries', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allEntries = await base44.entities.ProgressEntry.list('-date');
      return allEntries.filter(entry => entry.created_by === user.email);
    },
    enabled: !!user?.email,
  });

  const { data: workoutLogs = [] } = useQuery({
    queryKey: ['workout-logs', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allLogs = await base44.entities.WorkoutLog.list('-date');
      return allLogs.filter(log => log.user_email === user.email || log.created_by === user.email);
    },
    enabled: !!user?.email,
  });

  const { data: bodyAnalyses = [] } = useQuery({
    queryKey: ['body-analyses', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allAnalyses = await base44.entities.BodyAnalysis.list('-date');
      return allAnalyses.filter(a => a.created_by === user.email);
    },
    enabled: !!user?.email,
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
        <TabsList className="bg-slate-900/50 border border-slate-800 w-full grid grid-cols-4">
          <TabsTrigger value="weight" className="data-[state=active]:bg-blue-600">
            Peso
          </TabsTrigger>
          <TabsTrigger value="exercises" className="data-[state=active]:bg-blue-600">
            Cargas
          </TabsTrigger>
          <TabsTrigger value="workouts" className="data-[state=active]:bg-blue-600">
            Treinos
          </TabsTrigger>
          <TabsTrigger value="photos" className="data-[state=active]:bg-blue-600">
            Fotos
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      {activeTab === "weight" && <WeightChart data={progressEntries} />}
      {activeTab === "exercises" && <ExerciseWeightProgress logs={workoutLogs} />}
      {activeTab === "workouts" && <WorkoutHistory logs={workoutLogs} />}
      {activeTab === "photos" && <ProgressPhotoTimeline analyses={bodyAnalyses} />}
    </div>
  );
}