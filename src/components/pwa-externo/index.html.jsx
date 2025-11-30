<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  
  <!-- SEO e Meta Tags -->
  <title>IA Coach Fitness - Instalar App</title>
  <meta name="description" content="Instale o IA Coach Fitness no seu celular. Seu personal trainer com inteligência artificial.">
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
      min-height: 100vh;
      background: linear-gradient(to bottom, #0f172a, #0A0A0A);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: white;
    }
    
    .container {
      max-width: 480px;
      margin: 0 auto;
      padding: 20px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    /* Header */
    .header {
      text-align: center;
      padding: 40px 0 30px;
    }
    
    .logo {
      width: 100px;
      height: 100px;
      border-radius: 24px;
      box-shadow: 0 20px 40px rgba(30, 64, 175, 0.3);
      margin-bottom: 24px;
    }
    
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      background: linear-gradient(to right, #60a5fa, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .header p {
      color: #94a3b8;
      font-size: 16px;
    }
    
    /* Stats */
    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin: 24px 0;
    }
    
    .stat {
      background: rgba(30, 64, 175, 0.1);
      border: 1px solid rgba(30, 64, 175, 0.3);
      border-radius: 16px;
      padding: 16px 8px;
      text-align: center;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #60a5fa;
    }
    
    .stat-label {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 4px;
    }
    
    /* Install Section */
    .install-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .install-card {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid #334155;
      border-radius: 24px;
      padding: 24px;
      margin-bottom: 20px;
    }
    
    .install-card h2 {
      font-size: 20px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .install-card h2 .icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    
    .android-icon {
      background: rgba(52, 211, 153, 0.2);
    }
    
    .ios-icon {
      background: rgba(99, 102, 241, 0.2);
    }
    
    .steps {
      list-style: none;
    }
    
    .step {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px 0;
      border-bottom: 1px solid #1e293b;
    }
    
    .step:last-child {
      border-bottom: none;
    }
    
    .step-number {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      flex-shrink: 0;
    }
    
    .step-content h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .step-content p {
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.5;
    }
    
    .step-content .highlight {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(59, 130, 246, 0.2);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 13px;
      color: #60a5fa;
      margin-top: 8px;
    }
    
    /* Install Button (Android) */
    .install-btn {
      width: 100%;
      padding: 18px 24px;
      font-size: 18px;
      font-weight: 600;
      color: white;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border: none;
      border-radius: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
      transition: all 0.3s ease;
      margin-top: 20px;
    }
    
    .install-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 40px rgba(59, 130, 246, 0.5);
    }
    
    .install-btn:active {
      transform: translateY(0);
    }
    
    .install-btn.hidden {
      display: none;
    }
    
    /* Access Button */
    .access-btn {
      width: 100%;
      padding: 18px 24px;
      font-size: 18px;
      font-weight: 600;
      color: white;
      background: #1e293b;
      border: 2px solid #334155;
      border-radius: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      transition: all 0.3s ease;
      text-decoration: none;
      margin-top: 12px;
    }
    
    .access-btn:hover {
      background: #334155;
      border-color: #475569;
    }
    
    /* Features */
    .features {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-top: 24px;
    }
    
    .feature {
      background: rgba(30, 64, 175, 0.1);
      border: 1px solid rgba(30, 64, 175, 0.2);
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }
    
    .feature-icon {
      font-size: 28px;
      margin-bottom: 8px;
    }
    
    .feature-text {
      font-size: 13px;
      color: #cbd5e1;
    }
    
    /* Footer */
    .footer {
      text-align: center;
      padding: 24px 0;
      color: #64748b;
      font-size: 13px;
    }
    
    .footer a {
      color: #60a5fa;
      text-decoration: none;
    }
    
    /* Installed State */
    .installed-message {
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 16px;
      padding: 20px;
      text-align: center;
      margin-bottom: 20px;
    }
    
    .installed-message h3 {
      color: #22c55e;
      font-size: 18px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .installed-message p {
      color: #94a3b8;
      font-size: 14px;
    }
    
    /* Hide sections based on platform */
    .android-only { display: none; }
    .ios-only { display: none; }
    .installed-only { display: none; }
    
    body.is-android .android-only { display: block; }
    body.is-ios .ios-only { display: block; }
    body.is-installed .installed-only { display: block; }
    body.is-installed .android-only,
    body.is-installed .ios-only { display: none; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <img 
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904da724b4ce40db58404e7/ff4e4563c_LogoIA.png" 
        alt="IA Coach Fitness" 
        class="logo"
      >
      <h1>IA Coach Fitness</h1>
      <p>Seu Personal Trainer com IA</p>
    </div>
    
    <!-- Stats -->
    <div class="stats">
      <div class="stat">
        <div class="stat-value">10K+</div>
        <div class="stat-label">Usuários</div>
      </div>
      <div class="stat">
        <div class="stat-value">4.9</div>
        <div class="stat-label">Avaliação ⭐</div>
      </div>
      <div class="stat">
        <div class="stat-value">98%</div>
        <div class="stat-label">Satisfação</div>
      </div>
    </div>
    
    <!-- Install Section -->
    <div class="install-section">
      
      <!-- Installed Message -->
      <div class="installed-only">
        <div class="installed-message">
          <h3>✅ App Instalado!</h3>
          <p>O IA Coach Fitness já está na sua tela inicial.</p>
        </div>
        <a href="https://iacoachfitness.com.br" class="access-btn">
          🚀 Abrir IA Coach Fitness
        </a>
      </div>
      
      <!-- Android Instructions -->
      <div class="android-only">
        <div class="install-card">
          <h2>
            <span class="icon android-icon">🤖</span>
            Instalar no Android
          </h2>
          <p style="color: #94a3b8; margin-bottom: 16px; font-size: 14px;">
            Clique no botão abaixo para instalar o app diretamente:
          </p>
          <button class="install-btn" id="install-btn">
            📲 Instalar App
          </button>
          
          <div id="manual-android" style="display: none; margin-top: 20px;">
            <p style="color: #f59e0b; font-size: 14px; margin-bottom: 16px;">
              Se o botão não funcionar, siga os passos:
            </p>
            <ol class="steps">
              <li class="step">
                <span class="step-number">1</span>
                <div class="step-content">
                  <h3>Toque no menu ⋮</h3>
                  <p>No canto superior direito do Chrome</p>
                </div>
              </li>
              <li class="step">
                <span class="step-number">2</span>
                <div class="step-content">
                  <h3>Selecione "Instalar app"</h3>
                  <p>Ou "Adicionar à tela inicial"</p>
                </div>
              </li>
              <li class="step">
                <span class="step-number">3</span>
                <div class="step-content">
                  <h3>Confirme a instalação</h3>
                  <p>Toque em "Instalar" no popup</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
      
      <!-- iOS Instructions -->
      <div class="ios-only">
        <div class="install-card">
          <h2>
            <span class="icon ios-icon">🍎</span>
            Instalar no iPhone/iPad
          </h2>
          <ol class="steps">
            <li class="step">
              <span class="step-number">1</span>
              <div class="step-content">
                <h3>Toque no botão Compartilhar</h3>
                <p>O ícone <span class="highlight">⬆️ Compartilhar</span> na barra inferior do Safari</p>
              </div>
            </li>
            <li class="step">
              <span class="step-number">2</span>
              <div class="step-content">
                <h3>Role para baixo e toque em</h3>
                <p><span class="highlight">➕ Adicionar à Tela de Início</span></p>
              </div>
            </li>
            <li class="step">
              <span class="step-number">3</span>
              <div class="step-content">
                <h3>Confirme tocando em "Adicionar"</h3>
                <p>O app aparecerá na sua tela inicial</p>
              </div>
            </li>
          </ol>
        </div>
        
        <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <p style="color: #fbbf24; font-size: 14px; display: flex; align-items: flex-start; gap: 8px;">
            <span>⚠️</span>
            <span><strong>Importante:</strong> Use o Safari para instalar. Outros navegadores não suportam PWA no iOS.</span>
          </p>
        </div>
      </div>
      
      <!-- Access Button (always visible when not installed) -->
      <a href="https://iacoachfitness.com.br" class="access-btn" id="access-btn">
        🌐 Acessar pelo Navegador
      </a>
      
      <!-- Features -->
      <div class="features">
        <div class="feature">
          <div class="feature-icon">🏋️</div>
          <div class="feature-text">Treinos Personalizados</div>
        </div>
        <div class="feature">
          <div class="feature-icon">🍎</div>
          <div class="feature-text">Nutrição com IA</div>
        </div>
        <div class="feature">
          <div class="feature-icon">📊</div>
          <div class="feature-text">Acompanhamento</div>
        </div>
        <div class="feature">
          <div class="feature-icon">🔔</div>
          <div class="feature-text">Notificações</div>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>© 2025 IA Coach Fitness</p>
      <p style="margin-top: 8px;">
        <a href="https://iacoachfitness.com.br">iacoachfitness.com.br</a>
      </p>
    </div>
    
    <!-- Modal de Notificações -->
    <div id="notification-modal" class="modal hidden">
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <div class="modal-icon">🔔</div>
        <h3>Ativar Notificações</h3>
        <p>Receba lembretes de treino e dicas do seu coach IA, mesmo com o app fechado!</p>
        <div class="modal-buttons">
          <button class="modal-btn secondary" id="notification-later">Depois</button>
          <button class="modal-btn primary" id="notification-allow">Permitir</button>
        </div>
      </div>
    </div>
  </div>
  
  <style>
    .modal {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal.hidden { display: none; }
    .modal-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(4px);
    }
    .modal-content {
      position: relative;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 24px;
      padding: 32px;
      max-width: 360px;
      text-align: center;
    }
    .modal-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .modal-content h3 {
      font-size: 22px;
      margin-bottom: 12px;
    }
    .modal-content p {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .modal-buttons {
      display: flex;
      gap: 12px;
    }
    .modal-btn {
      flex: 1;
      padding: 14px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .modal-btn.primary {
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: white;
    }
    .modal-btn.primary:hover {
      transform: scale(1.02);
    }
    .modal-btn.secondary {
      background: #334155;
      color: #94a3b8;
    }
  </style>

  <script>
    // ============================================
    // DETECÇÃO DE PLATAFORMA
    // ============================================
    
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    
    // Aplicar classes no body
    if (isStandalone) {
      document.body.classList.add('is-installed');
      // Se já está instalado, redirecionar para o app
      setTimeout(() => {
        window.location.href = 'https://iacoachfitness.com.br';
      }, 1500);
    } else if (isIOS) {
      document.body.classList.add('is-ios');
    } else if (isAndroid) {
      document.body.classList.add('is-android');
    } else {
      // Desktop ou outro - mostrar instruções Android como padrão
      document.body.classList.add('is-android');
    }
    
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
        } catch (error) {
          console.error('[PWA] Erro ao registrar Service Worker:', error);
        }
      });
    }
    
    // ============================================
    // INSTALAÇÃO DO PWA (Android)
    // ============================================
    
    let deferredPrompt = null;
    const installBtn = document.getElementById('install-btn');
    const manualAndroid = document.getElementById('manual-android');
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      console.log('[PWA] Prompt de instalação capturado');
      
      // Mostrar botão de instalação
      if (installBtn) {
        installBtn.style.display = 'flex';
      }
    });
    
    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log('[PWA] Resultado da instalação:', outcome);
          
          if (outcome === 'accepted') {
            // Usuário aceitou - redirecionar após instalação
            setTimeout(() => {
              window.location.href = 'https://iacoachfitness.com.br';
            }, 1000);
          }
          
          deferredPrompt = null;
        } else {
          // Mostrar instruções manuais
          if (manualAndroid) {
            manualAndroid.style.display = 'block';
          }
        }
      });
      
      // Se não tiver prompt após 3 segundos, mostrar instruções manuais
      setTimeout(() => {
        if (!deferredPrompt && isAndroid && manualAndroid) {
          manualAndroid.style.display = 'block';
          installBtn.textContent = '📲 Siga os passos abaixo';
          installBtn.style.background = '#334155';
          installBtn.style.boxShadow = 'none';
        }
      }, 3000);
    }
    
    // Detectar quando o app foi instalado
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App instalado com sucesso!');
      deferredPrompt = null;
      
      // Redirecionar para o app
      setTimeout(() => {
        window.location.href = 'https://iacoachfitness.com.br';
      }, 1000);
    });
    
    // ============================================
    // PUSH NOTIFICATIONS
    // ============================================
    
    const VAPID_PUBLIC_KEY = 'BNJg8Uw8qpWl9GvHLheJP0VKEXe7yWU0XHlS9-xdmQPf8WHmvKELB1j7JYEIbWr4xKDKIqOPYL1KZ9-8_cFV6Yw';
    
    function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }
    
    const notificationModal = document.getElementById('notification-modal');
    const notificationAllow = document.getElementById('notification-allow');
    const notificationLater = document.getElementById('notification-later');
    
    // Mostrar modal de notificação se estiver no PWA e não tiver permissão
    async function checkNotificationPermission() {
      if (!('Notification' in window) || !('PushManager' in window)) {
        console.log('[Push] Não suportado neste navegador');
        return;
      }
      
      const hasAsked = localStorage.getItem('notification-permission-asked');
      
      if (isStandalone && Notification.permission === 'default' && !hasAsked) {
        // Esperar um pouco antes de mostrar o modal
        setTimeout(() => {
          notificationModal.classList.remove('hidden');
        }, 2000);
      } else if (Notification.permission === 'granted') {
        // Já tem permissão, registrar subscription
        await registerPushSubscription();
      }
    }
    
    async function registerPushSubscription() {
      try {
        const registration = await navigator.serviceWorker.ready;
        console.log('[Push] Service Worker ready');
        
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          console.log('[Push] Criando subscription...');
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          });
          console.log('[Push] Subscription criada!');
        }
        
        // Salvar subscription no localStorage para enviar ao app principal
        localStorage.setItem('push-subscription', JSON.stringify(subscription.toJSON()));
        console.log('[Push] Subscription salva localmente');
        
        // Enviar para o app principal via postMessage quando ele carregar
        window.pushSubscription = subscription.toJSON();
        
        return subscription;
      } catch (error) {
        console.error('[Push] Erro ao registrar:', error);
      }
    }
    
    if (notificationAllow) {
      notificationAllow.addEventListener('click', async () => {
        localStorage.setItem('notification-permission-asked', 'true');
        notificationModal.classList.add('hidden');
        
        try {
          const permission = await Notification.requestPermission();
          console.log('[Push] Permissão:', permission);
          
          if (permission === 'granted') {
            await registerPushSubscription();
            
            // Mostrar notificação de teste
            const registration = await navigator.serviceWorker.ready;
            registration.showNotification('🎉 Notificações Ativadas!', {
              body: 'Você receberá lembretes de treino e dicas do coach.',
              icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904da724b4ce40db58404e7/ff4e4563c_LogoIA.png',
              badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6904da724b4ce40db58404e7/ff4e4563c_LogoIA.png',
              vibrate: [200, 100, 200]
            });
          }
        } catch (error) {
          console.error('[Push] Erro:', error);
        }
      });
    }
    
    if (notificationLater) {
      notificationLater.addEventListener('click', () => {
        localStorage.setItem('notification-permission-asked', 'true');
        notificationModal.classList.add('hidden');
      });
    }
    
    // Verificar permissão após Service Worker registrar
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        checkNotificationPermission();
      });
    }
    
    // Comunicação com o app principal (iframe ou redirecionamento)
    window.addEventListener('message', async (event) => {
      // Apenas aceitar mensagens do app principal
      if (!event.origin.includes('iacoachfitness.com.br') && !event.origin.includes('base44.app')) {
        return;
      }
      
      console.log('[PWA] Mensagem recebida:', event.data);
      
      if (event.data.type === 'GET_PUSH_SUBSCRIPTION') {
        const subscription = localStorage.getItem('push-subscription');
        event.source.postMessage({
          type: 'PUSH_SUBSCRIPTION',
          subscription: subscription ? JSON.parse(subscription) : null
        }, event.origin);
      }
      
      if (event.data.type === 'REQUEST_NOTIFICATION_PERMISSION') {
        if (Notification.permission === 'default') {
          notificationModal.classList.remove('hidden');
        } else if (Notification.permission === 'granted') {
          await registerPushSubscription();
          event.source.postMessage({
            type: 'NOTIFICATION_PERMISSION_GRANTED',
            subscription: window.pushSubscription
          }, event.origin);
        }
      }
      
      if (event.data.type === 'SAVE_USER_EMAIL') {
        // Salvar email do usuário para associar à subscription
        localStorage.setItem('user-email', event.data.email);
        console.log('[PWA] Email salvo:', event.data.email);
      }
    });
  </script>
</body>
</html>