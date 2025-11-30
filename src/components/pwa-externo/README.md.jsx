# PWA Externo - IA Coach Fitness

## Visão Geral

Este PWA externo serve como **ponte de instalação** para o IA Coach Fitness. 

**Fluxo:**
1. Usuário acessa `https://pwa-ia-coach.vercel.app`
2. Segue instruções para instalar o PWA (Android ou iOS)
3. Ao abrir o app instalado, é redirecionado para `https://iacoachfitness.com.br`
4. Push notifications funcionam mesmo com o app "fechado"

---

## Arquivos para hospedagem

Coloque estes arquivos na **RAIZ** do seu servidor:

```
/
├── index.html          # Página de instalação do PWA
├── manifest.json       # Manifest do PWA (define nome, ícones, start_url)
├── service-worker.js   # Service Worker para push notifications
└── README.md           # Este arquivo (não precisa hospedar)
```

---

## Configuração

### 1. manifest.json

O `start_url` está configurado para redirecionar para o app principal:
```json
"start_url": "https://iacoachfitness.com.br"
```

### 2. service-worker.js

Já configurado com sua chave VAPID pública para push notifications.

### 3. index.html

Página de instalação com detecção automática de plataforma (Android/iOS).

---

## Push Notifications - Como Funciona

### Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│  PWA Externo (pwa-ia-coach.vercel.app)                      │
│  ├── Service Worker registrado                              │
│  ├── Recebe push via VAPID                                  │
│  └── Exibe notificação nativa                               │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Ao clicar na notificação
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  App Principal (iacoachfitness.com.br)                      │
│  └── Usuário é redirecionado para a página relevante        │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de Registro de Push

1. **Usuário instala o PWA** via `pwa-ia-coach.vercel.app`
2. **Ao abrir o PWA**, o app principal carrega
3. **App solicita permissão** de notificação
4. **Subscription é criada** com a chave VAPID
5. **Subscription é salva** no banco (PushSubscription entity)
6. **Admin envia notificação** via painel
7. **Backend dispara push** via Web Push protocol
8. **Service Worker recebe** e exibe notificação nativa

### Chaves VAPID

As chaves já estão configuradas como secrets no Base44:
- `VAPID_PUBLIC_KEY` - Usada no frontend/service-worker
- `VAPID_PRIVATE_KEY` - Usada no backend para assinar pushes

---

## Hospedagem

### Vercel (Atual) ✅
URL: `https://pwa-ia-coach.vercel.app`

Para atualizar:
1. Acesse o dashboard da Vercel
2. Faça redeploy com os novos arquivos

### Outras opções

| Serviço | Gratuito | HTTPS | Facilidade |
|---------|----------|-------|------------|
| Vercel | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| Netlify | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| Cloudflare Pages | ✅ | ✅ | ⭐⭐⭐⭐ |
| GitHub Pages | ✅ | ✅ | ⭐⭐⭐ |

---

## Testando

### Instalação

1. Acesse `https://pwa-ia-coach.vercel.app` no celular
2. **Android:** Toque em "Instalar App" ou siga instruções
3. **iOS:** Toque em Compartilhar → Adicionar à Tela de Início
4. Abra o app da tela inicial
5. Deve redirecionar para `iacoachfitness.com.br`

### Push Notifications

1. No app, aceite a permissão de notificações
2. Acesse Admin → Notificações
3. Envie uma notificação de teste
4. Feche o app completamente
5. A notificação deve aparecer mesmo com app fechado

---

## Troubleshooting

### Push não funciona no iOS
- ✅ Precisa iOS 16.4+
- ✅ PWA deve estar INSTALADO (não funciona no Safari)
- ✅ Usuário deve aceitar permissão
- ✅ Use Safari para instalar (Chrome iOS não suporta PWA)

### Push não funciona no Android
- ✅ Verifique se subscription foi salva no banco
- ✅ Verifique console do service worker
- ✅ Teste com Chrome DevTools → Application → Service Workers

### App não redireciona após instalar
- ✅ Verifique `start_url` no manifest.json
- ✅ Limpe cache do navegador e reinstale

### Notificação aparece mas não abre o app
- ✅ Verifique `notificationclick` no service-worker.js
- ✅ URL deve ser absoluta: `https://iacoachfitness.com.br`

---

## Arquivos Importantes no Base44

| Arquivo | Função |
|---------|--------|
| `functions/sendPushNotification.js` | Envia push via Web Push API |
| `pages/AdminNotifications.js` | Painel para enviar notificações |
| `components/PWAManager.jsx` | Gerencia subscription no frontend |
| `entities/PushSubscription.json` | Armazena subscriptions dos usuários |

---

## Contato

Em caso de dúvidas sobre a implementação, consulte a documentação do Base44 ou entre em contato pelo suporte.