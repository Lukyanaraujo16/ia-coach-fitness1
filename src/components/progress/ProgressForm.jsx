import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

export default function ProgressForm({ onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    body_fat_percentage: '',
    measurements: {
      chest: '',
      waist: '',
      hips: '',
      arms: '',
      thighs: '',
    },
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      body_fat_percentage: formData.body_fat_percentage ? parseFloat(formData.body_fat_percentage) : undefined,
      measurements: {
        chest: formData.measurements.chest ? parseFloat(formData.measurements.chest) : undefined,
        waist: formData.measurements.waist ? parseFloat(formData.measurements.waist) : undefined,
        hips: formData.measurements.hips ? parseFloat(formData.measurements.hips) : undefined,
        arms: formData.measurements.arms ? parseFloat(formData.measurements.arms) : undefined,
        thighs: formData.measurements.thighs ? parseFloat(formData.measurements.thighs) : undefined,
      },
    };
    onSubmit(data);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Novo Registro</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-slate-300">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-slate-300">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="70.5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="body_fat" className="text-slate-300">Gordura Corporal (%)</Label>
              <Input
                id="body_fat"
                type="number"
                step="0.1"
                value={formData.body_fat_percentage}
                onChange={(e) => setFormData({ ...formData, body_fat_percentage: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="15.5"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Medidas (cm)</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Peitoral"
                  type="number"
                  step="0.1"
                  value={formData.measurements.chest}
                  onChange={(e) => setFormData({
                    ...formData,
                    measurements: { ...formData.measurements, chest: e.target.value }
                  })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <Input
                  placeholder="Cintura"
                  type="number"
                  step="0.1"
                  value={formData.measurements.waist}
                  onChange={(e) => setFormData({
                    ...formData,
                    measurements: { ...formData.measurements, waist: e.target.value }
                  })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <Input
                  placeholder="Quadril"
                  type="number"
                  step="0.1"
                  value={formData.measurements.hips}
                  onChange={(e) => setFormData({
                    ...formData,
                    measurements: { ...formData.measurements, hips: e.target.value }
                  })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <Input
                  placeholder="Braços"
                  type="number"
                  step="0.1"
                  value={formData.measurements.arms}
                  onChange={(e) => setFormData({
                    ...formData,
                    measurements: { ...formData.measurements, arms: e.target.value }
                  })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-slate-300">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Como está se sentindo?"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}