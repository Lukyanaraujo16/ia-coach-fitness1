import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Loader2, Info, X } from "lucide-react";
import { toast } from "sonner";

export default function BodyAnalysisForm({ user, previousAnalysis, onSuccess }) {
  const queryClient = useQueryClient();
  const [photos, setPhotos] = useState({ front: null, back: null, side: null });
  const [photoUrls, setPhotoUrls] = useState({ front: null, back: null, side: null });
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handlePhotoChange = async (position, file) => {
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotos(prev => ({ ...prev, [position]: file }));
      setPhotoUrls(prev => ({ ...prev, [position]: file_url }));
      toast.success(`Foto ${position === 'front' ? 'frontal' : position === 'back' ? 'de costas' : 'lateral'} carregada!`);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao carregar foto');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (position) => {
    setPhotos(prev => ({ ...prev, [position]: null }));
    setPhotoUrls(prev => ({ ...prev, [position]: null }));
  };

  const analysisMutation = useMutation({
    mutationFn: async () => {
      setAnalyzing(true);
      
      const uploadedPhotos = Object.values(photoUrls).filter(Boolean);
      
      if (uploadedPhotos.length === 0) {
        throw new Error('Envie pelo menos uma foto');
      }

      // Buscar dados do perfil do usuário
      let userProfile = null;
      let latestProgress = null;
      try {
        const profiles = await base44.entities.UserProfile.list();
        userProfile = profiles.find(p => p.user_email === user.email);
        
        const progressEntries = await base44.entities.ProgressEntry.list('-date');
        latestProgress = progressEntries.find(p => p.created_by === user.email);
      } catch (e) {
        console.log("Erro ao buscar dados adicionais:", e);
      }

      // Construir contexto do usuário com dados completos
      const userContext = `
        Dados do usuário:
        - Peso atual: ${latestProgress?.weight || userProfile?.peso_atual || 'não informado'}kg
        - Altura: ${userProfile?.altura || 'não informado'}cm
        - Objetivo: ${userProfile?.objetivo || 'não informado'}
        - Nível: ${userProfile?.nivel_fitness || 'não informado'}
        - Medidas atuais: ${latestProgress?.measurements ? JSON.stringify(latestProgress.measurements) : 'não informado'}
        ${previousAnalysis ? `
        Análise anterior (${previousAnalysis.date}):
        - Gordura corporal estimada: ${previousAnalysis.estimated_body_fat}%
        - Massa muscular estimada: ${previousAnalysis.estimated_muscle_mass}%
        - Pontuação geral: ${previousAnalysis.overall_score}/100
        - Pontos fracos: ${previousAnalysis.weak_points?.join(', ') || 'N/A'}
        - Pontos fortes: ${previousAnalysis.strong_points?.join(', ') || 'N/A'}
        ` : ''}
      `;

      const prompt = `
        Você é um especialista em avaliação física e bioimpedância visual. Analise detalhadamente as fotos corporais do usuário e forneça uma análise completa.

        ${userContext}

        IMPORTANTE: 
        1. Faça uma análise visual detalhada baseada nas fotos. Seja preciso e profissional.
        2. TODAS as respostas devem estar em PORTUGUÊS DO BRASIL.
        3. Use os valores EXATOS especificados abaixo (em português).

        Retorne um JSON com a seguinte estrutura:
        {
          "estimated_body_fat": (número de 5 a 40 - percentual de gordura estimado),
          "estimated_muscle_mass": (número de 20 a 50 - percentual de massa muscular estimado),
          "body_type": (um de: "Ectomorfo", "Mesomorfo", "Endomorfo", "Ecto-Mesomorfo", "Meso-Endomorfo"),
          "muscle_development": {
            "chest": (um de: "Subdesenvolvido", "Médio", "Bem Desenvolvido", "Excelente"),
            "back": (um de: "Subdesenvolvido", "Médio", "Bem Desenvolvido", "Excelente"),
            "shoulders": (um de: "Subdesenvolvido", "Médio", "Bem Desenvolvido", "Excelente"),
            "arms": (um de: "Subdesenvolvido", "Médio", "Bem Desenvolvido", "Excelente"),
            "core": (um de: "Subdesenvolvido", "Médio", "Bem Desenvolvido", "Excelente"),
            "legs": (um de: "Subdesenvolvido", "Médio", "Bem Desenvolvido", "Excelente")
          },
          "symmetry_score": (número de 1 a 10),
          "posture_analysis": {
            "score": (número de 1 a 10),
            "issues": ["lista de problemas posturais identificados em português"],
            "recommendations": ["lista de recomendações para postura em português"]
          },
          "body_composition_details": {
            "visceral_fat_level": (um de: "Baixo", "Normal", "Alto", "Muito Alto"),
            "subcutaneous_fat_distribution": "descrição da distribuição de gordura subcutânea em português",
            "muscle_definition_level": (um de: "Nenhuma", "Leve", "Moderada", "Definida", "Muito Definida"),
            "vascularity": (um de: "Nenhuma", "Leve", "Moderada", "Definida", "Muito Definida")
          },
          "weak_points": ["lista de pontos fracos que precisam ser trabalhados em português"],
          "strong_points": ["lista de pontos fortes do físico em português"],
          "recommendations": ["lista de 5-7 recomendações específicas de treino e nutrição em português"],
          "overall_score": (número de 1 a 100 - avaliação geral do físico),
          "detailed_analysis": "Análise detalhada em texto em PORTUGUÊS (3-4 parágrafos) sobre a composição corporal, distribuição de gordura, desenvolvimento muscular, proporções e áreas que precisam de mais atenção. Seja específico e construtivo."
          ${previousAnalysis ? ',"comparison_notes": "Compare com a análise anterior e descreva as mudanças observadas, melhorias ou regressões em PORTUGUÊS. Seja detalhado."' : ''}
        }
      `;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: uploadedPhotos,
        response_json_schema: {
          type: "object",
          properties: {
            estimated_body_fat: { type: "number" },
            estimated_muscle_mass: { type: "number" },
            body_type: { type: "string" },
            muscle_development: { type: "object" },
            symmetry_score: { type: "number" },
            posture_analysis: { type: "object" },
            body_composition_details: { type: "object" },
            weak_points: { type: "array", items: { type: "string" } },
            strong_points: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            overall_score: { type: "number" },
            detailed_analysis: { type: "string" },
            comparison_notes: { type: "string" }
          }
        }
      });

      // Salvar análise
      const analysisData = {
        user_email: user.email,
        date: new Date().toISOString().split('T')[0],
        photos: uploadedPhotos,
        ...result
      };

      await base44.entities.BodyAnalysis.create(analysisData);
      return analysisData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['body-analyses']);
      setPhotos({ front: null, back: null, side: null });
      setPhotoUrls({ front: null, back: null, side: null });
      toast.success('Análise concluída com sucesso!');
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      console.error('Erro na análise:', error);
      toast.error('Erro ao realizar análise: ' + error.message);
    },
    onSettled: () => {
      setAnalyzing(false);
    }
  });

  const photoPositions = [
    { key: 'front', label: 'Frente', description: 'Posição frontal, braços relaxados' },
    { key: 'back', label: 'Costas', description: 'De costas, braços relaxados' },
    { key: 'side', label: 'Lateral', description: 'Perfil lateral direito ou esquerdo' }
  ];

  const hasAnyPhoto = Object.values(photoUrls).some(Boolean);

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-400" />
          Nova Análise Corporal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instruções */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-slate-300">
              <p className="font-medium text-blue-400 mb-2">Dicas para melhores resultados:</p>
              <ul className="space-y-1 text-slate-400">
                <li>• Use roupas justas ou traje de banho</li>
                <li>• Boa iluminação e fundo neutro</li>
                <li>• Postura natural, sem contrair músculos</li>
                <li>• Envie fotos de frente, costas e lateral para análise completa</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Upload de Fotos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {photoPositions.map(({ key, label, description }) => (
            <div key={key} className="space-y-2">
              <Label className="text-slate-300">{label}</Label>
              <div className="relative">
                {photoUrls[key] ? (
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-green-600/50">
                    <img 
                      src={photoUrls[key]} 
                      alt={label}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removePhoto(key)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="block aspect-[3/4] border-2 border-dashed border-slate-700 rounded-lg hover:border-blue-600 transition-colors cursor-pointer">
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                      <Upload className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-xs mt-1 text-center px-2">{description}</span>
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoChange(key, e.target.files[0])}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Botão de Análise */}
        <Button
          onClick={() => analysisMutation.mutate()}
          disabled={!hasAnyPhoto || uploading || analyzing}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Carregando foto...
            </>
          ) : analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando com IA...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 mr-2" />
              Iniciar Análise
            </>
          )}
        </Button>

        {analyzing && (
          <div className="text-center py-4">
            <p className="text-slate-400 text-sm">
              A IA está analisando suas fotos. Isso pode levar alguns segundos...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}