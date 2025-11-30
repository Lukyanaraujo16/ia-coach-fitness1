import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Video, 
  Upload, 
  Camera, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Play,
  Square,
  X,
  Sparkles,
  Clock,
  Target,
  AlertTriangle
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const commonExercises = [
  "Agachamento",
  "Supino",
  "Levantamento Terra",
  "Remada",
  "Desenvolvimento",
  "Rosca Direta",
  "Tríceps",
  "Leg Press",
  "Stiff",
  "Prancha",
  "Flexão",
  "Barra Fixa",
  "Outro"
];

export default function VideoAnalysis() {
  const [exerciseName, setExerciseName] = useState("");
  const [customExercise, setCustomExercise] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  const MAX_RECORDING_TIME = 30;

  // Detectar iOS - para usar câmera nativa no iPhone
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // Iniciar gravação (usado apenas em Android/Desktop)
  const startRecording = async () => {
    try {
      setError(null);
      
      // Configurações de vídeo - iOS precisa de constraints mais simples
      const videoConstraints = isIOS 
        ? { facingMode: "environment" }
        : { 
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          };
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: videoConstraints, 
        audio: false 
      });
      
      streamRef.current = stream;
      
      // Configurar vídeo element antes de setar o stream
      if (videoRef.current) {
        videoRef.current.setAttribute('autoplay', '');
        videoRef.current.setAttribute('muted', '');
        videoRef.current.setAttribute('playsinline', '');
        videoRef.current.muted = true;
        videoRef.current.srcObject = stream;
        
        // iOS precisa de play() explícito após srcObject
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.log("Play error (geralmente ok no iOS):", playErr);
        }
      }

      // Verificar formatos suportados - iOS Safari suporta mp4
      let mimeType = '';
      const mimeTypes = [
        'video/mp4',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm'
      ];
      
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      // Se nenhum suportado, tentar sem especificar
      const recorderOptions = mimeType ? { mimeType } : {};
      
      console.log("Usando mimeType:", mimeType || "default");

      const mediaRecorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const actualMimeType = mediaRecorder.mimeType || mimeType || 'video/mp4';
        const blob = new Blob(chunksRef.current, { type: actualMimeType });
        const extension = actualMimeType.includes('mp4') ? 'mp4' : 'webm';
        const file = new File([blob], `exercicio_${Date.now()}.${extension}`, { type: actualMimeType });
        setVideoFile(file);
        setVideoPreview(URL.createObjectURL(blob));
        
        // Parar stream
        streamRef.current?.getTracks().forEach(track => track.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };

      mediaRecorder.start(1000); // Gravar em chunks de 1 segundo
      setIsRecording(true);
      setRecordingTime(0);

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_RECORDING_TIME - 1) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      setError("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
    }
  };

  // Parar gravação
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  // Upload de arquivo
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamanho máximo de 100MB primeiro
      if (file.size > 100 * 1024 * 1024) {
        setError("O arquivo é muito grande. Máximo de 100MB.");
        return;
      }

      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      
      // Verificar se é formato MOV ou HEVC (comum no iPhone)
      const isMovFormat = fileName.endsWith('.mov') || fileType.includes('quicktime');
      const isHevcFormat = fileType.includes('hevc') || fileType.includes('heic');
      
      if (isMovFormat || isHevcFormat) {
        setError(
          "⚠️ Formato MOV/HEVC detectado (padrão do iPhone). Este formato não é suportado.\n\n" +
          "📱 Para resolver no iPhone:\n" +
          "1. Vá em Ajustes → Câmera → Formatos\n" +
          "2. Selecione 'Mais Compatível'\n" +
          "3. Grave o vídeo novamente\n\n" +
          "Ou use o botão 'Gravar Vídeo' que já usa formato compatível."
        );
        return;
      }

      const videoUrl = URL.createObjectURL(file);
      
      setVideoFile(file);
      setVideoPreview(videoUrl);
      setError(null);
      
      console.log("Arquivo selecionado:", file.name, file.type, Math.round(file.size / 1024 / 1024) + "MB");
    }
  };

  // Limpar vídeo
  const clearVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setAnalysis(null);
    setError(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Analisar vídeo
  const analyzeVideo = async () => {
    const exercise = exerciseName === "Outro" ? customExercise : exerciseName;
    
    if (!exercise) {
      setError("Selecione ou digite o nome do exercício.");
      return;
    }
    
    if (!videoFile) {
      setError("Grave ou faça upload de um vídeo primeiro.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setAnalysis(null);

    try {
      // 1. Upload do vídeo
      console.log("Iniciando upload do vídeo:", videoFile.name, videoFile.type);
      const uploadResult = await base44.integrations.Core.UploadFile({ file: videoFile });
      const file_url = uploadResult.file_url;
      console.log("Upload concluído:", file_url);
      
      if (!file_url) {
        throw new Error("Falha no upload do vídeo");
      }
      
      setIsUploading(false);
      setIsAnalyzing(true);

      // 2. Análise pela IA
      console.log("Iniciando análise pela IA...");
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um personal trainer profissional especializado em biomecânica e análise de movimento.

Analise o vídeo do exercício "${exercise}" e forneça um feedback detalhado e construtivo.

IMPORTANTE: Analise com cuidado todos os aspectos visíveis no vídeo.

Sua análise deve incluir:

## 📊 Avaliação Geral
Dê uma nota de 1 a 10 para a execução e um resumo breve.

## ✅ Pontos Positivos
Liste o que o praticante está fazendo corretamente.

## ⚠️ Pontos de Atenção
Liste os erros ou aspectos que precisam ser melhorados, explicando o porquê.

## 💡 Dicas de Correção
Forneça instruções práticas e específicas para corrigir os erros identificados.

## 🎯 Foco Principal
Indique o aspecto mais importante que o praticante deve focar para melhorar.

Seja específico, técnico mas acessível, e sempre mantenha um tom encorajador e construtivo.
Se não conseguir ver claramente algum aspecto no vídeo, mencione isso.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            nota: { type: "number", description: "Nota de 1 a 10" },
            resumo: { type: "string", description: "Resumo breve da avaliação" },
            pontos_positivos: { 
              type: "array", 
              items: { type: "string" },
              description: "Lista de pontos positivos"
            },
            pontos_atencao: { 
              type: "array", 
              items: { type: "string" },
              description: "Lista de pontos que precisam de atenção"
            },
            dicas_correcao: { 
              type: "array", 
              items: { type: "string" },
              description: "Dicas práticas para correção"
            },
            foco_principal: { type: "string", description: "Aspecto mais importante para focar" },
            observacao_video: { type: "string", description: "Observações sobre a qualidade do vídeo, se houver" }
          }
        }
      });

      console.log("Análise concluída:", result);
      setAnalysis(result);
      
    } catch (err) {
      console.error("Erro na análise:", err);
      const errorMsg = err?.message || err?.toString() || "Erro desconhecido";
      setError(`Erro ao analisar o vídeo: ${errorMsg}. Tente um vídeo mais curto ou em outro formato.`);
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const getNotaColor = (nota) => {
    if (nota >= 8) return "text-green-400";
    if (nota >= 6) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-700/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-600/30 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Análise de Execução por IA</h2>
              <p className="text-slate-300 text-sm mt-1">
                Grave um vídeo de até 30 segundos do seu exercício e receba feedback personalizado sobre sua execução.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seleção de Exercício */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            Qual exercício você vai analisar?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={exerciseName} onValueChange={setExerciseName}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Selecione o exercício" />
            </SelectTrigger>
            <SelectContent>
              {commonExercises.map(ex => (
                <SelectItem key={ex} value={ex}>{ex}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {exerciseName === "Outro" && (
            <Input
              value={customExercise}
              onChange={(e) => setCustomExercise(e.target.value)}
              placeholder="Digite o nome do exercício"
              className="bg-slate-800 border-slate-700 text-white"
            />
          )}
        </CardContent>
      </Card>

      {/* Captura de Vídeo */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Video className="w-5 h-5 text-green-400" />
            Vídeo do Exercício
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preview do vídeo */}
          {(isRecording || videoPreview) && (
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
              {isRecording ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  webkit-playsinline="true"
                  x-webkit-airplay="deny"
                  disablePictureInPicture
                  className="w-full h-full object-cover"
                  style={{ 
                    transform: 'scaleX(1)',
                    WebkitTransform: 'scaleX(1)',
                    background: '#000'
                  }}
                  onLoadedMetadata={(e) => {
                    // Garantir que o vídeo está tocando após metadata carregar
                    e.target.play().catch(() => {});
                  }}
                />
              ) : videoPreview ? (
                <video
                  src={videoPreview}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error("Erro ao carregar vídeo no player:", e);
                    setError("Não foi possível reproduzir o vídeo no navegador, mas você ainda pode enviar para análise.");
                  }}
                />
              ) : null}
              
              {isRecording && (
                <div className="absolute top-3 right-3 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-white text-sm font-medium">
                    {recordingTime}s / {MAX_RECORDING_TIME}s
                  </span>
                </div>
              )}
              
              {videoPreview && !isRecording && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearVideo}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          {/* Botões de ação */}
          {!videoPreview && !isRecording && (
            <div className="grid grid-cols-2 gap-3">
              {/* No iOS, usar input capture que abre a câmera nativa */}
              {isIOS ? (
                <label className="bg-red-600 hover:bg-red-700 h-20 flex flex-col gap-2 items-center justify-center rounded-md cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                  <span className="text-white text-sm font-medium">Gravar Vídeo</span>
                  <input
                    type="file"
                    accept="video/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              ) : (
                <Button
                  onClick={startRecording}
                  className="bg-red-600 hover:bg-red-700 h-20 flex-col gap-2"
                >
                  <Camera className="w-6 h-6" />
                  <span>Gravar Vídeo</span>
                </Button>
              )}
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 h-20 flex-col gap-2"
              >
                <Upload className="w-6 h-6" />
                <span>Upload</span>
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {isRecording && (
            <Button
              onClick={stopRecording}
              className="w-full bg-slate-700 hover:bg-slate-600 h-14"
            >
              <Square className="w-5 h-5 mr-2" />
              Parar Gravação
            </Button>
          )}

          {/* Dicas */}
          <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
            <p className="text-slate-300 text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Dicas para uma boa análise:
            </p>
            <ul className="text-slate-400 text-xs space-y-1 ml-6 list-disc">
              <li>Posicione a câmera de lado ou em ângulo que mostre todo o movimento</li>
              <li>Garanta boa iluminação no ambiente</li>
              <li>Vista roupas que permitam ver a postura</li>
              <li>Grave de 2 a 5 repetições do exercício</li>
              <li><strong>iPhone:</strong> Use o botão "Gravar Vídeo" do app, ou configure: Ajustes → Câmera → Formatos → Mais Compatível</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Erro */}
      {error && (
        <Card className="bg-red-900/20 border-red-700/50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Botão Analisar */}
      {videoFile && !analysis && (
        <Button
          onClick={analyzeVideo}
          disabled={isUploading || isAnalyzing}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-14 text-lg"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Enviando vídeo...
            </>
          ) : isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Analisando execução...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Analisar Execução
            </>
          )}
        </Button>
      )}

      {/* Resultado da Análise */}
      {analysis && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                Resultado da Análise
              </CardTitle>
              <div className={`text-3xl font-bold ${getNotaColor(analysis.nota)}`}>
                {analysis.nota}/10
              </div>
            </div>
            <p className="text-slate-300 text-sm mt-2">{analysis.resumo}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Observação do vídeo */}
            {analysis.observacao_video && (
              <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3">
                <p className="text-yellow-300 text-sm">📹 {analysis.observacao_video}</p>
              </div>
            )}

            {/* Pontos Positivos */}
            {analysis.pontos_positivos?.length > 0 && (
              <div>
                <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Pontos Positivos
                </h4>
                <ul className="space-y-2">
                  {analysis.pontos_positivos.map((ponto, idx) => (
                    <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      {ponto}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pontos de Atenção */}
            {analysis.pontos_atencao?.length > 0 && (
              <div>
                <h4 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Pontos de Atenção
                </h4>
                <ul className="space-y-2">
                  {analysis.pontos_atencao.map((ponto, idx) => (
                    <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-yellow-400 mt-1">•</span>
                      {ponto}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Dicas de Correção */}
            {analysis.dicas_correcao?.length > 0 && (
              <div>
                <h4 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Dicas de Correção
                </h4>
                <ul className="space-y-2">
                  {analysis.dicas_correcao.map((dica, idx) => (
                    <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-blue-400 mt-1">{idx + 1}.</span>
                      {dica}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Foco Principal */}
            {analysis.foco_principal && (
              <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4">
                <h4 className="text-purple-400 font-semibold mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Foco Principal
                </h4>
                <p className="text-slate-200">{analysis.foco_principal}</p>
              </div>
            )}

            {/* Nova análise */}
            <Button
              onClick={clearVideo}
              variant="outline"
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Analisar Outro Vídeo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}