import { useState, useEffect } from 'react';
import { X, Smartphone, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function AndroidAppBanner() {
  const [show, setShow] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Verificar se está rodando como PWA/WebView (app instalado)
    const isWebView = /wv/.test(navigator.userAgent.toLowerCase());
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    setIsPWA(isWebView || isStandalone);
    
    // Se for navegador Android (não app), mostrar banner
    if (!isWebView && !isStandalone) {
      const dismissed = localStorage.getItem('android-app-banner-dismissed');
      const dismissedTime = dismissed ? parseInt(dismissed) : 0;
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      // Mostrar novamente após 3 dias
      if (!dismissed || (now - dismissedTime) > (dayInMs * 3)) {
        setTimeout(() => setShow(true), 2000);
      }
    }
    
    console.log('🤖 Android App Banner:', isWebView ? 'APP' : 'NAVEGADOR');
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('android-app-banner-dismissed', Date.now().toString());
  };

  const handleDownload = () => {
    window.open('https://megavixsuplementos.com.br', '_blank');
    handleDismiss();
  };

  // Não mostrar se já estiver no app
  if (isPWA || !show) {
    return null;
  }

  return (
    <>
      {/* Banner Fixo no Topo */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-sm">Baixe nosso App Android</h3>
                <p className="text-green-100 text-xs truncate">Melhor experiência + Notificações</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={handleDownload}
                size="sm"
                className="bg-white text-green-600 hover:bg-green-50 font-bold h-9 px-4"
              >
                <Download className="w-4 h-4 mr-1" />
                Baixar
              </Button>
              <Button
                onClick={handleDismiss}
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20 h-9 w-9 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Espaçamento para não sobrepor conteúdo */}
      <div className="h-[72px]" />

      {/* Modal Promocional (aparece depois de 10 segundos) */}
      <AndroidAppModal onClose={handleDismiss} onDownload={handleDownload} />
    </>
  );
}

function AndroidAppModal({ onClose, onDownload }) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const modalDismissed = localStorage.getItem('android-app-modal-dismissed');
      if (!modalDismissed) {
        setShowModal(true);
      }
    }, 10000); // 10 segundos

    return () => clearTimeout(timer);
  }, []);

  const handleModalClose = () => {
    setShowModal(false);
    localStorage.setItem('android-app-modal-dismissed', 'true');
    onClose();
  };

  const handleModalDownload = () => {
    setShowModal(false);
    onDownload();
  };

  if (!showModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-green-600/50 max-w-md w-full shadow-2xl">
        <div className="p-6 text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <Smartphone className="w-10 h-10 text-white" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Experimente Nosso App! 🚀
            </h2>
            <p className="text-slate-300 text-sm">
              Baixe o aplicativo Android oficial e tenha acesso a:
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 space-y-2 text-left">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-400 text-xs">✓</span>
              </div>
              <p className="text-slate-300 text-sm">
                <strong className="text-white">Notificações Push</strong> instantâneas
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-400 text-xs">✓</span>
              </div>
              <p className="text-slate-300 text-sm">
                <strong className="text-white">Performance otimizada</strong> para Android
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-400 text-xs">✓</span>
              </div>
              <p className="text-slate-300 text-sm">
                <strong className="text-white">Acesso offline</strong> aos seus treinos
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              onClick={handleModalDownload}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold h-12 text-base"
            >
              <Download className="w-5 h-5 mr-2" />
              Baixar Aplicativo Agora
            </Button>
            <Button
              onClick={handleModalClose}
              variant="ghost"
              className="w-full text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Continuar no Navegador
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}