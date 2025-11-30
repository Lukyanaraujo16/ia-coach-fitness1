import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Target } from "lucide-react";

const categoryLabels = {
  chest: "Peito",
  back: "Costas",
  legs: "Pernas",
  shoulders: "Ombros",
  arms: "Braços",
  core: "Core",
  cardio: "Cardio",
  full_body: "Corpo Inteiro"
};

const categoryColors = {
  chest: "#ef4444",
  back: "#3b82f6",
  legs: "#22c55e",
  shoulders: "#f59e0b",
  arms: "#8b5cf6",
  core: "#ec4899",
  cardio: "#06b6d4",
  full_body: "#6366f1"
};

export default function BodyPartChart({ logs, exercises }) {
  // Criar mapa de exercício -> categoria
  const exerciseCategoryMap = {};
  exercises.forEach(ex => {
    exerciseCategoryMap[ex.name?.toLowerCase()] = ex.category;
  });

  // Contar séries por parte do corpo
  const bodyPartCounts = {};
  
  logs.forEach(log => {
    (log.exercises_completed || []).forEach(ex => {
      const exerciseName = ex.exercise_name?.toLowerCase();
      let category = exerciseCategoryMap[exerciseName];
      
      // Tentar inferir categoria pelo nome se não encontrar
      if (!category) {
        const name = exerciseName || '';
        if (name.includes('supino') || name.includes('peito') || name.includes('crucifixo') || name.includes('fly')) {
          category = 'chest';
        } else if (name.includes('costas') || name.includes('remada') || name.includes('puxada') || name.includes('pull')) {
          category = 'back';
        } else if (name.includes('perna') || name.includes('agacha') || name.includes('leg') || name.includes('panturrilha') || name.includes('quadríceps') || name.includes('glúteo')) {
          category = 'legs';
        } else if (name.includes('ombro') || name.includes('desenvolvimento') || name.includes('elevação lateral')) {
          category = 'shoulders';
        } else if (name.includes('bíceps') || name.includes('tríceps') || name.includes('rosca') || name.includes('braço')) {
          category = 'arms';
        } else if (name.includes('abdom') || name.includes('prancha') || name.includes('core')) {
          category = 'core';
        } else if (name.includes('cardio') || name.includes('esteira') || name.includes('bicicleta') || name.includes('corrida')) {
          category = 'cardio';
        } else {
          category = 'full_body';
        }
      }
      
      const sets = ex.sets_completed || 1;
      bodyPartCounts[category] = (bodyPartCounts[category] || 0) + sets;
    });
  });

  const data = Object.entries(bodyPartCounts)
    .map(([category, value]) => ({
      name: categoryLabels[category] || category,
      value,
      category
    }))
    .sort((a, b) => b.value - a.value);

  const totalSets = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentage = ((item.value / totalSets) * 100).toFixed(1);
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">{item.name}</p>
          <p className="text-slate-300 text-sm">{item.value} séries ({percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          Partes do Corpo Treinadas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-slate-400 text-center">
              Nenhum dado disponível
            </p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={categoryColors[entry.category] || '#6366f1'} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>}
                  wrapperStyle={{ paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Body Parts List */}
        {data.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-slate-400 text-xs font-medium mb-2">Ranking de grupos musculares:</p>
            {data.slice(0, 5).map((item, idx) => (
              <div key={item.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs w-4">{idx + 1}º</span>
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: categoryColors[item.category] }}
                  />
                  <span className="text-slate-300 text-sm">{item.name}</span>
                </div>
                <span className="text-slate-400 text-sm">{item.value} séries</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}