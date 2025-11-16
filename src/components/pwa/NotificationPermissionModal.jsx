import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function NotificationPermissionModal({ onClose }) {
  const handleRequestPermission = async () => {
    localStorage.setItem('notification-permission-asked', 'true');
    
    if ('Notification' in window && 'serviceWorker' in navigator) {
      try {
        const permission = await Notification.requestPermission();
        console.log('📊 Permissão de notificação:', permission);
        
        if (permission === 'granted') {
          console.log('✅ Permissão concedida');
          
          // Salvar subscription do usuário
          try {
            const currentUser = await base44.auth.me();
            await base44.entities.PushSubscription.create({
              user_email: currentUser.email,
              subscription: { enabled: true },
              is_active: true
            });
            console.log('✅ Subscription salva no banco!');
          } catch (error) {
            console.log('⚠️ Erro ao salvar subscription:', error);
          }
          
          const registration = await navigator.serviceWorker.ready;
          console.log('✅ Service Worker pronto:', registration);
          
          await registration.showNotification('IA Coach Fitness', {
            body: '🎉 Perfeito! Agora você receberá lembretes de treino.',
            icon: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
            badge: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
            vibrate: [200, 100, 200],
            tag: 'welcome',
            requireInteraction: false
          });
          
          console.log('✅ Notificação de boas-vindas enviada');
        } else {
          console.log('❌ Permissão negada');
        }
        
        onClose();
      } catch (error) {
        console.error('❌ Erro ao solicitar permissão:', error);
        onClose();
      }
    } else {
      alert('Notificações não são suportadas neste navegador');
      onClose();
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notification-permission-asked', 'true');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-md"
        >
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-purple-600/50 shadow-2xl">
            <CardHeader className="relative pb-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="absolute top-2 right-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white">Ativar Notificações</CardTitle>
                  <p className="text-slate-400 text-sm">Receba lembretes de treino</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-slate-300 text-sm leading-relaxed">
                Ative as notificações para receber lembretes dos seus treinos, dicas motivacionais e acompanhar seu progresso!
              </p>

              <div className="bg-slate-950/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Lembretes de treino</span>
                </div>
                <div className="flex items-center gap-2 text-purple-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Dicas de motivação</span>
                </div>
                <div className="flex items-center gap-2 text-purple-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Atualizações de progresso</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  className="flex-1 border-slate-700 text-slate-300"
                >
                  Agora Não
                </Button>
                <Button
                  onClick={handleRequestPermission}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Ativar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}