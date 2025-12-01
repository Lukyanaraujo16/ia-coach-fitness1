import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Timer, History, Settings, Loader2, Sparkles } from "lucide-react";

import FastingTimer from "../components/fasting/FastingTimer";
import FastingTypeSelector from "../components/fasting/FastingTypeSelector";
import FastingHistory from "../components/fasting/FastingHistory";
import FastingSettingsComponent from "../components/fasting/FastingSettings";
import FastingAlerts from "../components/fasting/FastingAlerts";
import FastingEducationModal from "../components/fasting/FastingEducationModal";
import FastingAIRecommendations from "../components/fasting/FastingAIRecommendations";
import FastingAIPreCheck from "../components/fasting/FastingAIPreCheck";

const FASTING_HOURS = {
  "14/10": { fasting: 14, eating: 10 },
  "16/8": { fasting: 16, eating: 8 },
  "18/6": { fasting: 18, eating: 6 },
  "20/4": { fasting: 20, eating: 4 },
  "24h": { fasting: 24, eating: 0 },
};

export default function Fasting() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("timer");
  const [selectedType, setSelectedType] = useState(null);
  const [customHours, setCustomHours] = useState({ fasting: 16, eating: 8 });
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [endNotes, setEndNotes] = useState("");
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [pendingStartFast, setPendingStartFast] = useState(false);
  const [showAIPreCheck, setShowAIPreCheck] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin(createPageUrl("Fasting"));
      }
    };
    loadUser();
  }, []);

  // Fetch fasting logs
  const { data: fastingLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['fasting-logs', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const logs = await base44.entities.FastingLog.list('-start_time');
      return logs.filter(log => log.user_email === user.email || log.created_by === user.email);
    },
    enabled: !!user?.email,
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch user settings
  const { data: fastingSettings } = useQuery({
    queryKey: ['fasting-settings', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const settings = await base44.entities.FastingSettings.list();
      return settings.find(s => s.user_email === user.email || s.created_by === user.email);
    },
    enabled: !!user?.email,
  });

  // Fetch meal logs to check for broken fasts
  const { data: mealLogs = [] } = useQuery({
    queryKey: ['meal-logs', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const logs = await base44.entities.MealLog.list('-date');
      return logs.filter(log => log.created_by === user.email);
    },
    enabled: !!user?.email,
  });

  // Get active fast
  const activeFast = fastingLogs.find(log => log.status === 'active');

  // Initialize selected type from settings
  useEffect(() => {
    if (fastingSettings && !selectedType) {
      setSelectedType(fastingSettings.preferred_fasting_type);
      if (fastingSettings.preferred_fasting_type === "custom") {
        setCustomHours({
          fasting: fastingSettings.custom_fasting_hours || 16,
          eating: fastingSettings.custom_eating_hours || 8,
        });
      }
    }
  }, [fastingSettings, selectedType]);

  // Start fasting mutation
  const startFastingMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.FastingLog.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['fasting-logs']);
      toast.success("Jejum iniciado! Boa sorte! 💪");
    },
  });

  // End fasting mutation
  const endFastingMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return base44.entities.FastingLog.update(id, data);
    },
    onSuccess: async (updatedLog) => {
      queryClient.invalidateQueries(['fasting-logs']);
      setShowEndDialog(false);
      setEndNotes("");
      
      // Generate AI tip
      generateAITip(updatedLog);
      
      toast.success("Jejum encerrado! Parabéns! 🎉");
    },
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data) => {
      if (fastingSettings) {
        return base44.entities.FastingSettings.update(fastingSettings.id, data);
      }
      return base44.entities.FastingSettings.create({ ...data, user_email: user.email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['fasting-settings']);
      toast.success("Configurações salvas!");
    },
  });

  const generateAITip = async (log) => {
    try {
      const durationHours = Math.round((log.duration_minutes || 0) / 60);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `O usuário completou um jejum de ${durationHours} horas (tipo ${log.fasting_type}). 
Gere uma dica motivacional e educativa de 2-3 linhas sobre os benefícios desse jejum ou como melhorar na próxima vez.
Seja positivo e encorajador. Escreva em português brasileiro.`,
        response_json_schema: {
          type: "object",
          properties: {
            tip: { type: "string" }
          }
        }
      });

      if (result.tip) {
        await base44.entities.FastingLog.update(log.id, { ai_tip: result.tip });
        queryClient.invalidateQueries(['fasting-logs']);
      }
    } catch (error) {
      console.error("Error generating AI tip:", error);
    }
  };

  // Check if user is first time fasting
  const isFirstTimeFasting = fastingLogs.length === 0;

  const handleStartFast = () => {
    if (!selectedType) {
      toast.error("Selecione um tipo de jejum");
      return;
    }

    // If first time, show education modal first
    if (isFirstTimeFasting && !pendingStartFast) {
      setShowEducationModal(true);
      return;
    }

    // Show AI pre-check analysis before starting
    setShowAIPreCheck(true);
  };

  const confirmStartFast = () => {
    const hours = selectedType === "custom" ? customHours : FASTING_HOURS[selectedType];
    const now = new Date();
    const plannedEnd = new Date(now.getTime() + hours.fasting * 60 * 60 * 1000);

    startFastingMutation.mutate({
      user_email: user.email,
      fasting_type: selectedType,
      fasting_hours: hours.fasting,
      eating_hours: hours.eating,
      start_time: now.toISOString(),
      planned_end_time: plannedEnd.toISOString(),
      status: "active",
    });

    setShowAIPreCheck(false);
    setPendingStartFast(false);
  };

  const handleEducationConfirm = () => {
    setShowEducationModal(false);
    setPendingStartFast(true);
    // After education modal, show AI pre-check
    setTimeout(() => {
      setShowAIPreCheck(true);
    }, 100);
  };

  const handleEndFast = () => {
    if (!activeFast) return;

    const now = new Date();
    const start = new Date(activeFast.start_time);
    const durationMinutes = Math.floor((now - start) / 1000 / 60);
    const completedFully = durationMinutes >= activeFast.fasting_hours * 60;

    endFastingMutation.mutate({
      id: activeFast.id,
      data: {
        end_time: now.toISOString(),
        duration_minutes: durationMinutes,
        status: completedFully ? "completed" : "broken",
        notes: endNotes,
        broken_reason: !completedFully ? `Encerrado ${Math.round((activeFast.fasting_hours * 60 - durationMinutes) / 60)}h antes do previsto` : null,
      },
    });
  };

  const handleTypeSelect = (type, fasting, eating) => {
    setSelectedType(type);
    if (type === "custom") {
      setCustomHours({ fasting, eating });
    }
  };

  if (!user) {
    return (
      <div className="py-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Jejum Intermitente</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800 grid grid-cols-4 gap-1 p-1">
          <TabsTrigger value="timer" className="data-[state=active]:bg-green-600 flex items-center gap-2">
            <Timer className="w-4 h-4" />
            <span className="hidden sm:inline">Timer</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-green-600 flex items-center gap-2">
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Histórico</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:bg-green-600 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">IA</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-green-600 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Config</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-6 space-y-6">
        {activeTab === "timer" && (
          <>
            {/* Alerts */}
            <FastingAlerts 
              activeFast={activeFast} 
              logs={fastingLogs} 
              mealLogs={mealLogs}
              settings={fastingSettings}
            />

            {/* Timer or Type Selector */}
            {activeFast ? (
              <FastingTimer
                activeFast={activeFast}
                onEnd={() => setShowEndDialog(true)}
                settings={fastingSettings}
              />
            ) : (
              <>
                <FastingTimer
                  activeFast={null}
                  onStart={handleStartFast}
                  settings={fastingSettings}
                />
                <FastingTypeSelector
                  selectedType={selectedType}
                  onSelect={handleTypeSelect}
                  customHours={customHours}
                  onCustomChange={(fasting, eating) => setCustomHours({ fasting, eating })}
                  onStartFast={handleStartFast}
                />
              </>
            )}
          </>
        )}

        {activeTab === "history" && (
          <FastingHistory logs={fastingLogs} />
        )}

        {activeTab === "ai" && (
          <FastingAIRecommendations
            user={user}
            fastingLogs={fastingLogs}
            mealLogs={mealLogs}
            settings={fastingSettings}
          />
        )}

        {activeTab === "settings" && (
          <FastingSettingsComponent
            settings={fastingSettings}
            onSave={(data) => saveSettingsMutation.mutate(data)}
            isSaving={saveSettingsMutation.isPending}
          />
        )}
      </div>

      {/* Education Modal for First Time Users */}
      <FastingEducationModal
        open={showEducationModal}
        onClose={() => setShowEducationModal(false)}
        onConfirm={handleEducationConfirm}
      />

      {/* AI Pre-Check before starting fast */}
      {showAIPreCheck && (
        <FastingAIPreCheck
          user={user}
          fastingLogs={fastingLogs}
          mealLogs={mealLogs}
          settings={fastingSettings}
          selectedType={selectedType}
          onConfirm={confirmStartFast}
          onCancel={() => {
            setShowAIPreCheck(false);
            setPendingStartFast(false);
          }}
        />
      )}

      {/* End Fast Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Encerrar Jejum</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-300 mb-4">
              Tem certeza que deseja encerrar seu jejum agora?
            </p>
            <Textarea
              value={endNotes}
              onChange={(e) => setEndNotes(e.target.value)}
              placeholder="Observações (opcional)"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)} className="bg-slate-800 border-slate-600 text-white">
              Cancelar
            </Button>
            <Button 
              onClick={handleEndFast} 
              disabled={endFastingMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {endFastingMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}