import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Lock, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import WorkoutCard from "../components/workouts/WorkoutCard";
import ExerciseLibrary from "../components/workouts/ExerciseLibrary";

export default function Workouts() {
  const [activeTab, setActiveTab] = useState("workouts");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin(createPageUrl("Workouts"));
      }
    };
    loadUser();
  }, []);

  const { data: workouts = [], isLoading: loadingWorkouts } = useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      const allWorkouts = await base44.entities.Workout.list();
      // Filtrar treinos: mostrar públicos ou criados para o usuário atual
      return allWorkouts.filter(w => 
        w.is_public !== false || // Treinos públicos (is_public true ou undefined)
        w.created_for_user === user?.email || // Treinos criados para o usuário
        user?.role === 'admin' // Admins veem tudo
      );
    },
    enabled: !!user,
  });

  const { data: exercises = [], isLoading: loadingExercises } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => base44.entities.Exercise.list(),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  const isPremium = user?.subscription_status === 'premium' || user?.subscription_status === 'trial' || user?.subscription_status === 'lifetime';

  // Usuários free só veem até 5 treinos (premium, trial e lifetime veem todos)
  const freeWorkouts = workouts.filter(w => !w.is_premium).slice(0, 5);
  const availableWorkouts = isPremium ? workouts : freeWorkouts;

  const filteredWorkouts = availableWorkouts
    .filter(workout => {
      const matchesSearch = workout.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          workout.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || workout.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.title.localeCompare(b.title)); // Ordenar alfabeticamente

  const filteredExercises = exercises
    .filter(ex => {
      const matchesSearch = ex.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ex.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || ex.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.name.localeCompare(b.name)); // Ordenar alfabeticamente

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
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white">Treinos</h2>
          <div className="flex items-center gap-3">
            {!isPremium && (
              <div className="flex items-center gap-2 text-yellow-400 text-sm">
                <Lock className="w-4 h-4" />
                <span>5/{workouts.length} treinos disponíveis</span>
              </div>
            )}
            {!user?.whatsapp_coach_enabled && (
              <a 
                href={base44.agents.getWhatsAppConnectURL('fitness_coach')} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-2">
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">WhatsApp Coach</span>
                </Button>
              </a>
            )}
          </div>
        </div>
        
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
        <>
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
          
          {/* Locked Workouts Preview - Mostrar apenas para usuários realmente free */}
          {!isPremium && workouts.length > 5 && (
            <Card className="bg-slate-900/30 border-slate-800 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-sm" />
              <CardContent className="relative p-8 text-center">
                <Lock className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  +{workouts.length - 5} Treinos Premium Bloqueados
                </h3>
                <p className="text-slate-300 mb-4">
                  Desbloqueie acesso completo a todos os treinos e funcionalidades
                </p>
                <a href={`/page/Subscription`} className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-semibold">
                  Assinar Premium
                </a>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <ExerciseLibrary exercises={filteredExercises} loading={loadingExercises} searchQuery={searchQuery} />
      )}
    </div>
  );
}