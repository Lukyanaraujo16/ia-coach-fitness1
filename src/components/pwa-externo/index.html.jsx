<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  
  <!-- SEO e Meta Tags -->
  <title>IA Coach Fitness - Seu Personal Trainer com IA</title>
  <meta name="description" content="Seu personal trainer com inteligência artificial. Treinos personalizados, nutrição e acompanhamento completo.">
  <meta name="theme-color" content="#1E40AF">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="IA Coach">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="google" content="notranslate">
  
  <!-- Manifest e Icons -->
  <link rel="manifest" href="/manifest.json">
  <link rel="icon" type="image/png" href="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904da724b4ce40db58404e7/ff4e4563c_LogoIA.png">
  <link rel="apple-touch-icon" href="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904da724b4ce40db58404e7/ff4e4563c_LogoIA.png">
  
  <!-- Splash Screens iOS -->
  <link rel="apple-touch-startup-image" href="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904da724b4ce40db58404e7/ff4e4563c_LogoIA.png">
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #0A0A0A;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    #app-frame {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }
    
    #loading {
      position: fixed;
      inset: 0;
      background: linear-gradient(to bottom, #0f172a, #0A0A0A);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      transition: opacity 0.3s ease;
    }
    
    #loading.hidden {
      opacity: 0;
      pointer-events: none;
    }
    
    #loading img {
      width: 120px;
      height: 120px;
      margin-bottom: 24px;
      animation: pulse 2s ease-in-out infinite;
    }
    
    #loading p {
      color: #94a3b8;
      font-size: 14px;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.8; }
    }
    
    /* Banner de instalação */
    #install-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to right, #1e40af, #3b82f6);
      padding: 16px;
      display: none;
      align-items: center;
      justify-content: space-between;
      z-index: 10000;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
    }
    
    #install-banner.show {
      display: flex;
    }
    
    #install-banner .content {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    #install-banner img {
      width: 48px;
      height: 48px;
      border-radius: 12px;
    }
    
    #install-banner .text h3 {
      color: white;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 2px;
    }
    
    #install-banner .text p {
      color: rgba(255,255,255,0.8);
      font-size: 12px;
    }
    
    #install-banner button {
      background: white;
      color: #1e40af;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
    }
    
    #install-banner .close {
      background: transparent;
      color: white;
      padding: 8px;
      margin-left: 8px;
    }
  </style>
