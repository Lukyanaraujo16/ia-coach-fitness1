import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Target, Zap } from "lucide-react";

export default function NutritionStats({ mealLogs = [], calorieGoal = 2000 }) {
  // Últimos 7 dias
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayMeals = mealLogs.filter(log => log.date === dateStr && log.analysis_complete);
    const calories = dayMeals.reduce((sum, log) => sum + (log.total_calories || 0), 0);
    const protein = dayMeals.reduce((sum, log) => sum + (log.macros?.protein || 0), 0);
    
    last7Days.push({
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      calories,
      protein: Math.round(protein),
      goal: calorieGoal,
    });
  }

  // Estatísticas gerais
  const totalMeals = mealLogs.filter(log => log.analysis_complete).length;
  const avgCalories = totalMeals > 0 
    ? Math.round(mealLogs.reduce((sum, log) => sum + (log.total_calories || 0), 0) / totalMeals)
    : 0;
  
  const last7DaysCalories = last7Days.reduce((sum, day) => sum + day.calories, 0);
  const last7DaysAvg = Math.round(last7DaysCalories / 7);
  
  const daysOnTrack = last7Days.filter(day => 
    day.calories >= calorieGoal * 0.9 && day.calories <= calorieGoal * 1.1
  ).length;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{daysOnTrack}/7</p>
            <p className="text-slate-400 text-xs mt-1">Dias na Meta</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 text-center">
            <Zap className="w-8 h-8 text-orange-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{last7DaysAvg}</p>
            <p className="text-slate-400 text-xs mt-1">Média/Dia (7d)</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{totalMeals}</p>
            <p className="text-slate-400 text-xs mt-1">Refeições</p>
          </CardContent>
        </Card>
      </div>

      {/* Calories Chart */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Calorias - Últimos 7 Dias</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="calories" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Calorias"
              />
              <Line 
                type="monotone" 
                dataKey="goal" 
                stroke="#f59e0b" 
                strokeDasharray="5 5"
                name="Meta"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Protein Chart */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Proteína - Últimos 7 Dias</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="protein" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/20 border-blue-800/50">
        <CardContent className="p-6">
          <h3 className="text-white font-semibold mb-3">💡 Dicas de Nutrição</h3>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li>• Mantenha uma alimentação balanceada com todos os macronutrientes</li>
            <li>• Consuma proteína em todas as refeições para manter a saciedade</li>
            <li>• Hidrate-se bem: beba pelo menos 2-3 litros de água por dia</li>
            <li>• Evite alimentos ultraprocessados e priorize comida de verdade</li>
            <li>• Tire fotos de todas as refeições para acompanhar melhor sua dieta</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}