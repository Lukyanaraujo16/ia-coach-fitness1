import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Send } from "lucide-react";
import notificationManager from "../pwa/NotificationManager";

export default function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendNotification = async () => {
    if (!title || !body) {
      alert('Preencha título e mensagem');
      return;
    }

    setSending(true);

    // Enviar notificação local para teste
    notificationManager.showNotification(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      vibrate: [200, 100, 200],
    });

    // Aqui você integraria com o backend para enviar push notifications
    // para todos os usuários inscritos
    
    setTimeout(() => {
      setSending(false);
      setTitle("");
      setBody("");
      alert('Notificação enviada com sucesso! (teste local)');
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Enviar Notificação Push
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Título *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Hora do treino! 💪"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Mensagem *</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Ex: Não perca seu treino de hoje! Vamos nessa 🔥"
              className="bg-slate-800 border-slate-700 text-white h-24"
            />
          </div>

          <Button
            onClick={handleSendNotification}
            disabled={sending || !title || !body}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-2" />
            {sending ? 'Enviando...' : 'Enviar Notificação'}
          </Button>

          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
            <p className="text-yellow-400 text-sm">
              ⚠️ <strong>Nota:</strong> Esta é uma notificação de teste local. 
              Para enviar notificações push reais para todos os usuários, é necessário 
              integração com um serviço de push (Firebase Cloud Messaging, OneSignal, etc).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {(title || body) && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">Preview da Notificação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-xl">💪</span>
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">{title || 'Título'}</p>
                  <p className="text-slate-400 text-sm">{body || 'Mensagem'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}