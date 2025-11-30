import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { BarChart3 } from "lucide-react";
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval, subDays, subMonths, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function VolumeChart({ logs, period }) {
  const getChartData = () => {
    const now = new Date();
    let startDate;
    let groupBy;

    switch (period) {
      case "week":
        startDate = subDays(now, 7);
        groupBy = "day";
        break;
      case "month":
        startDate = subMonths(now, 1);
        groupBy = "day";
        break;
      case "3months":
        startDate = subMonths(now, 3);
        groupBy = "week";
        break;
      case "year":
        startDate = subYears(now, 1);
        groupBy = "month";
        break;
      default:
        startDate = subMonths(now, 1);
        groupBy = "day";
    }

    if (groupBy === "day") {
      const days = eachDayOfInterval({ start: startDate, end: now });
      return days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayLogs = logs.filter(log => log.date === dayStr);
        
        const totalSets = dayLogs.reduce((sum, log) => 
          sum + (log.exercises_completed || []).reduce((s, ex) => s + (ex.sets_completed || 0), 0), 0
        );
        
        const totalVolume = dayLogs.reduce((sum, log) => 
          sum + (log.exercises_completed || []).reduce((s, ex) => {
            const weights = ex.weight || [];
            const reps = ex.reps || [];
            return s + weights.reduce((w, weight, idx) => w + (weight * (reps[idx] || 0)), 0);
          }, 0), 0
        );

        return {
          date: format(day, period === "week" ? "EEE" : "dd/MM", { locale: ptBR }),
          series: totalSets,
          volume: Math.round(totalVolume),
          treinos: dayLogs.length
        };
      });
    }

    if (groupBy === "week") {
      const weeks = eachWeekOfInterval({ start: startDate, end: now }, { weekStartsOn: 1 });
      return weeks.map(weekStart => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const weekLogs = logs.filter(log => {
          const logDate = parseISO(log.date);
          return logDate >= weekStart && logDate <= weekEnd;
        });
        
        const totalSets = weekLogs.reduce((sum, log) => 
          sum + (log.exercises_completed || []).reduce((s, ex) => s + (ex.sets_completed || 0), 0), 0
        );

        return {
          date: format(weekStart, "dd/MM"),
          series: totalSets,
          treinos: weekLogs.length
        };
      });
    }

    // Monthly grouping for year
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStr = format(monthDate, 'yyyy-MM');
      const monthLogs = logs.filter(log => log.date?.startsWith(monthStr));
      
      const totalSets = monthLogs.reduce((sum, log) => 
        sum + (log.exercises_completed || []).reduce((s, ex) => s + (ex.sets_completed || 0), 0), 0
      );

      months.push({
        date: format(monthDate, "MMM", { locale: ptBR }),
        series: totalSets,
        treinos: monthLogs.length
      });
    }
    return months;
  };

  const data = getChartData();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          Volume de Treino
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.every(d => d.series === 0 && d.treinos === 0) ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-slate-400 text-center">
              Nenhum treino registrado neste período
            </p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis 
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: '#334155' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>}
                />
                <Bar 
                  dataKey="series" 
                  name="Séries" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="treinos" 
                  name="Treinos" 
                  fill="#22c55e" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}