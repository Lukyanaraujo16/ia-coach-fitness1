import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Apple, TrendingUp, Target, Zap } from 'lucide-react';

export default function ActivityNutritionSummary({ user }) {
  const getLocalDateString = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const todayDate = getLocalDateString();

  const { data: wearableData } = useQuery({
    queryKey: ['wearable-data-today', user?.email, todayDate],
    queryFn: async () => {
      if (!user?.email) return null;
      const allData = await base44.entities.WearableData.list('-date', 1);
      return allData.find(d => d.date === todayDate && d.created_by === user.email);
    },
    enabled: !!user?.email,
  });

  const { data: mealLogs = [] } = useQuery({
    queryKey: ['meal-logs-today', user?.email, todayDate],
    queryFn: async () => {
      if (!user?.email) return [];
      const allLogs = await base44.entities.MealLog.list('-date');
      return allLogs.filter(log => log.date === todayDate && log.created_by === user.email && log.analysis_complete);
    },
    enabled: !!user?.email,
  });

  const todayCalories = mealLogs.reduce((sum, log) => sum + (log.total_calories || 0), 0);
  const todayProtein = mealLogs.reduce((sum, log) => sum + (log.macros?.protein || 0), 0);
  
  const baseCalorieGoal = user?.daily_calorie_goal || 2000;
  const activityCalories = wearableData?.calories_burned || 0;
  const adjustedGoal = user?.daily_calorie_goal_adjusted || baseCalorieGoal;
  
  const netCalories = todayCalories - activityCalories;
  const calorieBalance = adjustedGoal - todayCalories;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Resumo Consolidado - Hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Atividade Física */}
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-blue-400" />
              <h4 className="text-white font-semibold">Atividade Física</h4>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-slate-400 text-xs">Passos</p>
                <p className="text-white font-bold text-lg">{wearableData?.steps || 0}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Calorias</p>
                <p className="text-orange-400 font-bold text-lg">{activityCalories}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Min. Ativos</p>
                <p className="text-green-400 font-bold text-lg">{wearableData?.active_minutes || 0}</p>
              </div>
            </div>
          </div>

          {/* Nutrição */}
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Apple className="w-5 h-5 text-green-400" />
              <h4 className="text-white font-semibold">Nutrição</h4>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-slate-400 text-xs">Consumidas</p>
                <p className="text-white font-bold text-lg">{Math.round(todayCalories)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Proteína</p>
                <p className="text-blue-400 font-bold text-lg">{Math.round(todayProtein)}g</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Refeições</p>
                <p className="text-purple-400 font-bold text-lg">{mealLogs.length}</p>
              </div>
            </div>
          </div>

          {/* Balanço Energético */}
          <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-4 border border-purple-700/50">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-purple-400" />
              <h4 className="text-white font-semibold">Balanço Energético</h4>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 text-sm">Meta Base:</span>
                <span className="text-white font-bold">{baseCalorieGoal} kcal</span>
              </div>
              
              {activityCalories > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm">Queimadas (atividade):</span>
                    <span className="text-orange-400 font-bold">-{activityCalories} kcal</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm">Meta Ajustada:</span>
                    <span className="text-green-400 font-bold">{adjustedGoal} kcal</span>
                  </div>
                </>
              )}
              
              <div className="h-px bg-slate-700 my-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-white font-semibold">Saldo:</span>
                <span className={`font-bold text-lg ${calorieBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {calorieBalance > 0 ? '+' : ''}{Math.round(calorieBalance)} kcal
                </span>
              </div>
              
              <p className="text-slate-400 text-xs text-center mt-2">
                {calorieBalance > 200 
                  ? '🍎 Você pode comer mais!'
                  : calorieBalance < -200
                  ? '⚠️ Cuidado com o excesso!'
                  : '✅ Balanço ideal!'}
              </p>
            </div>
          </div>

          {/* Progresso Visual */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Meta Diária</span>
              <span className="text-white font-semibold">
                {Math.round(todayCalories)} / {adjustedGoal} kcal
              </span>
            </div>
            <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                  (todayCalories / adjustedGoal) > 1.1
                    ? 'bg-gradient-to-r from-red-600 to-red-500'
                    : 'bg-gradient-to-r from-green-600 to-emerald-500'
                }`}
                style={{ width: `${Math.min((todayCalories / adjustedGoal) * 100, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}