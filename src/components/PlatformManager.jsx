import { useEffect } from 'react';
import PWAManager from './PWAManager';
import AndroidAppBanner from './AndroidAppBanner';

// Detecta se é Android ou iOS
export function isAndroid() {
  const ua = navigator.userAgent.toLowerCase();
  return /android/.test(ua);
}

export function isIOS() {
  const ua = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isAndroidWebView() {
  const ua = navigator.userAgent.toLowerCase();
  return isAndroid() && /wv/.test(ua);
}

export default function PlatformManager() {
  useEffect(() => {
    console.log('🌍 PlatformManager iniciado');
    console.log('📱 User Agent:', navigator.userAgent);
    
    const android = isAndroid();
    const ios = isIOS();
    const androidWebView = isAndroidWebView();
    
    console.log('🤖 Android?', android);
    console.log('🍎 iOS?', ios);
    console.log('📲 Android WebView (App)?', androidWebView);
    
    // CRÍTICO: No Android, desregistrar qualquer service worker existente
    if (android && 'serviceWorker' in navigator) {
      console.log('⚠️ Android detectado - desativando PWA e Service Workers');
      
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        console.log(`🗑️ Removendo ${registrations.length} service worker(s)...`);
        registrations.forEach((registration) => {
          registration.unregister().then(() => {
            console.log('✅ Service Worker removido:', registration.scope);
          });
        });
      });
      
      // Prevenir registro de novos service workers
      if (navigator.serviceWorker.register) {
        const originalRegister = navigator.serviceWorker.register;
        navigator.serviceWorker.register = function() {
          console.warn('❌ Bloqueado: Tentativa de registrar Service Worker no Android');
          return Promise.reject(new Error('Service Worker bloqueado no Android'));
        };
      }
      
      console.log('✅ Android: PWA desativado, WebPush bloqueado');
    }
    
    if (ios) {
      console.log('✅ iOS detectado - PWA e WebPush habilitados');
    }
  }, []);

  // Renderiza componente específico por plataforma
  if (isAndroid()) {
    return <AndroidAppBanner />;
  }
  
  if (isIOS()) {
    return <PWAManager />;
  }
  
  return null;
}