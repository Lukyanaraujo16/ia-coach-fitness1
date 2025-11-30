# PWA Externo - IA Coach Fitness

## Arquivos para hospedagem

Este diretório contém os arquivos necessários para hospedar o PWA externamente.

### Estrutura de arquivos

Coloque estes arquivos na **RAIZ** do seu servidor/hospedagem:

```
/
├── index.html          # Página principal com iframe
├── manifest.json       # Manifest do PWA
├── service-worker.js   # Service Worker para push notifications
└── README.md           # Este arquivo (não precisa hospedar)
```

### Configuração necessária

#### 1. No arquivo `index.html`:

**Linha ~170** - Substitua pela sua chave VAPID pública:
```javascript
const VAPID_PUBLIC_KEY = 'SUA_CHAVE_VAPID_PUBLICA_AQUI';
```

**Linha ~173** - Substitua pela URL da função de registro (se criar uma):
```javascript
const SUBSCRIPTION_ENDPOINT = 'https://seu-dominio/api/functions/registerPushSubscription';
```

**Linha ~155** - Verifique se a URL do iframe está correta:
```html
<iframe src="https://iacoachfitness.com.br" ...>
```

#### 2. Chave VAPID

Sua chave VAPID pública está configurada como secret no Base44: `VAPID_PUBLIC_KEY`

Para obter o valor, acesse o painel do Base44 > Configurações > Secrets

### Como hospedar

#### Opção 1: Vercel (Recomendado - Gratuito)
1. Crie uma conta em vercel.com
2. Crie um novo projeto
3. Faça upload dos 3 arquivos (index.html, manifest.json, service-worker.js)
4. Configure o domínio personalizado se desejar

#### Opção 2: Netlify (Gratuito)
1. Crie uma conta em netlify.com
2. Arraste e solte os arquivos
3. Configure o domínio

#### Opção 3: GitHub Pages (Gratuito)
1. Crie um repositório no GitHub
2. Adicione os arquivos
3. Ative GitHub Pages nas configurações

#### Opção 4: Cloudflare Pages (Gratuito)
1. Crie uma conta em cloudflare.com
2. Crie um novo Pages project
3. Faça upload dos arquivos

### Headers importantes (se possível configurar)

Para melhor funcionamento, configure estes headers no servidor:

```
Service-Worker-Allowed: /
Content-Type: application/javascript (para service-worker.js)
Content-Type: application/json (para manifest.json)
```

### Testando

1. Acesse o site hospedado
2. Verifique se o app Base44 carrega no iframe
3. Verifique se aparece o banner de instalação
4. Instale o PWA
5. Aceite as notificações
6. Teste enviando uma notificação do painel admin

### Integração com Base44

O iframe se comunica com o app Base44 via `postMessage`. 
O app pode enviar mensagens para:

- `REQUEST_NOTIFICATION_PERMISSION` - Solicitar permissão de notificação
- `GET_PUSH_SUBSCRIPTION` - Obter subscription atual
- `REGISTER_PUSH_SUBSCRIPTION` - Registrar subscription com email do usuário

### Troubleshooting

**Push não funciona no iOS:**
- Certifique-se de que o PWA está instalado (adicionado à tela inicial)
- iOS 16.4+ é necessário para Web Push
- O usuário precisa aceitar a permissão de notificação

**Iframe não carrega:**
- Verifique se a URL do Base44 está correta
- Verifique se o Base44 permite ser carregado em iframe (X-Frame-Options)

**Service Worker não registra:**
- O site deve estar em HTTPS
- O service-worker.js deve estar na raiz