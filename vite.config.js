import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Render da aplicação
ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
)

// 🔥 REGISTRO DO SERVICE WORKER (PWA + PUSH)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        '/service-worker.js',
        { scope: '/' }
      )

      console.log('✅ Service Worker registrado com sucesso:', registration)

    } catch (error) {
      console.error('❌ Falha ao registrar Service Worker:', error)
    }
  })
}

// Hot reload do Base44 / Vite
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*')
  })

  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*')
  })
}
