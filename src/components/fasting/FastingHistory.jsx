import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Check, X, AlertTriangle, TrendingUp, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

const statusConfig = {
  completed: { label: "Completo", color: "bg-green-600", icon: Check },
  broken: { label: "Quebrado", color: "bg-red-600", icon: X },
  cancelled: { label: "Cancelado", color: "bg-slate-600", icon: X },
  active: { label: "Em andamento", color: "bg-blue-600", icon: Clock },
};

export default function FastingHistory({ logs = [], period = "week" }) {
  const [viewPeriod, setViewPeriod] = useState(period);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "-";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}min`;
  };

  // Filter logs by period
  const getFilteredLogs = () => {
    const now = new Date();
    let startDate;
    
    if (viewPeriod === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return logs.filter(log => new Date(log.start_time) >= startDate);
  };

  const filteredLogs = getFilteredLogs();

  // Calculate chart data
  const getChartData = () => {
    const now = new Date();
    const data = [];

    if (viewPeriod === "week") {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const dayLogs = logs.filter(log => log.start_time.split('T')[0] === dateStr && log.status === 'completed');
        const totalHours = dayLogs.reduce((sum, log) => sum + (log.duration_minutes || 0) / 60, 0);
        
        data.push({
          name: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
          horas: Math.round(totalHours * 10) / 10,
          jejuns: dayLogs.length,
        });
      }
    } else {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(now.getFullYear(), now.getMonth(), i);
        const dateStr = date.toISOString().split('T')[0];
        const dayLogs = logs.filter(log => log.start_time.split('T')[0] === dateStr && log.status === 'completed');
        const totalHours = dayLogs.reduce((sum, log) => sum + (log.duration_minutes || 0) / 60, 0);
        
        data.push({
          name: i.toString(),
          horas: Math.round(totalHours * 10) / 10,
          jejuns: dayLogs.length,
        });
      }
    }

    return data;
  };

  // Calculate stats
  const completedLogs = filteredLogs.filter(l => l.status === 'completed');
  const totalHours = completedLogs.reduce((sum, log) => sum + (log.duration_minutes || 0) / 60, 0);
  const avgDuration = completedLogs.length > 0 ? totalHours / completedLogs.length : 0;
  const successRate = filteredLogs.length > 0 ? (completedLogs.length / filteredLogs.length) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{completedLogs.length}</p>
            <p className="text-slate-400 text-xs">Jejuns Completos</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{Math.round(totalHours)}h</p>
            <p className="text-slate-400 text-xs">Total em Jejum</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">{Math.round(avgDuration)}h</p>
            <p className="text-slate-400 text-xs">Média por Jejum</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{Math.round(successRate)}%</p>
            <p className="text-slate-400 text-xs">Taxa de Sucesso</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Consistência
            </CardTitle>
            <Tabs value={viewPeriod} onValueChange={setViewPeriod}>
              <TabsList className="bg-slate-800">
                <TabsTrigger value="week" className="data-[state=active]:bg-green-600 text-xs">Semana</TabsTrigger>
                <TabsTrigger value="month" className="data-[state=active]:bg-green-600 text-xs">Mês</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getChartData()}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="horas" fill="#10B981" radius={[4, 4, 0, 0]} name="Horas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-400" />
            Histórico
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {filteredLogs.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Nenhum jejum registrado ainda</p>
            ) : (
              filteredLogs.map((log, idx) => {
                const status = statusConfig[log.status];
                const StatusIcon = status.icon;
                
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-slate-800/50 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${status.color}/20 flex items-center justify-center`}>
                          <StatusIcon className={`w-5 h-5 ${status.color.replace('bg-', 'text-')}`} />
                        </div>
                        <div>
                          <p className="text-white font-medium">Jejum {log.fasting_type}</p>
                          <p className="text-slate-400 text-sm">
                            {formatDate(log.start_time)} • {formatTime(log.start_time)}
                            {log.end_time && ` - ${formatTime(log.end_time)}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`${status.color} text-white text-xs`}>
                          {status.label}
                        </Badge>
                        <p className="text-slate-400 text-xs mt-1">
                          {formatDuration(log.duration_minutes)}
                        </p>
                      </div>
                    </div>
                    {log.ai_tip && (
                      <div className="mt-2 p-2 bg-green-900/20 rounded-lg border border-green-800/30">
                        <p className="text-green-400 text-xs">💡 {log.ai_tip}</p>
                      </div>
                    )}
                    {log.broken_reason && (
                      <div className="mt-2 p-2 bg-red-900/20 rounded-lg border border-red-800/30">
                        <p className="text-red-400 text-xs">⚠️ {log.broken_reason}</p>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}