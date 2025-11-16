import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Smartphone, Monitor, Download, Share, MoreVertical, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallPWAModal() {
  const [showModal, setShowModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const hasSeenModal = localStorage.getItem('pwa-install-modal-seen');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    if (!hasSeenModal && !isStandalone) {
      setTimeout(() => setShowModal(true), 3000);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ PWA instalado');
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
      handleClose();
    }
  };

  const handleClose = () => {
    setShowModal(false);
    localStorage.setItem('pwa-install-modal-seen', 'true');
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);

  if (!showModal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-md"
        >
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-blue-600/50 shadow-2xl">
            <CardHeader className="relative pb-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="absolute top-2 right-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white">Instale o App</CardTitle>
                  <p className="text-slate-400 text-sm">Acesso rápido e offline</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-slate-950/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Acesso instantâneo na tela inicial</span>
                </div>
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Funciona offline</span>
                </div>
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Notificações de treino</span>
                </div>
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Modo tela cheia</span>
                </div>
              </div>

              {/* Android/Desktop - Instalação Automática */}
              {isInstallable && !isIOS && (
                <Button
                  onClick={handleInstall}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 h-12 font-bold"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Instalar Agora
                </Button>
              )}

              {/* iOS - Instruções Manuais */}
              {isIOS && (
                <div className="space-y-3">
                  <p className="text-slate-300 text-sm font-semibold">Para instalar no iOS:</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 text-slate-300 text-sm">
                      <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 font-bold text-xs">1</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Toque no botão</span>
                        <Share className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-slate-400">(compartilhar)</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-slate-300 text-sm">
                      <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 font-bold text-xs">2</span>
                      </div>
                      <span>Selecione "Adicionar à Tela Inicial"</span>
                    </div>
                    <div className="flex items-start gap-3 text-slate-300 text-sm">
                      <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 font-bold text-xs">3</span>
                      </div>
                      <span>Confirme tocando em "Adicionar"</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Android - Instruções Manuais (caso não mostre prompt) */}
              {!isInstallable && isAndroid && (
                <div className="space-y-3">
                  <p className="text-slate-300 text-sm font-semibold">Para instalar no Android:</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 text-slate-300 text-sm">
                      <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 font-bold text-xs">1</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Toque no menu</span>
                        <MoreVertical className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-slate-400">(3 pontos)</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-slate-300 text-sm">
                      <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 font-bold text-xs">2</span>
                      </div>
                      <span>Selecione "Instalar app" ou "Adicionar à tela inicial"</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Desktop */}
              {!isIOS && !isAndroid && !isInstallable && (
                <div className="space-y-3">
                  <p className="text-slate-300 text-sm font-semibold">Para instalar no Desktop:</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 text-slate-300 text-sm">
                      <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 font-bold text-xs">1</span>
                      </div>
                      <span>Clique no ícone de instalação na barra de endereços</span>
                    </div>
                    <div className="flex items-start gap-3 text-slate-300 text-sm">
                      <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 font-bold text-xs">2</span>
                      </div>
                      <span>Ou vá no menu do navegador → "Instalar IA Coach"</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1 border-slate-700 text-slate-300"
                >
                  Agora Não
                </Button>
                {!isInstallable && (
                  <Button
                    onClick={handleClose}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Entendi
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}