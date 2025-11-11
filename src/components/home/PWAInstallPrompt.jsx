import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Download, Share, Plus, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PWAInstallPrompt({ onClose, onInstalled }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Verificar se já está instalado
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator.standalone ||
                      document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // Listener para Android PWA
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA instalado com sucesso');
        onInstalled();
      }
      
      setDeferredPrompt(null);
    }
  };

  const handleClose = () => {
    onClose();
  };

  // Se já está instalado, não mostrar
  if (isStandalone) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-md"
        >
          <Card className="bg-slate-900 border-slate-800 shadow-2xl">
            <CardHeader className="relative pb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="absolute top-4 right-4 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center">
                  <Download className="w-7 h-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">
                    Instalar FitTrack+
                  </CardTitle>
                  <p className="text-slate-400 text-sm mt-1">
                    Acesse mais rápido e offline
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {isIOS ? (
                // Instruções para iOS
                <div className="space-y-4">
                  <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4">
                    <p className="text-blue-400 text-sm font-medium mb-3">
                      📱 Instruções para iOS:
                    </p>
                    <ol className="space-y-3 text-slate-300 text-sm">
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                          1
                        </div>
                        <div>
                          Toque no botão <Share className="w-4 h-4 inline mx-1 text-blue-400" /> 
                          <span className="font-semibold">"Compartilhar"</span> na barra inferior do Safari
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                          2
                        </div>
                        <div>
                          Role para baixo e toque em <Plus className="w-4 h-4 inline mx-1 text-blue-400" /> 
                          <span className="font-semibold">"Adicionar à Tela de Início"</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                          3
                        </div>
                        <div>
                          Toque em <span className="font-semibold">"Adicionar"</span> no canto superior direito
                        </div>
                      </li>
                    </ol>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-slate-400 text-xs mb-3">
                      Após instalado, você terá acesso rápido ao app direto da tela inicial! 🚀
                    </p>
                    <Button
                      onClick={handleClose}
                      variant="outline"
                      className="border-slate-600 bg-slate-800 text-white hover:bg-slate-700 hover:border-slate-500 w-full"
                    >
                      Entendi
                    </Button>
                  </div>
                </div>
              ) : deferredPrompt ? (
                // Instalação Android PWA
                <div className="space-y-4">
                  <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4 text-center">
                    <Home className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-slate-300 text-sm mb-2">
                      Instale o FitTrack+ na tela inicial para acesso rápido e funcionalidade offline
                    </p>
                    <p className="text-green-400 text-xs">
                      ✓ Acesso instantâneo<br />
                      ✓ Funciona offline<br />
                      ✓ Notificações push
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={handleClose}
                      variant="outline"
                      className="flex-1 border-slate-600 bg-slate-800 text-white hover:bg-slate-700 hover:border-slate-500"
                    >
                      Agora Não
                    </Button>
                    <Button
                      onClick={handleInstallClick}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Instalar
                    </Button>
                  </div>
                </div>
              ) : (
                // Android sem suporte PWA ou já instalado
                <div className="text-center space-y-4">
                  <div className="bg-slate-800/50 rounded-xl p-6">
                    <Home className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-300 text-sm">
                      Para adicionar à tela inicial, use as opções do seu navegador
                    </p>
                    <p className="text-slate-500 text-xs mt-2">
                      (Menu → Adicionar à tela inicial)
                    </p>
                  </div>
                  <Button
                    onClick={handleClose}
                    variant="outline"
                    className="w-full border-slate-600 bg-slate-800 text-white hover:bg-slate-700 hover:border-slate-500"
                  >
                    Fechar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}