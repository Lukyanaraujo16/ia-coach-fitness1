
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Upload, Loader2, Sparkles, RefreshCw, Type } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CalorieCounter() {
  const [inputMode, setInputMode] = useState("photo"); // "photo" or "text"
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mealDescription, setMealDescription] = useState("");
  const [mealType, setMealType] = useState("lunch");
  const [notes, setNotes] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [adjustmentRequest, setAdjustmentRequest] = useState("");
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false); // New state variable
  const queryClient = useQueryClient();

  const mealTypes = {
    breakfast: "Café da Manhã",
    lunch: "Almoço",
    snack: "Lanche",
    dinner: "Jantar",
    post_workout: "Pós-Treino",
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
      setShowAdjustment(false);
      setShowPhotoOptions(false); // Reset photo options visibility
    }
  };

  const analyzePhoto = async (adjustmentText = null) => {
    if (!selectedFile && !mealDescription) return;

    setIsAnalyzing(true);
    try {
      let photoUrl = null;
      
      // Se for foto, fazer upload
      if (inputMode === "photo") {
        if (!analysisResult?.photoUrl) {
          const uploadResult = await base44.integrations.Core.UploadFile({ file: selectedFile });
          photoUrl = uploadResult.file_url;
        } else {
          photoUrl = analysisResult.photoUrl;
        }
      }

      // Montar prompt
      let analysisPrompt = "";
      
      if (inputMode === "photo") {
        analysisPrompt = `
Analise esta foto de comida e retorne informações nutricionais detalhadas.
Identifique todos os alimentos visíveis, estime as quantidades e calcule:
- Calorias totais
- Proteínas (g)
- Carboidratos (g)
- Gorduras (g)  
- Fibras (g)

Liste cada alimento com sua quantidade estimada e calorias individuais.
Seja o mais preciso possível com base na aparência visual dos alimentos.
`;
      } else {
        analysisPrompt = `
O usuário descreveu a seguinte refeição: "${mealDescription}"

Analise esta descrição e retorne informações nutricionais detalhadas:
- Calorias totais
- Proteínas (g)
- Carboidratos (g)
- Gorduras (g)  
- Fibras (g)

Liste cada alimento mencionado com sua quantidade estimada (ou inferida se não especificada) e calorias individuais.
Seja o mais preciso possível com base nas quantidades típicas se não foram especificadas.
`;
      }

      // Adicionar ajuste se houver
      if (adjustmentText) {
        analysisPrompt += `\n\nO usuário solicitou o seguinte ajuste: "${adjustmentText}"\nRecalcule os valores nutricionais considerando esta correção/adição.`;
      }

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        file_urls: inputMode === "photo" ? photoUrl : undefined,
        response_json_schema: {
          type: "object",
          properties: {
            food_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  quantity: { type: "string" },
                  calories: { type: "number" }
                }
              }
            },
            total_calories: { type: "number" },
            macros: {
              type: "object",
              properties: {
                protein: { type: "number" },
                carbs: { type: "number" },
                fat: { type: "number" },
                fiber: { type: "number" }
              }
            },
            confidence: { type: "string" },
            recommendations: { type: "string" }
          }
        }
      });

      setAnalysisResult({ ...analysis, photoUrl });
      setAdjustmentRequest("");
      setShowAdjustment(false);
    } catch (error) {
      // Silenciar erros de abort completamente
      if (!error.message?.includes('abort')) {
        console.error("Erro ao analisar:", error);
        alert("Erro ao analisar. Tente novamente.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReanalyze = () => {
    if (!adjustmentRequest.trim()) {
      alert("Digite o que deseja adicionar ou corrigir");
      return;
    }
    analyzePhoto(adjustmentRequest);
  };

  const saveMealMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.MealLog.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['meal-logs']);
      // Reset
      setSelectedFile(null);
      setPreviewUrl(null);
      setMealDescription("");
      setAnalysisResult(null);
      setNotes("");
      setAdjustmentRequest("");
      setShowAdjustment(false);
      setShowPhotoOptions(false);
      alert("Refeição salva com sucesso! 🎉");
    },
  });

  const handleSaveMeal = () => {
    if (!analysisResult) return;

    // Usar data local (horário do Brasil)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const localDate = `${year}-${month}-${day}`;

    saveMealMutation.mutate({
      date: localDate,
      meal_type: mealType,
      photo_url: analysisResult.photoUrl || null,
      food_items: analysisResult.food_items,
      total_calories: analysisResult.total_calories,
      macros: analysisResult.macros,
      notes,
      analysis_complete: true,
    });
  };

  const canAnalyze = inputMode === "photo" ? (selectedFile && !analysisResult) : (mealDescription.trim() && !analysisResult);

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-green-400" />
            Contador de Calorias
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Envie uma foto ou descreva sua refeição para calcular as calorias! 📸
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Selector */}
          <Tabs value={inputMode} onValueChange={(value) => { setInputMode(value); setShowPhotoOptions(false); setSelectedFile(null); setPreviewUrl(null); setMealDescription(""); setAnalysisResult(null); }} className="w-full">
            <TabsList className="bg-slate-800 border border-slate-700 w-full grid grid-cols-2">
              <TabsTrigger value="photo" className="data-[state=active]:bg-green-600">
                <Camera className="w-4 h-4 mr-2" />
                Foto
              </TabsTrigger>
              <TabsTrigger value="text" className="data-[state=active]:bg-green-600">
                <Type className="w-4 h-4 mr-2" />
                Texto
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Photo Input - Escolha entre Câmera ou Galeria */}
          {inputMode === "photo" && !previewUrl && !showPhotoOptions && (
            <div className="space-y-3">
              <Button
                onClick={() => setShowPhotoOptions(true)}
                className="w-full h-32 border-2 border-dashed border-slate-700 bg-transparent hover:border-green-600 hover:bg-slate-800/50 transition-all duration-300"
              >
                <div className="text-center">
                  <Upload className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-300 font-medium mb-1">
                    Adicionar Foto da Refeição
                  </p>
                  <p className="text-slate-500 text-sm">
                    Tire uma foto ou escolha da galeria
                  </p>
                </div>
              </Button>
            </div>
          )}

          {/* Opções de Foto */}
          {inputMode === "photo" && showPhotoOptions && !previewUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-2 gap-3"
            >
              <label className="cursor-pointer">
                <Card className="bg-slate-800 border-slate-700 hover:border-green-600 hover:bg-slate-700 transition-all">
                  <CardContent className="p-6 text-center">
                    <Camera className="w-10 h-10 text-green-400 mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">Câmera</p>
                    <p className="text-slate-400 text-xs">Tirar foto agora</p>
                  </CardContent>
                </Card>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>

              <label className="cursor-pointer">
                <Card className="bg-slate-800 border-slate-700 hover:border-green-600 hover:bg-slate-700 transition-all">
                  <CardContent className="p-6 text-center">
                    <Upload className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">Galeria</p>
                    <p className="text-slate-400 text-xs">Escolher foto</p>
                  </CardContent>
                </Card>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </motion.div>
          )}

          {/* Photo Preview */}
          {inputMode === "photo" && previewUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-64 object-cover rounded-xl"
              />
              <div className="grid grid-cols-2 gap-2 mt-4">
                <label>
                  <Button 
                    variant="outline" 
                    className="w-full bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white" 
                    asChild
                  >
                    <span>
                      <Camera className="w-4 h-4 mr-2" />
                      Nova Foto
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <label>
                  <Button 
                    variant="outline" 
                    className="w-full bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white" 
                    asChild
                  >
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Galeria
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </motion.div>
          )}

          {/* Text Input */}
          {inputMode === "text" && !analysisResult && (
            <div className="space-y-2">
              <label className="text-slate-300 text-sm font-medium">
                Descreva sua refeição
              </label>
              <Textarea
                value={mealDescription}
                onChange={(e) => setMealDescription(e.target.value)}
                placeholder="Ex: 200g de arroz integral, 150g de frango grelhado, salada verde com azeite, 1 batata doce média"
                className="bg-slate-800 border-slate-700 text-white min-h-32"
              />
              <p className="text-slate-500 text-xs">
                💡 Dica: Seja específico com as quantidades para uma análise mais precisa
              </p>
            </div>
          )}

          {/* Meal Type */}
          {!analysisResult && (inputMode === "photo" ? previewUrl : mealDescription.trim()) && (
            <div className="space-y-2">
              <label className="text-slate-300 text-sm font-medium">
                Tipo de Refeição
              </label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(mealTypes).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Analyze Button */}
          {canAnalyze && (
            <Button
              onClick={() => analyzePhoto()}
              disabled={isAnalyzing}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 py-6"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analisando com IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Analisar Refeição
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Analysis Result */}
      <AnimatePresence>
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 border-green-800/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-400" />
                  Resultado da Análise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Total Calories */}
                <div className="text-center p-6 bg-slate-900/50 rounded-xl">
                  <p className="text-slate-400 text-sm mb-2">Total de Calorias</p>
                  <p className="text-5xl font-bold text-green-400">
                    {analysisResult.total_calories}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">kcal</p>
                </div>

                {/* Macros */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                    <p className="text-blue-400 text-xl font-bold">
                      {Math.round(analysisResult.macros.protein)}g
                    </p>
                    <p className="text-slate-400 text-xs mt-1">Proteína</p>
                  </div>
                  <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                    <p className="text-orange-400 text-xl font-bold">
                      {Math.round(analysisResult.macros.carbs)}g
                    </p>
                    <p className="text-slate-400 text-xs mt-1">Carbos</p>
                  </div>
                  <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                    <p className="text-yellow-400 text-xl font-bold">
                      {Math.round(analysisResult.macros.fat)}g
                    </p>
                    <p className="text-slate-400 text-xs mt-1">Gordura</p>
                  </div>
                  <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                    <p className="text-green-400 text-xl font-bold">
                      {Math.round(analysisResult.macros.fiber)}g
                    </p>
                    <p className="text-slate-400 text-xs mt-1">Fibras</p>
                  </div>
                </div>

                {/* Food Items */}
                <div>
                  <h4 className="text-white font-semibold mb-3">Alimentos Identificados:</h4>
                  <div className="space-y-2">
                    {analysisResult.food_items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg"
                      >
                        <div>
                          <p className="text-white font-medium">{item.name}</p>
                          <p className="text-slate-400 text-sm">{item.quantity}</p>
                        </div>
                        <p className="text-green-400 font-bold">{item.calories} kcal</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Adjustment Section */}
                {!showAdjustment ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowAdjustment(true)}
                    className="w-full bg-blue-900/20 border-blue-700 text-blue-400 hover:bg-blue-800/30 hover:text-blue-300"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    A IA identificou tudo corretamente?
                  </Button>
                ) : (
                  <div className="space-y-3 p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                    <p className="text-blue-400 text-sm font-semibold">
                      💡 Adicione ou corrija algo:
                    </p>
                    <Textarea
                      value={adjustmentRequest}
                      onChange={(e) => setAdjustmentRequest(e.target.value)}
                      placeholder="Ex: Adicione 2 ovos cozidos que não apareceram&#10;ou: A porção de arroz está maior, cerca de 200g"
                      className="bg-slate-800 border-slate-700 text-white"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAdjustment(false);
                          setAdjustmentRequest("");
                        }}
                        className="flex-1 bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleReanalyze}
                        disabled={isAnalyzing || !adjustmentRequest.trim()}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Recalculando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Recalcular
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {analysisResult.recommendations && (
                  <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                    <p className="text-blue-400 text-sm font-semibold mb-1">💡 Recomendação:</p>
                    <p className="text-slate-300 text-sm">{analysisResult.recommendations}</p>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-slate-300 text-sm font-medium">
                    Observações (opcional)
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Refeição pré-treino, estava deliciosa..."
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                {/* Save Button */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAnalysisResult(null);
                      setPreviewUrl(null);
                      setSelectedFile(null);
                      setMealDescription("");
                      setShowAdjustment(false);
                      setShowPhotoOptions(false); // Reset photo options visibility
                    }}
                    className="flex-1 bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveMeal}
                    disabled={saveMealMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {saveMealMutation.isPending ? "Salvando..." : "Salvar Refeição"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
