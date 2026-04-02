/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ LOGGING & SECURITY IMPROVEMENTS — PLANO DE IMPLEMENTAÇÃO                      │
 * │                                                                              │
 * │ Data: 22 de março de 2026                                                    │
 * │ Objetivo: Respeitar LOG_LEVEL e evitar exposição de dados sensíveis          │
 * │                                                                              │
 * │ Este documento lista todas as alterações necessárias para:                   │
 * │ 1. Remover console.* que bypassam o Logger                                   │
 * │ 2. Evitar exposição de conteúdo de mensagens (content)                       │
 * │ 3. Reduzir exposição de identificadores de usuários em logs                  │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

# Logging & Security Improvements — Plano de Implementação

## 📋 Resumo Executivo

Este plano aborda **2 problemas críticos**:

1. **Bypass do Logger:** Chamadas `console.*` diretas ignoram `LOG_LEVEL` completamente
2. **Exposição de dados:** Conteúdo de mensagens, números de telefone e chaves de mídia sendo registrados em logs

**Impacto:** 56 chamadas `console.*` + logs desconcentrados expondo dados sensíveis de conversas

---

## 🔴 Problema 1: Console.* Bypassando LOG_LEVEL

### Contexto

O sistema possui um `Logger` centralizado que **respeita** `LOG_LEVEL`:

```typescript
export type LogLevel = 'ERROR' | 'WARN' | 'DEBUG' | 'INFO' | 'LOG' | 'VERBOSE' | 'DARK';
export type Log = {
  LEVEL: LogLevel[];
  COLOR: boolean;
};
```

O método `console()` do Logger verifica:
```typescript
const types: Type[] = [];
this.configService.get<Log>('LOG').LEVEL.forEach((level) => types.push(Type[level]));
if (types.includes(type)) {
  // log only if level is enabled
}
```

**MAS:** Chamadas diretas a `console.log/warn/error()` **bypassam completamente** este check.

---

## 🟡 Problema 2: Exposição de Dados Sensíveis

### Context: `messages.upsert` Handler

