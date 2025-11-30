import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Target, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Minus,
  User,
  Flame,
  Dumbbell
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const bodyTypeLabels = {
  ectomorph: { label: "Ectomorfo", description: "Estrutura magra, metabolismo rápido" },
  mesomorph: { label: "Mesomorfo", description: "Estrutura atlética, facilidade para ganhar músculo" },
  endomorph: { label: "Endomorfo", description: "Estrutura larga, tendência a acumular gordura" },
  "ecto-meso": { label: "Ecto-Mesomorfo", description: "Magro com potencial atlético" },
  "meso-endo": { label: "Meso-Endomorfo", description: "Atlético com tendência a ganhar peso" },
  "Ectomorfo": { label: "Ectomorfo", description: "Estrutura magra, metabolismo rápido" },
  "Mesomorfo": { label: "Mesomorfo", description: "Estrutura atlética, facilidade para ganhar músculo" },
  "Endomorfo": { label: "Endomorfo", description: "Estrutura larga, tendência a acumular gordura" }
};

const developmentLabels = {
  underdeveloped: { label: "Subdesenvolvido", color: "bg-red-600" },
  average: { label: "Médio", color: "bg-yellow-600" },
  well_developed: { label: "Bem Desenvolvido", color: "bg-green-600" },
  excellent: { label: "Excelente", color: "bg-blue-600" },
  // Português
  "Subdesenvolvido": { label: "Subdesenvolvido", color: "bg-red-600" },
  "Médio": { label: "Médio", color: "bg-yellow-600" },
  "Bem Desenvolvido": { label: "Bem Desenvolvido", color: "bg-green-600" },
  "Excelente": { label: "Excelente", color: "bg-blue-600" }
};

const muscleGroupLabels = {
  chest: "Peito",
  back: "Costas",
  shoulders: "Ombros",
  arms: "Braços",
  core: "Core",
  legs: "Pernas"
};

const visceralFatLabels = {
  low: { label: "Baixo", color: "text-green-400" },
  normal: { label: "Normal", color: "text-blue-400" },
  high: { label: "Alto", color: "text-yellow-400" },
  very_high: { label: "Muito Alto", color: "text-red-400" },
  // Português
  "Baixo": { label: "Baixo", color: "text-green-400" },
  "Normal": { label: "Normal", color: "text-blue-400" },
  "Alto": { label: "Alto", color: "text-yellow-400" },
  "Muito Alto": { label: "Muito Alto", color: "text-red-400" }
};

const definitionLabels = {
  none: "Nenhuma",
  slight: "Leve",
  moderate: "Moderada",
  defined: "Definida",
  very_defined: "Muito Definida",
  // Português
  "Nenhuma": "Nenhuma",
  "Leve": "Leve",
  "Moderada": "Moderada",
  "Definida": "Definida",
  "Muito Definida": "Muito Definida"
};

