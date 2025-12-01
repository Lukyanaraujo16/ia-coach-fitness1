import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Clock, Check } from "lucide-react";

const FASTING_TYPES = [
  { id: "14/10", label: "14:10", fasting: 14, eating: 10, description: "Iniciante - Ideal para começar", color: "from-green-600 to-emerald-600" },
  { id: "16/8", label: "16:8", fasting: 16, eating: 8, description: "Popular - Equilíbrio ideal", color: "from-blue-600 to-cyan-600" },
  { id: "18/6", label: "18:6", fasting: 18, eating: 6, description: "Intermediário - Mais resultados", color: "from-purple-600 to-violet-600" },
  { id: "20/4", label: "20:4", fasting: 20, eating: 4, description: "Avançado - Warrior Diet", color: "from-orange-600 to-amber-600" },
  { id: "24h", label: "24h", fasting: 24, eating: 0, description: "OMAD - Uma refeição por dia", color: "from-red-600 to-pink-600" },
  { id: "custom", label: "Personalizado", fasting: 0, eating: 0, description: "Defina seu próprio horário", color: "from-slate-600 to-slate-500" },
];

export default function FastingTypeSelector({ selectedType, onSelect, customHours, onCustomChange, onStartFast }) {
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [tempCustomFasting, setTempCustomFasting] = useState(customHours?.fasting || 16);
  const [tempCustomEating, setTempCustomEating] = useState(customHours?.eating || 8);

  const handleSelect = (type) => {
    if (type.id === "custom") {
      setShowCustomDialog(true);
    } else {
      onSelect(type.id, type.fasting, type.eating);
    }
  };

  const handleCustomSave = () => {
    const total = Number(tempCustomFasting) + Number(tempCustomEating);
    if (total !== 24) {
      alert("A soma das horas de jejum e alimentação deve ser 24h");
      return;
    }
    onCustomChange(Number(tempCustomFasting), Number(tempCustomEating));
    onSelect("custom", Number(tempCustomFasting), Number(tempCustomEating));
    setShowCustomDialog(false);
  };

  return (
    <>
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-400" />
            Escolha seu Tipo de Jejum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FASTING_TYPES.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => handleSelect(type)}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? "border-green-500 bg-green-900/20"
                      : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                  )}
                  <div className={`text-2xl font-bold bg-gradient-to-r ${type.color} bg-clip-text text-transparent`}>
                    {type.label}
                  </div>
                  <p className="text-slate-400 text-xs mt-1">{type.description}</p>
                  {type.fasting > 0 && (
                    <p className="text-slate-500 text-xs mt-1">
                      {type.fasting}h jejum / {type.eating}h alimentação
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {selectedType && (
            <Button
              onClick={onStartFast}
              className="w-full mt-4 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
            >
              Iniciar Jejum {selectedType}
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Jejum Personalizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-slate-300">Horas de Jejum</Label>
              <Input
                type="number"
                min="1"
                max="23"
                value={tempCustomFasting}
                onChange={(e) => setTempCustomFasting(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-300">Horas de Alimentação</Label>
              <Input
                type="number"
                min="1"
                max="23"
                value={tempCustomEating}
                onChange={(e) => setTempCustomEating(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            <p className="text-slate-400 text-sm">
              Total: {Number(tempCustomFasting) + Number(tempCustomEating)}h (deve ser 24h)
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomDialog(false)} className="bg-slate-800 border-slate-600 text-white">
              Cancelar
            </Button>
            <Button onClick={handleCustomSave} className="bg-green-600 hover:bg-green-700">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}