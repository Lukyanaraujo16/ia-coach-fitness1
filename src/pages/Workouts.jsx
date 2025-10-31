import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import WorkoutCard from "../components/workouts/WorkoutCard";
import ExerciseLibrary from "../components/workouts/ExerciseLibrary";

export default function Workouts() {
  const [activeTab, setActiveTab] = useState("workouts");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: workouts = [], isLoading: loadingWorkouts } = useQuery({
    queryKey: ['workouts'],
    queryFn: () => base44.entities.Workout.list(),
  });

  const { data: exercises = [], isLoading: loadingExercises } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => base44.entities.Exercise.list(),
  });

  const filteredWorkouts = workouts.filter(workout => {
    const matchesSearch = workout.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || workout.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: "all", label: "Todos" },
    { value: "strength", label: "Força" },
    { value: "cardio", label: "Cardio" },
    { value: "hiit", label: "HIIT" },
    { value: "flexibility", label: "Flexibilidade" },
    { value: "full_body", label: "Corpo Inteiro" },
  ];

  return (
    <div className="py-6 space-y-6">
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-white">Treinos</h2>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-900/50 border border-slate-800">
            <TabsTrigger value="workouts" className="data-[state=active]:bg-blue-600">
              Programas
            </TabsTrigger>
            <TabsTrigger value="exercises" className="data-[state=active]:bg-blue-600">
              Exercícios
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder={activeTab === "workouts" ? "Buscar treinos..." : "Buscar exercícios..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500"
          />
        </div>

        {/* Category Filter for Workouts */}
        {activeTab === "workouts" && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  categoryFilter === cat.value
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {activeTab === "workouts" ? (
        <div className="grid md:grid-cols-2 gap-4">
          {loadingWorkouts ? (
            <p className="text-slate-400 col-span-2 text-center py-12">Carregando...</p>
          ) : filteredWorkouts.length > 0 ? (
            filteredWorkouts.map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} />
            ))
          ) : (
            <div className="col-span-2 text-center py-12">
              <p className="text-slate-400">Nenhum treino encontrado</p>
            </div>
          )}
        </div>
      ) : (
        <ExerciseLibrary exercises={exercises} loading={loadingExercises} searchQuery={searchQuery} />
      )}
    </div>
  );
}