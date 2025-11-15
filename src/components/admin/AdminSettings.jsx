import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image, Upload, Check, AlertCircle } from "lucide-react";

export default function AdminSettings({ user }) {
  const [logoUrl, setLogoUrl] = useState(user?.app_logo_url || "");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const queryClient = useQueryClient();

  const updateLogoMutation = useMutation({
    mutationFn: (url) => base44.auth.updateMe({ app_logo_url: url }),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-users']);
      setMessage({ type: "success", text: "Logo atualizada com sucesso!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      // Recarregar a página para atualizar a logo no layout
      setTimeout(() => window.location.reload(), 1000);
    },
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setMessage({ type: "", text: "" });
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setLogoUrl(file_url);
      setMessage({ type: "info", text: "Imagem carregada. Clique em Salvar para aplicar." });
    } catch (error) {
      console.error("Error uploading logo:", error);
      setMessage({ type: "error", text: "Erro ao fazer upload da imagem." });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = () => {
    if (!logoUrl.trim()) {
      setMessage({ type: "error", text: "Informe a URL da logo." });
      return;
    }
    updateLogoMutation.mutate(logoUrl);
  };

  const currentLogo = user?.app_logo_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904da724b4ce40db58404e7/c84efc51a_LogoIA.png";

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Image className="w-5 h-5" />
            Logo do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Atual */}
          <div className="space-y-3">
            <Label className="text-slate-300">Logo Atual</Label>
            <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 flex items-center justify-center">
              <img 
                src={currentLogo} 
                alt="Logo atual" 
                className="h-12 object-contain"
              />
            </div>
          </div>

          {/* Informações sobre proporção */}
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
            <p className="text-blue-400 text-sm font-medium mb-2">📐 Proporção Ideal</p>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>• Proporção recomendada: <strong>5:1</strong> (largura x altura)</li>
              <li>• Resolução sugerida: <strong>500x100px</strong> ou maior</li>
              <li>• Formato: PNG com fundo transparente</li>
              <li>• A logo será exibida com altura de <strong>32px</strong> (layout) e <strong>40px</strong> (home)</li>
            </ul>
          </div>

          {/* Upload */}
          <div className="space-y-3">
            <Label className="text-slate-300">Fazer Upload de Nova Logo</Label>
            <div className="flex gap-3">
              <Input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="bg-slate-800 border-slate-700 text-white flex-1"
              />
              <Button
                type="button"
                disabled={uploadingLogo}
                variant="outline"
                className="border-slate-700 text-slate-300"
              >
                {uploadingLogo ? (
                  "Enviando..."
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* URL Manual */}
          <div className="space-y-3">
            <Label className="text-slate-300">Ou Informe a URL da Logo</Label>
            <Input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://exemplo.com/logo.png"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {/* Preview */}
          {logoUrl && logoUrl !== currentLogo && (
            <div className="space-y-3">
              <Label className="text-slate-300">Preview da Nova Logo</Label>
              <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 flex items-center justify-center">
                <img 
                  src={logoUrl} 
                  alt="Preview da nova logo" 
                  className="h-12 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    setMessage({ type: "error", text: "URL da imagem inválida" });
                  }}
                />
              </div>
            </div>
          )}

          {/* Mensagem de feedback */}
          {message.text && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              message.type === "success" ? "bg-green-900/20 border border-green-700/50" :
              message.type === "error" ? "bg-red-900/20 border border-red-700/50" :
              "bg-blue-900/20 border border-blue-700/50"
            }`}>
              {message.type === "success" ? <Check className="w-4 h-4 text-green-400" /> : 
               message.type === "error" ? <AlertCircle className="w-4 h-4 text-red-400" /> :
               <AlertCircle className="w-4 h-4 text-blue-400" />}
              <p className={`text-sm ${
                message.type === "success" ? "text-green-400" :
                message.type === "error" ? "text-red-400" :
                "text-blue-400"
              }`}>
                {message.text}
              </p>
            </div>
          )}

          {/* Botão Salvar */}
          <Button
            onClick={handleSave}
            disabled={updateLogoMutation.isPending || !logoUrl || logoUrl === currentLogo}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {updateLogoMutation.isPending ? "Salvando..." : "Salvar Nova Logo"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}