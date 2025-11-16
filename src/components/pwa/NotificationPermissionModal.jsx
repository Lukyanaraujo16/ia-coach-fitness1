import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function NotificationPermissionModal({ onClose }) {
  const handleActivate = async () => {
    console.log('🔔 Solicitando permissão de notificação...');
    
    try {
      const permission = await Notification.requestPermission();
      console.log('✅ Permissão:', permission);
      
      if (permission === 'granted') {
        console.log('💾 Salvando subscription no banco...');
        
        // Salvar no banco de dados
        try {
          const currentUser = await base44.auth.me();
          
          // Verificar se já existe subscription
          const existingSubscriptions = await base44.entities.PushSubscription.list();
          const userSubscription = existingSubscriptions.find(s => s.user_email === currentUser.email);
          
          if (!userSubscription) {
            await base44.entities.PushSubscription.create({
              user_email: currentUser.email,
              subscription: { enabled: true },
              is_active: true
            });
            console.log('✅ Subscription salva no banco!');
          } else {
            console.log('✅ Subscription já existe no banco');
          }
        } catch (error) {
          console.error('❌ Erro ao salvar subscription:', error);
        }
        
        // Enviar notificação de boas-vindas
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification('🎉 Notificações Ativadas!', {
            body: 'Você receberá lembretes de treino e motivação diária.',
            icon: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
            badge: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
            vibrate: [200, 100, 200],
            tag: 'welcome'
          });
        } else {
          new Notification('🎉 Notificações Ativadas!', {
            body: 'Você receberá lembretes de treino e motivação diária.',
            icon: 'https://base44.app/api/apps/6904da724b4ce40db58404e7/files/public/6904da724b4ce40db58404e7/901d97ae0_Untitleddesign3.png',
            vibrate: [200, 100, 200]
          });
        }
      }
      
      localStorage.setItem('notification-permission-asked', 'true');
      onClose();
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão:', error);
      localStorage.setItem('notification-permission-asked', 'true');
      onClose();
    }
  };

  const handleLater = () => {
    console.log('⏭️ Usuário optou por decidir depois');
    localStorage.setItem('notification-permission-asked', 'true');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md"
        >
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 p-6 relative">
            <button
              onClick={handleLater}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center">
                <Bell className="w-8 h-8 text-blue-400" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Ativar Notificações Push?
                </h3>
                <p className="text-slate-300 text-sm">
                  Receba lembretes de treino e motivação para manter sua rotina em dia.
                </p>
              </div>

              <div className="w-full space-y-2 text-left bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="text-blue-400">✓</span>
                  <span>Lembretes de treino</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="text-blue-400">✓</span>
                  <span>Dicas de nutrição</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="text-blue-400">✓</span>
                  <span>Mensagens motivacionais</span>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={handleLater}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Agora Não
                </Button>
                <Button
                  onClick={handleActivate}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Ativar
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}