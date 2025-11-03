
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, Users, Crown } from "lucide-react";

export default function AdminMetrics({ users = [], workouts = [] }) {
  const { data: workoutLogs = [] } = useQuery({
    queryKey: ['all-workout-logs'],
    queryFn: () => base44.entities.WorkoutLog.list('-date', 100),
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['all-posts'],
    queryFn: () => base44.entities.CommunityPost.list('-created_date', 50),
  });

  // User growth over time
  const usersByMonth = users.reduce((acc, user) => {
    const month = new Date(user.created_date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const userGrowthData = Object.entries(usersByMonth).map(([month, count]) => ({
    month,
    users: count,
  }));

  // Premium vs Free
  const premiumCount = users.filter(u => u.subscription_status === 'premium').length;
  const freeCount = users.length - premiumCount;

  const subscriptionData = [
    { name: 'Gratuito', value: freeCount },
    { name: 'Premium', value: premiumCount },
  ];

  // Workouts by category
  const workoutsByCategory = workouts.reduce((acc, workout) => {
    acc[workout.category] = (acc[workout.category] || 0) + 1;
    return acc;
  }, {});

  const categoryData = Object.entries(workoutsByCategory).map(([category, count]) => ({
    category: category.replace(/_/g, ' '),
    count,
  }));

  // Activity metrics - corrigir comparação de data
  const last7Days = workoutLogs.filter(log => {
    const logDate = new Date(log.date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return logDate >= weekAgo && logDate <= today;
  });

  return (
    <div className="space-y-6">
      {/* Conversion Rate */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-400">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-white">
                {users.length > 0 ? ((premiumCount / users.length) * 100).toFixed(1) : 0}%
              </p>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-slate-500 text-xs mt-1">Free → Premium</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-400">Engajamento (7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{last7Days.length}</p>
            <p className="text-slate-500 text-xs mt-1">Treinos completados</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-400">Posts na Comunidade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{posts.length}</p>
            <p className="text-slate-500 text-xs mt-1">Total de postagens</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Distribution */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Distribuição de Assinaturas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subscriptionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Workouts by Category */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Treinos por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="category" type="category" stroke="#94a3b8" width={120} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Projection */}
      <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 border-green-800/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            💰 Projeção de Receita Anual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Mensal (29,90 × {premiumCount})</span>
              <span className="text-2xl font-bold text-white">
                R$ {(premiumCount * 29.90).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Anual (projetada)</span>
              <span className="text-3xl font-bold text-green-400">
                R$ {(premiumCount * 29.90 * 12).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
