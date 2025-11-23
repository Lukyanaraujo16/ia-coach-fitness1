import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Watch, Activity, Heart, Moon, TrendingUp, RefreshCw, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function WearablesSync({ user }) {
  const queryClient = useQueryClient();
  const [manualData, setManualData] = useState({
    steps: '',
    calories_burned: '',
    distance_km: '',
    active_minutes: '',
    sleep_hours: ''
  });

  const { data: todayData, isLoading } = useQuery({
    queryKey: ['wearable-data-today', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const today = new Date().toISOString().split('T')[0];
      const allData = await base44.entities.WearableData.list('-date', 1);
      return allData.find(d => d.date === today && d.created_by === user.email);
    },
    enabled: !!user?.email,
  });

  const syncManualMutation = useMutation({
    mutationFn: async (data) => {
      const today = new Date().toISOString().split('T')[0];
      
      const wearableData = {
        date: today,
        steps: parseInt(data.steps) || 0,
        calories_burned: parseInt(data.calories_burned) || 0,
        distance_km: parseFloat(data.distance_km) || 0,
        active_minutes: parseInt(data.active_minutes) || 0,
        sleep_hours: parseFloat(data.sleep_hours) || 0,
        source: 'manual',
        synced_at: new Date().toISOString()
      };

      if (todayData) {
        return base44.entities.WearableData.update(todayData.id, wearableData);
      } else {
        return base44.entities.WearableData.create(wearableData);
      }
    },
    onSuccess: async (savedData) => {
      queryClient.invalidateQueries(['wearable-data-today']);
      
      // Ajustar meta calórica baseado em atividade
      if (savedData.calories_burned > 0) {
        const baseCalories = user.daily_calorie_goal || 2000;
        const activityCalories = savedData.calories_burned;
        const adjustedGoal = Math.round(baseCalories + (activityCalories * 0.5)); // 50% das calorias queimadas
        
        await base44.auth.updateMe({
          daily_calorie_goal_adjusted: adjustedGoal,
          last_wearable_sync: new Date().toISOString()
        });
        
        toast.success(`✅ Dados sincronizados! Meta ajustada para ${adjustedGoal} kcal`);
        queryClient.invalidateQueries(['user']);
      } else {
        toast.success('✅ Dados sincronizados!');
      }
      
      setManualData({
        steps: '',
        calories_burned: '',
        distance_km: '',
        active_minutes: '',
        sleep_hours: ''
      });
    },
    onError: (error) => {
      console.error('Erro ao sincronizar:', error);
      toast.error('❌ Erro ao sincronizar dados');
    }
  });

  const handleManualSync = () => {
    if (!manualData.steps && !manualData.calories_burned && !manualData.active_minutes) {
      toast.error('⚠️ Preencha pelo menos um campo');
      return;
    }
    syncManualMutation.mutate(manualData);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Watch className="w-5 h-5 text-blue-400" />
            Sincronizar Wearables
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              📱 <strong>Em breve:</strong> Conexão direta com Google Fit e Apple Health
            </p>
            <p className="text-slate-400 text-xs mt-2">
              Por enquanto, insira manualmente os dados do seu smartwatch
            </p>
          </div>

          {todayData && (
            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="font-semibold">Dados de hoje já sincronizados</span>
              </div>
              <p className="text-slate-300 text-xs">
                Última sync: {new Date(todayData.synced_at).toLocaleString('pt-BR')}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs">👣 Passos</Label>
              <Input
                type="number"
                placeholder="Ex: 8000"
                value={manualData.steps}
                onChange={(e) => setManualData({...manualData, steps: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-300 text-xs">🔥 Calorias Queimadas</Label>
              <Input
                type="number"
                placeholder="Ex: 350"
                value={manualData.calories_burned}
                onChange={(e) => setManualData({...manualData, calories_burned: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-300 text-xs">📍 Distância (km)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="Ex: 5.2"
                value={manualData.distance_km}
                onChange={(e) => setManualData({...manualData, distance_km: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-300 text-xs">⚡ Minutos Ativos</Label>
              <Input
                type="number"
                placeholder="Ex: 45"
                value={manualData.active_minutes}
                onChange={(e) => setManualData({...manualData, active_minutes: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="col-span-2">
              <Label className="text-slate-300 text-xs">😴 Horas de Sono</Label>
              <Input
                type="number"
                step="0.5"
                placeholder="Ex: 7.5"
                value={manualData.sleep_hours}
                onChange={(e) => setManualData({...manualData, sleep_hours: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <Button
            onClick={handleManualSync}
            disabled={syncManualMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {syncManualMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sincronizar Dados
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {todayData && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">📊 Resumo de Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <Activity className="w-5 h-5 text-blue-400 mb-2" />
                <p className="text-2xl font-bold text-white">{todayData.steps || 0}</p>
                <p className="text-xs text-slate-400">Passos</p>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-3">
                <Heart className="w-5 h-5 text-red-400 mb-2" />
                <p className="text-2xl font-bold text-white">{todayData.calories_burned || 0}</p>
                <p className="text-xs text-slate-400">Calorias</p>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-3">
                <TrendingUp className="w-5 h-5 text-green-400 mb-2" />
                <p className="text-2xl font-bold text-white">{todayData.active_minutes || 0}</p>
                <p className="text-xs text-slate-400">Min. Ativos</p>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-3">
                <Moon className="w-5 h-5 text-purple-400 mb-2" />
                <p className="text-2xl font-bold text-white">{todayData.sleep_hours || 0}h</p>
                <p className="text-xs text-slate-400">Sono</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}