export default function BodyAnalysisResult({ analysis, previousAnalysis }) {
  if (!analysis) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-blue-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getComparisonIcon = (current, previous) => {
    if (!previous) return null;
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header com Score */}
      <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-700/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-slate-400 text-sm">Análise de</p>
              <p className="text-white text-lg font-semibold">
                {format(parseISO(analysis.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-sm mb-1">Pontuação Geral</p>
              <div className="flex items-center gap-2">
                <span className={`text-5xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                  {analysis.overall_score}
                </span>
                <span className="text-slate-400 text-xl">/100</span>
                {previousAnalysis && getComparisonIcon(analysis.overall_score, previousAnalysis.overall_score)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fotos */}
      {analysis.photos && analysis.photos.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg">Fotos da Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {analysis.photos.map((photo, idx) => (
                <div key={idx} className="aspect-[3/4] rounded-lg overflow-hidden">
                  <img src={photo} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Composição Corporal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 text-center">
            <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <p className="text-slate-400 text-xs">Gordura Corporal</p>
            <div className="flex items-center justify-center gap-1">
              <p className="text-2xl font-bold text-white">{analysis.estimated_body_fat}%</p>
              {previousAnalysis && getComparisonIcon(
                previousAnalysis.estimated_body_fat, // Menos gordura é melhor
                analysis.estimated_body_fat
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 text-center">
            <Dumbbell className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-slate-400 text-xs">Massa Muscular</p>
            <div className="flex items-center justify-center gap-1">
              <p className="text-2xl font-bold text-white">{analysis.estimated_muscle_mass}%</p>
              {previousAnalysis && getComparisonIcon(
                analysis.estimated_muscle_mass,
                previousAnalysis.estimated_muscle_mass
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-slate-400 text-xs">Simetria</p>
            <p className="text-2xl font-bold text-white">{analysis.symmetry_score}/10</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 text-center">
            <User className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-slate-400 text-xs">Tipo Corporal</p>
            <p className="text-lg font-bold text-white">
              {bodyTypeLabels[analysis.body_type]?.label || analysis.body_type}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Desenvolvimento Muscular */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-blue-400" />
            Desenvolvimento Muscular
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {analysis.muscle_development && Object.entries(analysis.muscle_development).map(([muscle, level]) => (
              <div key={muscle} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">{muscleGroupLabels[muscle] || muscle}</span>
                  <Badge className={`${developmentLabels[level]?.color || 'bg-slate-600'} text-white text-xs`}>
                    {developmentLabels[level]?.label || level}
                  </Badge>
                </div>
                <Progress 
                  value={
                    (level === 'excellent' || level === 'Excelente') ? 100 : 
                    (level === 'well_developed' || level === 'Bem Desenvolvido') ? 75 : 
                    (level === 'average' || level === 'Médio') ? 50 : 25
                  } 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detalhes da Composição */}
      {analysis.body_composition_details && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              Detalhes da Composição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-slate-400 text-xs mb-1">Gordura Visceral</p>
                <p className={`font-semibold ${visceralFatLabels[analysis.body_composition_details.visceral_fat_level]?.color || 'text-white'}`}>
                  {visceralFatLabels[analysis.body_composition_details.visceral_fat_level]?.label || analysis.body_composition_details.visceral_fat_level}
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-slate-400 text-xs mb-1">Definição Muscular</p>
                <p className="text-white font-semibold">
                  {definitionLabels[analysis.body_composition_details.muscle_definition_level] || analysis.body_composition_details.muscle_definition_level}
                </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-slate-400 text-xs mb-1">Vascularização</p>
                <p className="text-white font-semibold">
                  {definitionLabels[analysis.body_composition_details.vascularity] || analysis.body_composition_details.vascularity}
                </p>
                </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-slate-400 text-xs mb-1">Distribuição de Gordura</p>
                <p className="text-white font-semibold text-sm">
                  {analysis.body_composition_details.subcutaneous_fat_distribution}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Postura */}
      {analysis.posture_analysis && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5 text-yellow-400" />
              Análise de Postura
              <Badge className="ml-2 bg-slate-700">{analysis.posture_analysis.score}/10</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.posture_analysis.issues?.length > 0 && (
              <div>
                <p className="text-slate-400 text-sm mb-2">Problemas Identificados:</p>
                <div className="space-y-2">
                  {analysis.posture_analysis.issues.map((issue, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-sm">{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {analysis.posture_analysis.recommendations?.length > 0 && (
              <div>
                <p className="text-slate-400 text-sm mb-2">Recomendações:</p>
                <div className="space-y-2">
                  {analysis.posture_analysis.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pontos Fortes e Fracos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-green-900/20 border-green-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-400 text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Pontos Fortes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.strong_points?.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                  <span className="text-green-400">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-red-900/20 border-red-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-400 text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Pontos a Melhorar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.weak_points?.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                  <span className="text-red-400">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Recomendações */}
      {analysis.recommendations?.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Recomendações Personalizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                  <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-slate-300 text-sm">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Análise Detalhada */}
      {analysis.detailed_analysis && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white">Análise Detalhada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 text-sm whitespace-pre-line leading-relaxed">
              {analysis.detailed_analysis}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Comparação */}
      {analysis.comparison_notes && (
        <Card className="bg-purple-900/20 border-purple-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-purple-400 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Comparação com Análise Anterior
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 text-sm whitespace-pre-line leading-relaxed">
              {analysis.comparison_notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}