import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, parseISO, subDays, subMonths, subYears, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function WeightProgressChart({ logs, selectedExercise, period }) {
  const getFilteredData = () => {
    const now = new Date();
    let startDate;
    
    switch (period) {
      case "week":
        startDate = subDays(now, 7);
        break;
      case "month":
        startDate = subMonths(now, 1);
        break;
      case "3months":
        startDate = subMonths(now, 3);
        break;
      case "year":
        startDate = subYears(now, 1);
        break;
      default:
        startDate = subMonths(now, 1);
    }

    // Filtrar logs por período
    const filteredLogs = logs.filter(log => {
      const logDate = parseISO(log.date);
      return isAfter(logDate, startDate);
    });

    if (selectedExercise === "all") {
      // Mostrar top 5 exercícios com mais registros
      const exerciseCounts = {};
      filteredLogs.forEach(log => {
        (log.exercises_completed || []).forEach(ex => {
          if (ex.exercise_name && ex.max_weight) {
            exerciseCounts[ex.exercise_name] = (exerciseCounts[ex.exercise_name] || 0) + 1;
          }
        });
      });

      const topExercises = Object.entries(exerciseCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name);

      // Agrupar dados por data
      const dataByDate = {};
      filteredLogs.forEach(log => {
        const dateKey = log.date;
        if (!dataByDate[dateKey]) {
          dataByDate[dateKey] = { date: dateKey };
        }
        
        (log.exercises_completed || []).forEach(ex => {
          if (topExercises.includes(ex.exercise_name) && ex.max_weight) {
            // Manter a maior carga do dia para cada exercício
            const current = dataByDate[dateKey][ex.exercise_name] || 0;
            dataByDate[dateKey][ex.exercise_name] = Math.max(current, ex.max_weight);
          }
        });
      });

      const chartData = Object.values(dataByDate)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(item => ({
          ...item,
          dateLabel: format(parseISO(item.date), "dd/MM", { locale: ptBR })
        }));

      return { data: chartData, exercises: topExercises };
    }

    // Dados para exercício específico
    const exerciseData = [];
    filteredLogs.forEach(log => {
      (log.exercises_completed || []).forEach(ex => {
        if (ex.exercise_name === selectedExercise && ex.max_weight) {
          exerciseData.push({
            date: log.date,
            dateLabel: format(parseISO(log.date), "dd/MM", { locale: ptBR }),
            [selectedExercise]: ex.max_weight
          });
        }
      });
    });

    // Ordenar por data e remover duplicatas (mantendo maior carga)
    const dataByDate = {};
    exerciseData.forEach(item => {
      if (!dataByDate[item.date] || dataByDate[item.date][selectedExercise] < item[selectedExercise]) {
        dataByDate[item.date] = item;
      }
    });

    return { 
      data: Object.values(dataByDate).sort((a, b) => a.date.localeCompare(b.date)),
      exercises: [selectedExercise]
    };
  };

  const { data, exercises } = getFilteredData();

  const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}kg
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-slate-400 text-center">
          {selectedExercise === "all" 
            ? "Nenhum registro de carga encontrado"
            : `Nenhum registro de carga para "${selectedExercise}"`
          }
        </p>
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="dateLabel" 
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: '#334155' }}
          />
          <YAxis 
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: '#334155' }}
            unit="kg"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>}
          />
          {exercises.map((exercise, idx) => (
            <Line
              key={exercise}
              type="monotone"
              dataKey={exercise}
              name={exercise}
              stroke={colors[idx % colors.length]}
              strokeWidth={2}
              dot={{ fill: colors[idx % colors.length], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}