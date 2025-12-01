import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Bell, Clock, Zap, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

const FASTING_TYPES = [
  { id: "14/10", label: "14:10 (14h jejum / 10h alimentação)" },
  { id: "16/8", label: "16:8 (16h jejum / 8h alimentação)" },
  { id: "18/6", label: "18:6 (18h jejum / 6h alimentação)" },
  { id: "20/4", label: "20:4 (20h jejum / 4h alimentação)" },
  { id: "24h", label: "24h (OMAD)" },
  { id: "custom", label: "Personalizado" },
];

export default function FastingSettingsComponent({ settings, onSave, isSaving }) {
  const [localSettings, setLocalSettings] = useState({
    preferred_fasting_type: settings?.preferred_fasting_type || "16/8",
    custom_fasting_hours: settings?.custom_fasting_hours || 16,
    custom_eating_hours: settings?.custom_eating_hours || 8,
    auto_start_enabled: settings?.auto_start_enabled || false,
    auto_start_time: settings?.auto_start_time || "20:00",
    reminder_start_enabled: settings?.reminder_start_enabled ?? true,
    reminder_end_enabled: settings?.reminder_end_enabled ?? true,
  });

  const handleSave = () => {
    if (localSettings.preferred_fasting_type === "custom") {
      const total = localSettings.custom_fasting_hours + localSettings.custom_eating_hours;
      if (total !== 24) {
        toast.error("A soma das horas de jejum e alimentação deve ser 24h");
        return;
      }
    }
    onSave(localSettings);
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-green-400" />
          Configurações de Jejum
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tipo de Jejum Padrão */}
        <div className="space-y-2">
          <Label className="text-slate-300">Tipo de Jejum Padrão</Label>
          <Select
            value={localSettings.preferred_fasting_type}
            onValueChange={(value) => setLocalSettings({ ...localSettings, preferred_fasting_type: value })}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FASTING_TYPES.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Horas Personalizadas */}
        {localSettings.preferred_fasting_type === "custom" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Horas de Jejum</Label>
              <Input
                type="number"
                min="1"
                max="23"
                value={localSettings.custom_fasting_hours}
                onChange={(e) => setLocalSettings({ ...localSettings, custom_fasting_hours: Number(e.target.value) })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-300">Horas de Alimentação</Label>
              <Input
                type="number"
                min="1"
                max="23"
                value={localSettings.custom_eating_hours}
                onChange={(e) => setLocalSettings({ ...localSettings, custom_eating_hours: Number(e.target.value) })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
          </div>
        )}

        {/* Auto Start */}
        <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-white font-medium">Modo Automático</p>
                <p className="text-slate-400 text-sm">Iniciar jejum automaticamente</p>
              </div>
            </div>
            <Switch
              checked={localSettings.auto_start_enabled}
              onCheckedChange={(checked) => setLocalSettings({ ...localSettings, auto_start_enabled: checked })}
            />
          </div>

          {localSettings.auto_start_enabled && (
            <div>
              <Label className="text-slate-300">Horário de Início Automático</Label>
              <Input
                type="time"
                value={localSettings.auto_start_time}
                onChange={(e) => setLocalSettings({ ...localSettings, auto_start_time: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-blue-400" />
            <p className="text-white font-medium">Notificações</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300">Lembrete para iniciar</p>
              <p className="text-slate-500 text-xs">Receba um lembrete no horário configurado</p>
            </div>
            <Switch
              checked={localSettings.reminder_start_enabled}
              onCheckedChange={(checked) => setLocalSettings({ ...localSettings, reminder_start_enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300">Aviso de término</p>
              <p className="text-slate-500 text-xs">Receba um aviso quando o jejum terminar</p>
            </div>
            <Switch
              checked={localSettings.reminder_end_enabled}
              onCheckedChange={(checked) => setLocalSettings({ ...localSettings, reminder_end_enabled: checked })}
            />
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}