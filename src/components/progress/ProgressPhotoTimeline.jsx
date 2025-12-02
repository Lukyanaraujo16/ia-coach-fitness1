import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, TrendingUp, TrendingDown, Minus, ChevronRight, Calendar, ArrowRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ProgressPhotoTimeline({ analyses = [] }) {
  const [selectedComparison, setSelectedComparison] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-blue-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getChangeIndicator = (current, previous, field) => {
    if (!previous || !current[field] || !previous[field]) return null;
    const diff = current[field] - previous[field];
    if (Math.abs(diff) < 0.5) return { icon: Minus, color: "text-slate-400", text: "=" };
    if (field === "estimated_body_fat") {
      return diff < 0 
        ? { icon: TrendingDown, color: "text-green-400", text: `${diff.toFixed(1)}%` }
        : { icon: TrendingUp, color: "text-red-400", text: `+${diff.toFixed(1)}%` };
    }
    return diff > 0 
      ? { icon: TrendingUp, color: "text-green-400", text: `+${diff.toFixed(1)}%` }
      : { icon: TrendingDown, color: "text-red-400", text: `${diff.toFixed(1)}%` };
  };

  const handleCompareSelect = (analysis) => {
    if (selectedForCompare.includes(analysis.id)) {
      setSelectedForCompare(selectedForCompare.filter(id => id !== analysis.id));
    } else if (selectedForCompare.length < 2) {
      const newSelected = [...selectedForCompare, analysis.id];
      setSelectedForCompare(newSelected);
      if (newSelected.length === 2) {
        const first = analyses.find(a => a.id === newSelected[0]);
        const second = analyses.find(a => a.id === newSelected[1]);
        setSelectedComparison([first, second].sort((a, b) => new Date(a.date) - new Date(b.date)));
        setCompareMode(false);
        setSelectedForCompare([]);
      }
    }
  };

  if (analyses.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-12 text-center">
          <Camera className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">Nenhuma foto de evolução ainda</p>
          <p className="text-slate-500 text-sm mb-4">
            Faça sua primeira análise corporal para começar a acompanhar sua evolução visual
          </p>
          <Link to={createPageUrl("BodyAnalysis")}>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Camera className="w-4 h-4 mr-2" />
              Fazer Análise Corporal
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">Evolução Visual</h3>
          <p className="text-slate-400 text-sm">Baseado nas suas análises corporais</p>
        </div>
        <div className="flex gap-2">
          {analyses.length >= 2 && (
            <Button
              variant={compareMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setCompareMode(!compareMode);
                setSelectedForCompare([]);
              }}
              className={compareMode ? "bg-purple-600" : "border-slate-700 text-slate-300"}
            >
              {compareMode ? "Cancelar" : "Comparar"}
            </Button>
          )}
          <Link to={createPageUrl("BodyAnalysis")}>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Camera className="w-4 h-4 mr-2" />
              Nova Análise
            </Button>
          </Link>
        </div>
      </div>

      {compareMode && (
        <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-4">
          <p className="text-purple-300 text-sm">
            Selecione 2 análises para comparar ({selectedForCompare.length}/2 selecionadas)
          </p>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-4">
        {analyses.map((analysis, idx) => {
          const previousAnalysis = analyses[idx + 1];
          const fatChange = getChangeIndicator(analysis, previousAnalysis, "estimated_body_fat");
          const muscleChange = getChangeIndicator(analysis, previousAnalysis, "estimated_muscle_mass");
          const isSelected = selectedForCompare.includes(analysis.id);

          return (
            <Card 
              key={analysis.id} 
              className={`bg-slate-900/50 border-slate-800 overflow-hidden transition-all ${
                compareMode ? 'cursor-pointer hover:border-purple-600' : ''
              } ${isSelected ? 'border-purple-500 bg-purple-900/20' : ''}`}
              onClick={() => compareMode && handleCompareSelect(analysis)}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Photos */}
                  <div className="flex gap-2 flex-shrink-0">
                    {analysis.photos?.slice(0, 3).map((photo, photoIdx) => (
                      <div key={photoIdx} className="w-20 h-28 rounded-lg overflow-hidden bg-slate-800">
                        <img 
                          src={photo} 
                          alt={`Foto ${photoIdx + 1}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-white font-medium">
                          {format(parseISO(analysis.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <div className={`text-xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                        {analysis.overall_score}/100
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="bg-slate-800/50 rounded-lg p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-xs">Gordura</span>
                          {fatChange && (
                            <span className={`text-xs flex items-center gap-1 ${fatChange.color}`}>
                              <fatChange.icon className="w-3 h-3" />
                              {fatChange.text}
                            </span>
                          )}
                        </div>
                        <p className="text-orange-400 font-bold">{analysis.estimated_body_fat}%</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-xs">Músculo</span>
                          {muscleChange && (
                            <span className={`text-xs flex items-center gap-1 ${muscleChange.color}`}>
                              <muscleChange.icon className="w-3 h-3" />
                              {muscleChange.text}
                            </span>
                          )}
                        </div>
                        <p className="text-blue-400 font-bold">{analysis.estimated_muscle_mass}%</p>
                      </div>
                    </div>

                    {analysis.body_type && (
                      <Badge className="mt-2 bg-slate-700 text-slate-300">{analysis.body_type}</Badge>
                    )}
                  </div>

                  {!compareMode && (
                    <Link to={createPageUrl("BodyAnalysis")} className="flex items-center">
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Comparison Dialog */}
      <Dialog open={!!selectedComparison} onOpenChange={() => setSelectedComparison(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-white">Comparação de Evolução</DialogTitle>
          </DialogHeader>
          
          {selectedComparison && (
            <div className="space-y-6">
              {/* Photos Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                {selectedComparison.map((analysis, idx) => (
                  <div key={analysis.id} className="space-y-2">
                    <p className="text-slate-400 text-sm text-center">
                      {format(parseISO(analysis.date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {analysis.photos?.slice(0, 3).map((photo, photoIdx) => (
                        <div key={photoIdx} className="w-24 h-32 rounded-lg overflow-hidden bg-slate-800">
                          <img src={photo} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <ArrowRight className="w-8 h-8 text-purple-400" />
              </div>

              {/* Stats Comparison */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                  <p className="text-slate-400 text-sm mb-2">Gordura Corporal</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-orange-400 font-bold">{selectedComparison[0].estimated_body_fat}%</span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                    <span className="text-orange-400 font-bold">{selectedComparison[1].estimated_body_fat}%</span>
                  </div>
                  <p className={`text-sm mt-1 ${
                    selectedComparison[1].estimated_body_fat < selectedComparison[0].estimated_body_fat 
                      ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {(selectedComparison[1].estimated_body_fat - selectedComparison[0].estimated_body_fat).toFixed(1)}%
                  </p>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                  <p className="text-slate-400 text-sm mb-2">Massa Muscular</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-blue-400 font-bold">{selectedComparison[0].estimated_muscle_mass}%</span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                    <span className="text-blue-400 font-bold">{selectedComparison[1].estimated_muscle_mass}%</span>
                  </div>
                  <p className={`text-sm mt-1 ${
                    selectedComparison[1].estimated_muscle_mass > selectedComparison[0].estimated_muscle_mass 
                      ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {(selectedComparison[1].estimated_muscle_mass - selectedComparison[0].estimated_muscle_mass) > 0 ? '+' : ''}
                    {(selectedComparison[1].estimated_muscle_mass - selectedComparison[0].estimated_muscle_mass).toFixed(1)}%
                  </p>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                  <p className="text-slate-400 text-sm mb-2">Pontuação</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`font-bold ${getScoreColor(selectedComparison[0].overall_score)}`}>
                      {selectedComparison[0].overall_score}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                    <span className={`font-bold ${getScoreColor(selectedComparison[1].overall_score)}`}>
                      {selectedComparison[1].overall_score}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${
                    selectedComparison[1].overall_score > selectedComparison[0].overall_score 
                      ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {(selectedComparison[1].overall_score - selectedComparison[0].overall_score) > 0 ? '+' : ''}
                    {selectedComparison[1].overall_score - selectedComparison[0].overall_score} pts
                  </p>
                </div>
              </div>

              {/* Comparison Notes */}
              {selectedComparison[1].comparison_notes && (
                <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-4">
                  <p className="text-purple-300 text-sm font-medium mb-2">Análise da IA:</p>
                  <p className="text-slate-300 text-sm">{selectedComparison[1].comparison_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}