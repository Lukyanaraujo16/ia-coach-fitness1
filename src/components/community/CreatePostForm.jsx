
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { X, Upload, Crown } from "lucide-react";

export default function CreatePostForm({ post, onSubmit, onCancel, isLoading, isPremium }) {
  const [formData, setFormData] = useState({
    content: '',
    achievement_type: 'other',
    image_url: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (post) {
      setFormData({
        content: post.content || '',
        achievement_type: post.achievement_type || 'other',
        image_url: post.image_url || '',
      });
    }
  }, [post]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, image_url: file_url });
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">{post ? 'Editar Post' : 'Novo Post'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} className="text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content" className="text-slate-300">Compartilhe sua conquista</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white min-h-[120px]"
                placeholder="Conte sobre seu progresso, como está se sentindo, suas conquistas..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="achievement" className="text-slate-300">Tipo de Conquista</Label>
              <Select
                value={formData.achievement_type}
                onValueChange={(value) => setFormData({ ...formData, achievement_type: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workout_completed">Treino Completado</SelectItem>
                  <SelectItem value="weight_goal">Meta de Peso</SelectItem>
                  <SelectItem value="personal_record">Recorde Pessoal</SelectItem>
                  <SelectItem value="streak">Sequência de Treinos</SelectItem>
                  <SelectItem value="transformation">Transformação</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Image Upload - Premium Only */}
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                Adicionar Foto
                {!isPremium && (
                  <span className="flex items-center gap-1 text-yellow-400 text-xs">
                    <Crown className="w-3 h-3" />
                    Premium
                  </span>
                )}
              </Label>
              
              {isPremium ? (
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  {uploadingImage && <p className="text-slate-400 text-sm">Enviando...</p>}
                  {formData.image_url && (
                    <div className="relative">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setFormData({ ...formData, image_url: '' })}
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-center">
                  <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">
                    Assine Premium para adicionar fotos aos seus posts
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || uploadingImage}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? 'Publicando...' : post ? 'Atualizar' : 'Publicar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
