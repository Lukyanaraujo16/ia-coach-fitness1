import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";

export default function WeightChart({ data = [] }) {
  const chartData = data
    .filter(entry => entry?.weight)
    .map(entry => ({
      date: new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      weight: entry.weight,
    }))
    .reverse();

  const latestWeight = data[0]?.weight;
  const previousWeight = data[1]?.weight;
  const weightChange = latestWeight && previousWeight ? latestWeight - previousWeight : 0;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Peso Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{latestWeight || '-'}</p>
            <p className="text-slate-500 text-sm">kg</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Mudança</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {weightChange !== 0 ? (
                <>
                  {weightChange > 0 ? (
                    <TrendingUp className="w-5 h-5 text-red-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-green-400" />
                  )}
                  <p className={`text-3xl font-bold ${weightChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {Math.abs(weightChange).toFixed(1)}
                  </p>
                </>
              ) : (
                <p className="text-3xl font-bold text-slate-500">-</p>
              )}
            </div>
            <p className="text-slate-500 text-sm">kg</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Evolução do Peso</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
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
                  dataKey="weight"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400 text-center py-12">
              Nenhum dado de peso registrado ainda
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}