import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

export default function CreatePostForm({ onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    content: '',
    achievement_type: 'other',
  });

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
          <CardTitle className="text-white">Novo Post</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
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

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? 'Publicando...' : 'Publicar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}