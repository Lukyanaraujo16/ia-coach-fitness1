import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ScanBarcode, 
  Search, 
  Loader2, 
  Plus, 
  Check, 
  X, 
  AlertCircle,
  Package,
  Camera
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BarcodeScanner() {
  const [barcode, setBarcode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [mealType, setMealType] = useState("snack");
  const [quantity, setQuantity] = useState(1);
  const [scanError, setScanError] = useState(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  // Usar câmera + IA para ler código de barras
  const handlePhotoCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsSearching(true);
    setScanError(null);

    try {
      // Upload da foto
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      const photoUrl = uploadResult.file_url;

      // Usar IA para ler o código de barras da imagem
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise esta imagem e extraia o código de barras visível. 
O código de barras geralmente tem 8 ou 13 dígitos numéricos (EAN-8, EAN-13, UPC-A).
Retorne APENAS os números do código de barras, sem espaços ou outros caracteres.
Se não conseguir identificar um código de barras válido, retorne null.`,
        file_urls: photoUrl,
        response_json_schema: {
          type: "object",
          properties: {
            barcode: { type: "string", description: "O código de barras extraído (apenas números)" },
            confidence: { type: "string", enum: ["high", "medium", "low"] }
          }
        }
      });

      if (result.barcode && /^\d{8,13}$/.test(result.barcode)) {
        setBarcode(result.barcode);
        searchFood(result.barcode);
      } else {
        setScanError("Não foi possível identificar o código de barras na foto. Tente novamente com melhor iluminação ou digite manualmente.");
        setIsSearching(false);
      }
    } catch (error) {
      console.error("Erro ao processar foto:", error);
      setScanError("Erro ao processar a foto. Tente novamente.");
      setIsSearching(false);
    }
  };

  const [newFood, setNewFood] = useState({
    barcode: "",
    name: "",
    brand: "",
    serving_size: "100g",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    fiber: ""
  });

  const mealTypes = {
    breakfast: "Café da Manhã",
    lunch: "Almoço",
    snack: "Lanche",
    dinner: "Jantar",
    post_workout: "Pós-Treino",
  };

  // Buscar no banco local primeiro
  const { data: localFoods = [] } = useQuery({
    queryKey: ['local-foods'],
    queryFn: () => base44.entities.FoodDatabase.list(),
  });

  const searchFood = async (code) => {
    if (!code.trim()) return;
    
    setIsSearching(true);
    setSearchResult(null);
    setNotFound(false);
    setShowRegisterForm(false);

    try {
      // 1. Buscar no banco local primeiro
      const localMatch = localFoods.find(f => f.barcode === code);
      if (localMatch) {
        setSearchResult({
          ...localMatch,
          source: localMatch.source || "user_created"
        });
        setIsSearching(false);
        return;
      }

      // 2. Buscar na API Open Food Facts
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
      const data = await response.json();

      if (data.status === 1 && data.product) {
        const product = data.product;
        const nutriments = product.nutriments || {};
        
        setSearchResult({
          barcode: code,
          name: product.product_name || product.product_name_pt || "Produto sem nome",
          brand: product.brands || "",
          serving_size: product.serving_size || "100g",
          calories: Math.round(nutriments["energy-kcal_100g"] || nutriments["energy-kcal"] || 0),
          protein: Math.round(nutriments.proteins_100g || nutriments.proteins || 0),
          carbs: Math.round(nutriments.carbohydrates_100g || nutriments.carbohydrates || 0),
          fat: Math.round(nutriments.fat_100g || nutriments.fat || 0),
          fiber: Math.round(nutriments.fiber_100g || nutriments.fiber || 0),
          image_url: product.image_url || product.image_front_url || null,
          source: "open_food_facts"
        });
      } else {
        setNotFound(true);
        setNewFood(prev => ({ ...prev, barcode: code }));
      }
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      setNotFound(true);
      setNewFood(prev => ({ ...prev, barcode: code }));
    } finally {
      setIsSearching(false);
    }
  };

  const registerFoodMutation = useMutation({
    mutationFn: (data) => base44.entities.FoodDatabase.create(data),
    onSuccess: (createdFood) => {
      queryClient.invalidateQueries(['local-foods']);
      setSearchResult({
        ...createdFood,
        source: "user_created"
      });
      setShowRegisterForm(false);
      setNotFound(false);
    }
  });

  const saveMealMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.MealLog.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['meal-logs']);
      setSearchResult(null);
      setBarcode("");
      setQuantity(1);
      alert("Refeição salva com sucesso! 🎉");
    },
  });

  const handleRegisterFood = () => {
    if (!newFood.name || !newFood.calories) {
      alert("Preencha pelo menos o nome e as calorias");
      return;
    }

    registerFoodMutation.mutate({
      ...newFood,
      calories: Number(newFood.calories),
      protein: Number(newFood.protein) || 0,
      carbs: Number(newFood.carbs) || 0,
      fat: Number(newFood.fat) || 0,
      fiber: Number(newFood.fiber) || 0,
      source: "user_created"
    });
  };

  const handleSaveMeal = () => {
    if (!searchResult) return;

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const localDate = `${year}-${month}-${day}`;

    const totalCalories = Math.round(searchResult.calories * quantity);
    
    saveMealMutation.mutate({
      date: localDate,
      meal_type: mealType,
      photo_url: searchResult.image_url || null,
      food_items: [{
        name: searchResult.brand ? `${searchResult.name} (${searchResult.brand})` : searchResult.name,
        quantity: `${quantity} x ${searchResult.serving_size}`,
        calories: totalCalories
      }],
      total_calories: totalCalories,
      macros: {
        protein: Math.round((searchResult.protein || 0) * quantity),
        carbs: Math.round((searchResult.carbs || 0) * quantity),
        fat: Math.round((searchResult.fat || 0) * quantity),
        fiber: Math.round((searchResult.fiber || 0) * quantity)
      },
      notes: `Código de barras: ${searchResult.barcode}`,
      analysis_complete: true
    });
  };



  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ScanBarcode className="w-5 h-5 text-green-400" />
            Scanner de Código de Barras
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Digite ou escaneie o código de barras do produto 📦
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Botão de fotografar código de barras */}
          <label className="cursor-pointer block">
            <div className={`w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 h-14 rounded-md flex items-center justify-center gap-2 text-white font-medium ${isSearching ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analisando foto...
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  Fotografar Código de Barras
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
              disabled={isSearching}
            />
          </label>

          {scanError && (
            <p className="text-red-400 text-sm text-center">{scanError}</p>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-slate-500 text-sm">ou digite</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          {/* Input de código de barras */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value.replace(/\D/g, ''))}
                placeholder="Digite o código de barras"
                className="bg-slate-800 border-slate-700 text-white text-lg h-12"
                onKeyDown={(e) => e.key === 'Enter' && searchFood(barcode)}
              />
            </div>
            <Button
              onClick={() => searchFood(barcode)}
              disabled={isSearching || !barcode.trim()}
              className="bg-green-600 hover:bg-green-700 h-12 px-6"
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </Button>
          </div>

          {/* Dica */}
          <p className="text-slate-500 text-xs text-center">
            💡 O código de barras geralmente tem 8 ou 13 dígitos e fica na embalagem do produto
          </p>
        </CardContent>
      </Card>

      {/* Loading */}
      {isSearching && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 text-green-400 mx-auto animate-spin mb-4" />
            <p className="text-slate-300">Buscando produto...</p>
          </CardContent>
        </Card>
      )}

      {/* Resultado encontrado */}
      <AnimatePresence>
        {searchResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 border-green-800/50">
              <CardHeader>
                <div className="flex items-start gap-4">
                  {searchResult.image_url ? (
                    <img 
                      src={searchResult.image_url} 
                      alt={searchResult.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-slate-800 rounded-lg flex items-center justify-center">
                      <Package className="w-8 h-8 text-slate-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg">{searchResult.name}</CardTitle>
                    {searchResult.brand && (
                      <p className="text-slate-400 text-sm">{searchResult.brand}</p>
                    )}
                    <p className="text-slate-500 text-xs mt-1">
                      Porção: {searchResult.serving_size}
                    </p>
                    <p className="text-green-400/70 text-xs mt-1">
                      {searchResult.source === "open_food_facts" ? "📦 Open Food Facts" : "👤 Cadastrado por usuário"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Macros */}
                <div className="grid grid-cols-5 gap-2">
                  <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                    <p className="text-green-400 text-lg font-bold">{searchResult.calories}</p>
                    <p className="text-slate-400 text-xs">kcal</p>
                  </div>
                  <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                    <p className="text-blue-400 text-lg font-bold">{searchResult.protein}g</p>
                    <p className="text-slate-400 text-xs">Prot.</p>
                  </div>
                  <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                    <p className="text-orange-400 text-lg font-bold">{searchResult.carbs}g</p>
                    <p className="text-slate-400 text-xs">Carbs</p>
                  </div>
                  <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                    <p className="text-yellow-400 text-lg font-bold">{searchResult.fat}g</p>
                    <p className="text-slate-400 text-xs">Gord.</p>
                  </div>
                  <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                    <p className="text-emerald-400 text-lg font-bold">{searchResult.fiber}g</p>
                    <p className="text-slate-400 text-xs">Fibra</p>
                  </div>
                </div>

                {/* Quantidade */}
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">Quantidade de porções</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(0.5, quantity - 0.5))}
                      className="bg-slate-800 border-slate-700 text-white"
                    >
                      -
                    </Button>
                    <span className="text-white text-xl font-bold w-16 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(quantity + 0.5)}
                      className="bg-slate-800 border-slate-700 text-white"
                    >
                      +
                    </Button>
                    <span className="text-slate-400 text-sm">
                      = {Math.round(searchResult.calories * quantity)} kcal
                    </span>
                  </div>
                </div>

                {/* Tipo de refeição */}
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">Tipo de Refeição</Label>
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

                {/* Botões */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchResult(null);
                      setBarcode("");
                    }}
                    className="flex-1 bg-slate-800 border-slate-600 text-slate-200"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveMeal}
                    disabled={saveMealMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {saveMealMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Salvar Refeição
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Produto não encontrado */}
      <AnimatePresence>
        {notFound && !showRegisterForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-orange-900/20 border-orange-800/50">
              <CardContent className="p-6 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-orange-400 mx-auto" />
                <div>
                  <p className="text-white font-semibold">Produto não encontrado</p>
                  <p className="text-slate-400 text-sm mt-1">
                    O código <span className="text-orange-400 font-mono">{barcode}</span> não está no banco de dados
                  </p>
                </div>
                <Button
                  onClick={() => setShowRegisterForm(true)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Este Produto
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulário de cadastro */}
      <AnimatePresence>
        {showRegisterForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-green-400" />
                  Cadastrar Novo Produto
                </CardTitle>
                <p className="text-slate-400 text-sm">
                  Código: <span className="text-green-400 font-mono">{newFood.barcode}</span>
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label className="text-slate-300 text-sm">Nome do Produto *</Label>
                    <Input
                      value={newFood.name}
                      onChange={(e) => setNewFood(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Biscoito Integral"
                      className="bg-slate-800 border-slate-700 text-white mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-slate-300 text-sm">Marca</Label>
                    <Input
                      value={newFood.brand}
                      onChange={(e) => setNewFood(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="Ex: Nestlé"
                      className="bg-slate-800 border-slate-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm">Porção</Label>
                    <Input
                      value={newFood.serving_size}
                      onChange={(e) => setNewFood(prev => ({ ...prev, serving_size: e.target.value }))}
                      placeholder="Ex: 30g"
                      className="bg-slate-800 border-slate-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm">Calorias (kcal) *</Label>
                    <Input
                      type="number"
                      value={newFood.calories}
                      onChange={(e) => setNewFood(prev => ({ ...prev, calories: e.target.value }))}
                      placeholder="0"
                      className="bg-slate-800 border-slate-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm">Proteínas (g)</Label>
                    <Input
                      type="number"
                      value={newFood.protein}
                      onChange={(e) => setNewFood(prev => ({ ...prev, protein: e.target.value }))}
                      placeholder="0"
                      className="bg-slate-800 border-slate-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm">Carboidratos (g)</Label>
                    <Input
                      type="number"
                      value={newFood.carbs}
                      onChange={(e) => setNewFood(prev => ({ ...prev, carbs: e.target.value }))}
                      placeholder="0"
                      className="bg-slate-800 border-slate-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm">Gorduras (g)</Label>
                    <Input
                      type="number"
                      value={newFood.fat}
                      onChange={(e) => setNewFood(prev => ({ ...prev, fat: e.target.value }))}
                      placeholder="0"
                      className="bg-slate-800 border-slate-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm">Fibras (g)</Label>
                    <Input
                      type="number"
                      value={newFood.fiber}
                      onChange={(e) => setNewFood(prev => ({ ...prev, fiber: e.target.value }))}
                      placeholder="0"
                      className="bg-slate-800 border-slate-700 text-white mt-1"
                    />
                  </div>
                </div>

                <p className="text-slate-500 text-xs">
                  💡 Dica: Essas informações geralmente estão na tabela nutricional da embalagem
                </p>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRegisterForm(false);
                      setNotFound(false);
                      setBarcode("");
                    }}
                    className="flex-1 bg-slate-800 border-slate-600 text-slate-200"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleRegisterFood}
                    disabled={registerFoodMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {registerFoodMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Cadastrar Produto
                      </>
                    )}
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