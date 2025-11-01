import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Upload, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CalorieCounter() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mealType, setMealType] = useState("lunch");
  const [notes, setNotes] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
    }
  };

  const analyzePhoto = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    try {
      // 1. Upload da foto
      const uploadResult = await base44.integrations.Core.UploadFile({ file: selectedFile });
      const photoUrl = uploadResult.file_url;

      // 2. Análise com IA
      const analysisPrompt = `
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

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        file_urls: photoUrl,
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
    } catch (error) {
      console.error("Erro ao analisar foto:", error);
      alert("Erro ao analisar a foto. Tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
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
      setAnalysisResult(null);
      setNotes("");
      alert("Refeição salva com sucesso! 🎉");
    },
  });

  const handleSaveMeal = () => {
    if (!analysisResult) return;

    saveMealMutation.mutate({
      date: new Date().toISOString().split('T')[0],
      meal_type: mealType,
      photo_url: analysisResult.photoUrl,
      food_items: analysisResult.food_items,
      total_calories: analysisResult.total_calories,
      macros: analysisResult.macros,
      notes,
      analysis_complete: true,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-green-400" />
            Contador de Calorias por Foto
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Tire uma foto da sua refeição e deixe a IA calcular as calorias para você! 📸
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          {!previewUrl && (
            <label className="block">
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-12 text-center cursor-pointer hover:border-green-600 transition-all duration-300">
                <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-300 font-medium mb-1">
                  Clique para tirar/escolher foto
                </p>
                <p className="text-slate-500 text-sm">
                  Capture sua refeição ou selecione da galeria
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          )}

          {/* Preview */}
          {previewUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-64 object-cover rounded-xl"
              />
              <div className="flex gap-2 mt-4">
                <label className="flex-1">
                  <Button variant="outline" className="w-full border-slate-700" asChild>
                    <span>
                      <Camera className="w-4 h-4 mr-2" />
                      Trocar Foto
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
              </div>
            </motion.div>
          )}

          {/* Meal Type */}
          {previewUrl && !analysisResult && (
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
          {previewUrl && !analysisResult && (
            <Button
              onClick={analyzePhoto}
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
                    }}
                    className="flex-1 border-slate-700 text-slate-300"
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