</head>
<body>
  <!-- Tela de Loading -->
  <div id="loading">
    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904da724b4ce40db58404e7/ff4e4563c_LogoIA.png" alt="IA Coach Fitness">
    <p>Carregando...</p>
  </div>

  <!-- Banner de Instalação -->
  <div id="install-banner">
    <div class="content">
      <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904da724b4ce40db58404e7/ff4e4563c_LogoIA.png" alt="IA Coach">
      <div class="text">
        <h3>Instalar IA Coach Fitness</h3>
        <p>Adicione à tela inicial para acesso rápido</p>
      </div>
    </div>
    <div>
      <button id="install-btn">Instalar</button>
      <button class="close" id="close-banner">✕</button>
    </div>
  </div>

  <!-- Iframe do App Base44 -->
  <!-- IMPORTANTE: Substitua a URL abaixo pela URL do seu app Base44 -->
  <iframe 
    id="app-frame" 
    src="https://iacoachfitness.com.br"
    allow="camera; microphone; geolocation; notifications; fullscreen"
    loading="eager"
  ></iframe>

  <script>
    // ============================================
    // CONFIGURAÇÃO
    // ============================================
    
    // Chave pública VAPID para Push Notifications
    // IMPORTANTE: Substitua pela sua chave VAPID pública
    const VAPID_PUBLIC_KEY = 'SUA_CHAVE_VAPID_PUBLICA_AQUI';
    
    // URL do endpoint para registrar subscription
    // IMPORTANTE: Substitua pela URL da sua função no Base44
    const SUBSCRIPTION_ENDPOINT = 'https://iacoachfitness.com.br/api/functions/registerPushSubscription';
    
    // ============================================
    // SERVICE WORKER
    // ============================================
    
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/service-worker.js', {
            scope: '/'
          });
          console.log('[PWA] Service Worker registrado:', registration.scope);
          
          // Verificar atualizações
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] Nova versão disponível');
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          });
          
          // Configurar Push Notifications se permitido
          if (Notification.permission === 'granted') {
            await subscribeToPush(registration);
          }
        } catch (error) {
          console.error('[PWA] Erro ao registrar Service Worker:', error);
        }
      });
    }
    
    // ============================================
    // PUSH NOTIFICATIONS
    // ============================================
    
    async function subscribeToPush(registration) {
      try {
        // Verificar se já tem subscription
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          // Criar nova subscription
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          });
          console.log('[PWA] Nova subscription criada');
        }
        
        // Enviar subscription para o servidor
        // A página dentro do iframe vai lidar com isso quando o usuário estiver logado
        console.log('[PWA] Subscription:', JSON.stringify(subscription));
        
        // Armazenar subscription para uso posterior
        localStorage.setItem('push-subscription', JSON.stringify(subscription));
        
      } catch (error) {
        console.error('[PWA] Erro ao subscrever push:', error);
      }
    }
    
    function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }
    
    // ============================================
    // SOLICITAR PERMISSÃO DE NOTIFICAÇÃO
    // ============================================
    
    async function requestNotificationPermission() {
      if (!('Notification' in window)) {
        console.log('[PWA] Notificações não suportadas');
        return false;
      }
      
      if (Notification.permission === 'granted') {
        return true;
      }
      
      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const registration = await navigator.serviceWorker.ready;
          await subscribeToPush(registration);
          return true;
        }
      }
      
      return false;
    }
    
    // ============================================
    // INSTALAÇÃO DO PWA
    // ============================================
    
    let deferredPrompt = null;
    const installBanner = document.getElementById('install-banner');
    const installBtn = document.getElementById('install-btn');
    const closeBanner = document.getElementById('close-banner');
    
    // Capturar evento de instalação
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Mostrar banner se não foi dispensado recentemente
      const dismissed = localStorage.getItem('install-banner-dismissed');
      if (!dismissed || Date.now() - parseInt(dismissed) > 7 * 24 * 60 * 60 * 1000) {
        installBanner.classList.add('show');
      }
    });
    
    // Botão de instalar
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log('[PWA] Instalação:', outcome);
      deferredPrompt = null;
      installBanner.classList.remove('show');
      
      if (outcome === 'accepted') {
        // Solicitar permissão de notificação após instalação
        setTimeout(() => {
          requestNotificationPermission();
        }, 2000);
      }
    });
    
    // Fechar banner
    closeBanner.addEventListener('click', () => {
      installBanner.classList.remove('show');
      localStorage.setItem('install-banner-dismissed', Date.now().toString());
    });
    
    // Detectar se já está instalado
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App instalado!');
      installBanner.classList.remove('show');
      deferredPrompt = null;
    });
    
    // ============================================
    // IFRAME LOADING
    // ============================================
    
    const iframe = document.getElementById('app-frame');
    const loading = document.getElementById('loading');
    
    iframe.addEventListener('load', () => {
      setTimeout(() => {
        loading.classList.add('hidden');
      }, 500);
    });
    
    // Timeout para esconder loading mesmo se iframe demorar
    setTimeout(() => {
      loading.classList.add('hidden');
    }, 5000);
    
    // ============================================
    // COMUNICAÇÃO COM IFRAME
    // ============================================
    
    window.addEventListener('message', async (event) => {
      // Verificar origem
      if (!event.origin.includes('iacoachfitness.com.br') && !event.origin.includes('base44.app')) {
        return;
      }
      
      const { type, data } = event.data || {};
      
      switch (type) {
        case 'REQUEST_NOTIFICATION_PERMISSION':
          const granted = await requestNotificationPermission();
          iframe.contentWindow.postMessage({
            type: 'NOTIFICATION_PERMISSION_RESULT',
            granted
          }, '*');
          break;
          
        case 'GET_PUSH_SUBSCRIPTION':
          const subscription = localStorage.getItem('push-subscription');
          iframe.contentWindow.postMessage({
            type: 'PUSH_SUBSCRIPTION',
            subscription: subscription ? JSON.parse(subscription) : null
          }, '*');
          break;
          
        case 'REGISTER_PUSH_SUBSCRIPTION':
          // Receber dados do usuário e registrar subscription
          if (data && data.userEmail) {
            const sub = localStorage.getItem('push-subscription');
            if (sub) {
              try {
                await fetch(SUBSCRIPTION_ENDPOINT, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    user_email: data.userEmail,
                    subscription: JSON.parse(sub)
                  })
                });
                console.log('[PWA] Subscription registrada para:', data.userEmail);
              } catch (e) {
                console.error('[PWA] Erro ao registrar subscription:', e);
              }
            }
          }
          break;
      }
    });
    
    // Repassar mensagens do Service Worker para o iframe
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        iframe.contentWindow.postMessage(event.data, '*');
      }
    });
  </script>
</body>
</html>