Em [`whatsapp.service.ts` ~L950-L1122](whatsapp-api/src/whatsapp/services/whatsapp.service.ts#L950), o handler de `messages.upsert`:

1. Constrói objeto `messageRaw` com:
   - `content`: **Texto completo da mensagem**
   - `keyRemoteJid`: **Número de telefone do contato**
   - `pushName`: **Nome do contato**
   - `content.mediaKey`, `content.directPath`, `content.url`: **Dados criptográficos de mídia**

2. Envia via webhook: `await this.sendDataWebhook('messagesUpsert', messageRaw);` ✓ OK

3. **MAS ENTÃO:**
   ```typescript
   this.logger.log('Type: ' + type);
   console.log(messageRaw);  // ← PROBLEMA: stdout expõe tudo
   ```

4. E em `sendDataWebhook()` [@L383](whatsapp-api/src/whatsapp/services/whatsapp.service.ts#L383):
   ```typescript
   const _url = `${globalWebhook?.URL}${_hook_userid ? '/' + _hook_userid : ''}`;
   this.logger.info(`WebHook: ${eventDesc} | URL: ${_url} | UserID: ${_hook_userid}`);
   // ↑ Logado ANTES do if (globalWebhook?.ENABLED), então SEMPRE executa
   // ↑ Expõe userID a cada mensagem recebida
   ```

---

## ✅ Solução: 5 Mudanças Nucleares

### MUDANÇA #1: Remover `console.log(messageRaw)`

**Arquivo:** [`whatsapp-api/src/whatsapp/services/whatsapp.service.ts`](whatsapp-api/src/whatsapp/services/whatsapp.service.ts)  
**Linha:** ~1122  
**Criticidade:** 🔴 CRÍTICA

**Antes:**
```typescript
        this.ws.send(this.instance.name, 'messages.upsert', messageRaw);
        await this.sendDataWebhook('messagesUpsert', messageRaw);

        this.logger.log('Type: ' + type);
        console.log(messageRaw);
      }
    },
```

**Depois:**
```typescript
        this.ws.send(this.instance.name, 'messages.upsert', messageRaw);
        await this.sendDataWebhook('messagesUpsert', messageRaw);

        this.logger.debug('messages.upsert type: ' + type);
      }
    },
```

**Justificativa:**
- `console.log(messageRaw)` expõe conteúdo de mensagens, JIDs, nomes
- Sem propósito funcional em produção
- Debug pode ser feito via `LOG_LEVEL=DEBUG` se necessário

---

### MUDANÇA #2: Mover log do global webhook para dentro do `if`

**Arquivo:** [`whatsapp-api/src/whatsapp/services/whatsapp.service.ts`](whatsapp-api/src/whatsapp/services/whatsapp.service.ts)  
**Linha:** ~378-395  
**Criticidade:** 🟡 ALTA

**Antes:**
```typescript
    try {
      const globalWebhook = this.configService.get<GlobalWebhook>('GLOBAL_WEBHOOK');
      const _url = `${globalWebhook?.URL}${_hook_userid ? '/' + _hook_userid : ''}`;
      this.logger.info(`WebHook: ${eventDesc} | URL: ${_url} | UserID: ${_hook_userid}`);
      if (
        globalWebhook?.ENABLED &&
        (isURL(globalWebhook.URL) || globalWebhook?.IS_LOCAL)
      ) {
        await axios.post(
          _url,
          {
            event: eventDesc,
            instance: this.instance,
            data,
          },
          { headers: { 'Resource-owner': this.instance.ownerJid } },
        );
      }
    } catch (error) {
```

**Depois:**
```typescript
    try {
      const globalWebhook = this.configService.get<GlobalWebhook>('GLOBAL_WEBHOOK');
      if (
        globalWebhook?.ENABLED &&
        (isURL(globalWebhook.URL) || globalWebhook?.IS_LOCAL)
      ) {
        const _url = `${globalWebhook?.URL}${_hook_userid ? '/' + _hook_userid : ''}`;
        this.logger.debug(`GlobalWebhook: ${eventDesc} (user: ${_hook_userid})`);
        await axios.post(
          _url,
          {
            event: eventDesc,
            instance: this.instance,
            data,
          },
          { headers: { 'Resource-owner': this.instance.ownerJid } },
        );
      }
    } catch (error) {
```

**Justificativa:**
- Log era chamado para **todo evento de toda instância**, mesmo com webhook desabilitado
- Com `messages.upsert` sendo o evento mais frequente: 100+ logs/min com userId
- Mover para dentro do `if` reduz volume de logs com PII
- Rebaixar para `DEBUG` (não será logado por padrão em produção)

---

## 🔧 Problema 1: Console.* Bypass (5 Arquivos)

### MUDANÇA #3: `guards/instance.guard.ts`

**Arquivo:** [`whatsapp-api/src/guards/instance.guard.ts`](whatsapp-api/src/guards/instance.guard.ts)  
**Linha:** ~70  
**Criticidade:** 🟢 MÉDIA

**Antes:**
```typescript
import { existsSync } from 'fs';
import { join } from 'path';
import { NextFunction, Request, Response } from 'express';

const INSTANCE_DIR = process.env.INSTANCE_DIR || './instances';

export async function getInstanceNameAndCheck(
  providerFiles: ProviderFiles,
  instanceName: string,
) {
  try {
    const cache = instanceCache.get(instanceName);
    if (exists) {
      return exists;
    }
    if (providerFiles.isEnabled) {
      const [keyExists] = await providerFiles.allInstances();
      return keyExists?.data.includes(instanceName);
    }

    return existsSync(join(INSTANCE_DIR, instanceName));
  } catch (error) {
    console.log('Error fetching instance from cache', error);
    return false;
  }
}
```

**Depois:**
```typescript
import { existsSync } from 'fs';
import { join } from 'path';
import { NextFunction, Request, Response } from 'express';
import { Logger } from '../config/logger.config';
import { ConfigService } from '../config/env.config';

const INSTANCE_DIR = process.env.INSTANCE_DIR || './instances';
const logger = new Logger(new ConfigService(), 'getInstanceNameAndCheck');

export async function getInstanceNameAndCheck(
  providerFiles: ProviderFiles,
  instanceName: string,
) {
  try {
    const cache = instanceCache.get(instanceName);
    if (exists) {
      return exists;
    }
    if (providerFiles.isEnabled) {
      const [keyExists] = await providerFiles.allInstances();
      return keyExists?.data.includes(instanceName);
    }

    return existsSync(join(INSTANCE_DIR, instanceName));
  } catch (error) {
    logger.warn(`Error fetching instance from cache: ${error?.message}`);
    return false;
  }
}
```

---

### MUDANÇA #4: `utils/proxy.ts`

**Arquivo:** [`whatsapp-api/src/utils/proxy.ts`](whatsapp-api/src/utils/proxy.ts)  
**Linhas:** ~64, ~81  
**Criticidade:** 🟢 MÉDIA

**Antes:**
```typescript
import { HttpProxyAgent } from 'http-proxy-agent';
// ... outras imports

function getProxyAgents(proxy?: EnvProxy) {
  const wsProxyUrl = proxy?.WS;
  const fetchProxyUrl = proxy?.FETCH;

  const agents = {} as any;

  // WS
  if (wsProxyUrl) {
    const proto = detectProtocol(wsProxyUrl);
    switch (proto) {
      case 'http':
        agents.wsAgent = new HttpProxyAgent(wsProxyUrl);
        break;
      case 'https':
        agents.wsAgent = new HttpsProxyAgent(wsProxyUrl);
        break;
      case 'socks':
      case 'socks4':
      case 'socks5':
        agents.wsAgent = new SocksProxyAgent(wsProxyUrl);
        break;
      default:
        console.warn(`[Proxy] Protocolo desconhecido para WS: ${proto}`);
        break;
    }
  }

  // FETCH
  if (fetchProxyUrl) {
    const proto = detectProtocol(fetchProxyUrl);
    switch (proto) {
      case 'http':
      case 'https':
      case 'socks':
      case 'socks4':
      case 'socks5':
        agents.fetchAgent = new UndiciProxyAgent(fetchProxyUrl);
        break;
      default:
        console.warn(`[Proxy] Protocolo desconhecido para Fetch: ${proto}`);
        break;
    }
  }

  return agents;
}
```

**Depois:**
```typescript
import { HttpProxyAgent } from 'http-proxy-agent';
import { Logger } from '../config/logger.config';
import { ConfigService } from '../config/env.config';
// ... outras imports

const logger = new Logger(new ConfigService(), 'ProxyService');

function getProxyAgents(proxy?: EnvProxy) {
  const wsProxyUrl = proxy?.WS;
  const fetchProxyUrl = proxy?.FETCH;

  const agents = {} as any;

  // WS
  if (wsProxyUrl) {
    const proto = detectProtocol(wsProxyUrl);
    switch (proto) {
      case 'http':
        agents.wsAgent = new HttpProxyAgent(wsProxyUrl);
        break;
      case 'https':
        agents.wsAgent = new HttpsProxyAgent(wsProxyUrl);
        break;
      case 'socks':
      case 'socks4':
      case 'socks5':
        agents.wsAgent = new SocksProxyAgent(wsProxyUrl);
        break;
      default:
        logger.warn(`Protocolo desconhecido para WS: ${proto}`);
        break;
    }
  }

  // FETCH
  if (fetchProxyUrl) {
    const proto = detectProtocol(fetchProxyUrl);
    switch (proto) {
      case 'http':
      case 'https':
      case 'socks':
      case 'socks4':
      case 'socks5':
        agents.fetchAgent = new UndiciProxyAgent(fetchProxyUrl);
        break;
      default:
        logger.warn(`Protocolo desconhecido para Fetch: ${proto}`);
        break;
    }
  }

  return agents;
}
```

---

### MUDANÇA #5: `whatsapp/services/whatsapp.service.ts` — FFmpeg logs

**Arquivo:** [`whatsapp-api/src/whatsapp/services/whatsapp.service.ts`](whatsapp-api/src/whatsapp/services/whatsapp.service.ts)  
**Linhas:** 1121-1122, 1655-1693  
**Criticidade:** 🟡 ALTA (FFmpeg pode gerar muitos logs)

#### Seção 1: Handler `messages.upsert`

**Antes:**
```typescript
        this.logger.log('Type: ' + type);
        console.log(messageRaw);
      }
    },
```

**Depois:**
```typescript
        this.logger.debug('messages.upsert type: ' + type);
      }
    },
```

#### Seção 2: FFmpeg processing

**Antes:**
```typescript
        this.logger.info(
          'Mime: ' +
            mime.lookup(ext).toString() +
            ' - Target Format: ' +
            targetFormat,
        );

        const commandLine = ffmpegCmd.join(' ');
        const result = new Promise<Buffer>((resolve, reject) => {
          const ffmpegProcess = execFile('ffmpeg', ffmpegCmd);

          let output = Buffer.alloc(0);

          console.log('FFmpeg started with command:', commandLine);

          ffmpegProcess.stdout!.on('data', (data: Buffer) => {
            output = Buffer.concat([output, data]);
          });

          ffmpegProcess.stderr!.on('data', (err: Buffer) => {
            console.error('FFmpeg error:', err.message);
          });

          ffmpegProcess.on('error', (err: Error) => {
            console.error('FFmpeg error:', err.message);
            console.error('FFmpeg stderr:', stderr);
            reject(err);
          });

          ffmpegProcess.on('close', (code) => {
            if (code === 0) {
              if (ext !== targetFormat) {
                console.log('Converted to WAV, retrying final conversion...');
                // retry logic
              }

              if (convertedTriesCount >= 3) {
                console.error('Second FFmpeg error:', err2.message);
                reject(err2);
              } else {
                console.log('Final conversion to target format successful');
                resolve(output);
              }
            } else {
              reject(new Error(`FFmpeg exited with code ${code}`));
            }
          });
        });

        console.log('FFmpeg processing finished');
        return result;
```

**Depois:**
```typescript
        this.logger.info(
          'Mime: ' +
            mime.lookup(ext).toString() +
            ' - Target Format: ' +
            targetFormat,
        );

        const commandLine = ffmpegCmd.join(' ');
        const result = new Promise<Buffer>((resolve, reject) => {
          const ffmpegProcess = execFile('ffmpeg', ffmpegCmd);

          let output = Buffer.alloc(0);

          this.logger.debug('FFmpeg started with command: ' + commandLine);

          ffmpegProcess.stdout!.on('data', (data: Buffer) => {
            output = Buffer.concat([output, data]);
          });

          ffmpegProcess.stderr!.on('data', (err: Buffer) => {
            this.logger.error('FFmpeg error: ' + err.message);
          });

          ffmpegProcess.on('error', (err: Error) => {
            this.logger.error('FFmpeg error: ' + err.message);
            reject(err);
          });

          ffmpegProcess.on('close', (code) => {
            if (code === 0) {
              if (ext !== targetFormat) {
                this.logger.debug('Converted to WAV, retrying final conversion...');
                // retry logic
              }

              if (convertedTriesCount >= 3) {
                this.logger.error('Second FFmpeg error: ' + err2.message);
                reject(err2);
              } else {
                this.logger.debug('Final conversion to target format successful');
                resolve(output);
              }
            } else {
              reject(new Error(`FFmpeg exited with code ${code}`));
            }
          });
        });

        this.logger.debug('FFmpeg processing finished');
        return result;
```

---

### MUDANÇA #6: `whatsapp/routers/chat.router.ts`

**Arquivo:** [`whatsapp-api/src/whatsapp/routers/chat.router.ts`](whatsapp-api/src/whatsapp/routers/chat.router.ts)  
**Linha:** ~196  
**Criticidade:** 🟢 MÉDIA

**Antes:**
```typescript
export function ChatRouter(
  chatController: ChatController,
  ...guards: RequestHandler[]
) {
  const router = Router()
    .get(routerPath('list'), ...guards, async (req, res) => {
      // ...
      const transform: Transform = response.stream;

      transform.pipe(res);
      transform.on('error', (err) => {
        if (err) {
          console.error(err);
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json([err?.message, err?.stack]);
        }
      });
      return;
    })
```

**Depois:**
```typescript
export function ChatRouter(
  chatController: ChatController,
  logger: Logger,  // injetar logger via função
  ...guards: RequestHandler[]
) {
  const router = Router()
    .get(routerPath('list'), ...guards, async (req, res) => {
      // ...
      const transform: Transform = response.stream;

      transform.pipe(res);
      transform.on('error', (err) => {
        if (err) {
          logger.error('ChatRouter transform error: ' + err.message);
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json([err?.message, err?.stack]);
        }
      });
      return;
    })
```

**Nota:** Verificar como `ChatRouter` é instanciado em `app.module.ts` para passar `logger`.

---

### MUDANÇA #7: `whatsapp/services/whatsapp.service.ts` — Outra linha com console

**Arquivo:** [`whatsapp-api/src/whatsapp/services/whatsapp.service.ts`](whatsapp-api/src/whatsapp/services/whatsapp.service.ts)  
**Linha:** ~1121  
**Criticidade:** 🟢 BAIXA (debug de mensagem bruta)

**Antes:**
```typescript
        this.ws.send(this.instance.name, 'messages.upsert', messageRaw);
        await this.sendDataWebhook('messagesUpsert', messageRaw);

        this.logger.log('Type: ' + type);
        console.log(messageRaw);
```

**Depois:** (mesma que MUDANÇA #2)

---

## 📊 Sumário das Mudanças

| # | Arquivo | Linha | Tipo | LOG_LEVEL | Risco |
|---|---------|-------|------|-----------|-------|
| 1 | whatsapp.service.ts | 1122 | Remove console.log | N/A | 🔴 CRÍTICA |
| 2 | whatsapp.service.ts | 383 | Move webhook log | DEBUG | 🟡 ALTA |
| 3 | guards/instance.guard.ts | 70 | console → logger.warn | WARN | 🟢 MÉDIA |
| 4 | utils/proxy.ts | 64,81 | console → logger.warn | WARN | 🟢 MÉDIA |
| 5 | whatsapp.service.ts | 1655-1693 | console → logger.debug | DEBUG | 🟡 ALTA |
| 6 | chat.router.ts | 196 | console → logger.error | ERROR | 🟢 MÉDIA |

---

## 🧪 Validação Pós-Implementação

### Teste 1: LOG_LEVEL mínimo (produção)

```bash
LOG_LEVEL=ERROR,WARN
npm run start:prod
# Verificar:
# - Nenhuma linha de FFmpeg debug aparece
# - Nenhuma linha de proxy warnings (a menos que erro real)
# - Nenhuma linha de "WebHook:" com userId
```

### Teste 2: LOG_LEVEL máximo (debug)

```bash
LOG_LEVEL=DEBUG,INFO,WARN,ERROR,LOG,VERBOSE
npm run start:dev
# Verificar:
# - FFmpeg logs aparecem quando converter mídia
# - WebHook logs aparecem quando global webhook ativado
# - Nenhum console.log() deveria aparecer
```

### Teste 3: Mensagem via webhook

```bash
# Enviar mensagem via WhatsApp
# Verificar:
# - Conteúdo NÃO aparece em stdout
# - Conteúdo NÃO aparece em logs (exceto via webhook que já estava)
# - Apenas logs de tipo/status aparecem em DEBUG ou inferior
```

---

## 📝 Notas de Implementação

1. **Ordem sugerida:**
   - Começar pela MUDANÇA #1 (crítica)
   - Depois MUDANÇA #2 (alto volume)
   - Depois as outras (ordem não importa)

2. **Testing:**
   - Compilar: `npm run build`
   - Lint: `npm run lint`
   - Testar em Docker: `docker-compose up`

3. **Backup:**
   - Criar branch `feat/logging-security-improvements`
   - Fazer commit atômico por mudança

4. **Documentação:**
   - Atualizar README.md com informações sobre LOG_LEVEL
   - Adicionar exemplo de `.env.production` com LOG_LEVEL recomendado

---

## 🔒 Benefícios de Segurança

✅ **Proteção de PII:** Não expõe números de telefone, nomes, usuários em logs  
✅ **Proteção de conteúdo:** Conversas nunca aparecem em stdout  
✅ **Proteção criptográfica:** mediaKey, directPath, URLs não logadas  
✅ **Controle centralizado:** LOG_LEVEL governa todos os logs  
✅ **Compliance:** Alinhado com LGPD/GDPR (consentimento, retenção)

