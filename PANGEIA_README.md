# 🤖 Pangeia - Agente Conversacional de Gestão de Tarefas

Sistema completo de gestão de tarefas via WhatsApp com hierarquia de equipe (líderes e encarregados).

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Características](#características)
- [Instalação](#instalação)
- [Comandos do WhatsApp](#comandos-do-whatsapp)
- [API REST](#api-rest)
- [Arquitetura](#arquitetura)
- [Exemplos de Uso](#exemplos-de-uso)

## 🎯 Visão Geral

O **Pangeia** é um agente conversacional inteligente integrado ao WhatsApp que permite gerenciar tarefas de equipe de forma natural e intuitiva. Você pode criar tarefas, atribuir membros, acompanhar progresso e gerar relatórios - tudo através de mensagens do WhatsApp!

### Principais Funcionalidades

✅ **Gestão de Tarefas Completa**
- Criar, listar, atualizar e concluir tarefas
- Priorização (Baixa, Média, Alta, Urgente)
- Status (Pendente, Em Progresso, Concluída, Cancelada, Em Espera)
- Prazos e alertas de atraso
- Comentários e histórico

👥 **Hierarquia de Equipe**
- Líderes: Têm visão completa e podem gerenciar tudo
- Encarregados: Membros regulares da equipe
- Cadastro automático ao interagir com o bot

📊 **Relatórios e Estatísticas**
- Estatísticas por equipe e por membro
- Tarefas em atraso
- Progresso e conclusão

🔔 **Notificações Inteligentes**
- Notificação de líderes sobre novas tarefas
- Lembretes de tarefas pendentes

🧠 **IA Conversacional (NOVO!)**
- Entende linguagem natural sem comandos fixos
- Aprende com o contexto da conversa
- Suporte para múltiplos provedores de IA (OpenAI, Anthropic, Groq, Local)
- Respostas personalizadas e naturais
- Memória de conversação
- Fallback inteligente para regex quando IA não está disponível

## 🧠 IA Conversacional

O Pangeia agora conta com **IA Generativa** para entender comandos de forma muito mais natural e flexível!

### Como Funciona

**SEM IA (modo regex):**
```
Usuário: "criar tarefa Revisar código"
```

**COM IA (modo natural):**
```
Usuário: "preciso que alguém revise o código do backend"
Pangeia: ✅ Tarefa criada! #15 - Revisar código do backend

Usuário: "atribui pra Maria"
Pangeia: ✅ Tarefa #15 atribuída a Maria Santos!

Usuário: "qual o status dela?"
Pangeia: 📋 #15 - Revisar código do backend
         ⏳ Status: Pendente
         👤 Atribuída a: Maria Santos
```

### Provedores Suportados

1. **OpenAI GPT** (Recomendado para produção)
   - Modelos: gpt-4o, gpt-4o-mini, gpt-3.5-turbo
   - Melhor qualidade de compreensão
   - Custo: Pago por token

2. **Anthropic Claude** (Alternativa premium)
   - Modelos: claude-3-5-sonnet, claude-3-haiku
   - Excelente raciocínio
   - Custo: Pago por token

3. **Groq** (Recomendado para testes - GRATUITO!)
   - Modelos: llama-3.1-70b-versatile, mixtral-8x7b
   - Ultra rápido (até 10x mais rápido)
   - Custo: **GRATUITO** (com limites)
   - Ideal para desenvolvimento

4. **Local/Ollama** (100% Privado)
   - Rode sua própria IA localmente
   - Modelos: llama3, mistral, phi, etc
   - Custo: Grátis, mas precisa de hardware

### Configuração Rápida

#### Opção 1: Groq (Gratuito e Rápido) ⚡

1. Crie conta em [console.groq.com](https://console.groq.com)
2. Gere uma API key
3. Adicione no `.env`:

```bash
PANGEIA_AI_PROVIDER=groq
PANGEIA_AI_API_KEY=gsk_...
PANGEIA_AI_MODEL=llama-3.1-70b-versatile
```

#### Opção 2: OpenAI (Melhor Qualidade) 🎯

1. Crie conta em [platform.openai.com](https://platform.openai.com)
2. Adicione créditos e gere API key
3. Adicione no `.env`:

```bash
PANGEIA_AI_PROVIDER=openai
PANGEIA_AI_API_KEY=sk-proj-...
PANGEIA_AI_MODEL=gpt-4o-mini
```

#### Opção 3: Anthropic Claude 🧠

```bash
PANGEIA_AI_PROVIDER=anthropic
PANGEIA_AI_API_KEY=sk-ant-...
PANGEIA_AI_MODEL=claude-3-5-sonnet-20241022
```

#### Opção 4: Ollama (Local e Gratuito) 🏠

1. Instale Ollama: [ollama.com](https://ollama.com)
2. Baixe um modelo: `ollama pull llama3`
3. Configure:

```bash
PANGEIA_AI_PROVIDER=local
PANGEIA_AI_API_KEY=http://localhost:11434/api/chat
PANGEIA_AI_MODEL=llama3
```

### Configuração Avançada

Copie `.env.pangeia.example` para `.env` e configure:

```bash
# Provider
PANGEIA_AI_PROVIDER=groq

# API Key
PANGEIA_AI_API_KEY=sua_api_key_aqui

# Modelo (opcional - cada provider tem padrão)
PANGEIA_AI_MODEL=llama-3.1-70b-versatile

# Temperatura (0.0 - 1.0) - controla criatividade
PANGEIA_AI_TEMPERATURE=0.7

# Máximo de tokens na resposta
PANGEIA_AI_MAX_TOKENS=500
```

### Comparação de Provedores

| Provider | Custo | Velocidade | Qualidade | Privacidade | Recomendado Para |
|----------|-------|------------|-----------|-------------|------------------|
| **Groq** | ⭐ Grátis | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐ | ⭐⭐⭐ | Desenvolvimento |
| **OpenAI** | 💰 Pago | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Produção |
| **Claude** | 💰 Pago | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Produção Premium |
| **Ollama** | ⭐ Grátis | ⚡⚡ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Máxima Privacidade |

### Recursos da IA

✨ **Compreensão Contextual**
- Entende referências ("ela", "essa tarefa", "última")
- Mantém contexto das últimas 10 mensagens
- Lembra das tarefas recentes do usuário

✨ **Flexibilidade de Comandos**
- "preciso criar uma task pra revisar docs" ✅
- "quais são as minhas coisas pendentes?" ✅
- "finaliza a 5" ✅
- "atribui pro João" ✅

✨ **Respostas Naturais**
- Respostas personalizadas baseadas no contexto
- Tom amigável e motivador
- Sugestões proativas

✨ **Sistema Híbrido Inteligente**
- Se a IA falhar, usa regex automaticamente
- Se confiança for baixa (<60%), usa regex
- Zero downtime, sempre funciona!

### Testando a IA

```
# Comando tradicional (funciona sempre)
/pangeia criar tarefa Revisar documentação

# Com IA (mais natural)
/pangeia preciso que alguém revise a documentação
/pangeia cria uma task pra revisar os docs
/pangeia adiciona: revisar documentação do projeto
```

Todos funcionam! A IA entende a intenção. 🎯

### Logs da IA

Quando a IA está ativa, você verá logs no console:

```
[Pangeia] IA ativada com provider: groq
[Pangeia AI] Intent: create_task, Confidence: 0.95
```

Quando usa fallback:

```
[Pangeia AI] Baixa confiança (0.45), usando fallback regex
```

### Desativando a IA

Se preferir usar apenas regex patterns (sem IA), simplesmente **não configure** as variáveis de ambiente do Pangeia. O sistema funciona perfeitamente sem IA!

## 🚀 Instalação

### 1. Executar Migração do Banco de Dados

```bash
# Aplicar migração
npx prisma migrate deploy

# OU se preferir, executar manualmente o SQL
psql -U seu_usuario -d seu_banco -f prisma/migrations/20251024_add_pangeia_task_management/migration.sql
```

### 2. Gerar Cliente Prisma

```bash
npx prisma generate
```

### 3. Reiniciar o Servidor

```bash
npm run dev
# ou
npm start
```

## 💬 Comandos do WhatsApp

Para usar o agente, inicie suas mensagens com `/pangeia` seguido do comando.

### 📋 Tarefas

#### Criar Tarefa
```
/pangeia criar tarefa Revisar documentação do projeto
/pangeia nova tarefa Preparar apresentação para cliente
```

#### Listar Tarefas
```
/pangeia listar tarefas
/pangeia listar tarefas pendentes
/pangeia listar tarefas em andamento
/pangeia listar tarefas concluídas
```

#### Minhas Tarefas
```
/pangeia minhas tarefas
```

#### Iniciar Tarefa
```
/pangeia iniciar tarefa #5
/pangeia começar tarefa #3
```

#### Concluir Tarefa
```
/pangeia concluir tarefa #5
/pangeia completar tarefa #8
```

#### Ver Detalhes
```
/pangeia detalhes tarefa #5
/pangeia ver tarefa #3
```

#### Atribuir Tarefa
```
/pangeia atribuir tarefa #5 para João
/pangeia assign tarefa #3 para Maria
```

#### Comentar em Tarefa
```
/pangeia comentar tarefa #5 Revisei e aprovei o código
/pangeia comment tarefa #3 Precisa de mais testes
```

#### Definir Prioridade
```
/pangeia prioridade tarefa #5 alta
/pangeia priority tarefa #3 urgente
```

### 👥 Equipe

#### Listar Membros
```
/pangeia membros
/pangeia equipe
```

#### Listar Líderes
```
/pangeia líderes
/pangeia leaders
```

### 📊 Relatórios

#### Relatório da Equipe
```
/pangeia relatório
/pangeia stats
```

#### Tarefas Atrasadas
```
/pangeia atrasadas
/pangeia overdue
```

### ❓ Ajuda

```
/pangeia ajuda
/pangeia help
/pangeia ?
```

## 🌐 API REST

Além do WhatsApp, você pode usar a API REST para integração com outros sistemas.

### Base URL
```
http://seu-servidor:8084/pangeia
```

### Endpoints Principais

#### Equipes

```http
# Criar equipe
POST /pangeia/teams
{
  "name": "Pangeia",
  "description": "Equipe principal"
}

# Listar equipes
GET /pangeia/teams

# Obter equipe
GET /pangeia/teams/:teamId

# Atualizar equipe
PUT /pangeia/teams/:teamId

# Deletar equipe
DELETE /pangeia/teams/:teamId
```

#### Membros

```http
# Adicionar membro
POST /pangeia/teams/:teamId/members
{
  "whatsappJid": "5511999999999@s.whatsapp.net",
  "name": "João Silva",
  "role": "LEADER" | "ASSIGNED"
}

# Listar membros
GET /pangeia/teams/:teamId/members?role=LEADER

# Atualizar membro
PUT /pangeia/members/:memberId

# Remover membro
DELETE /pangeia/members/:memberId
```

#### Tarefas

```http
# Criar tarefa
POST /pangeia/teams/:teamId/tasks
{
  "title": "Revisar código",
  "description": "Revisar PR #123",
  "priority": "HIGH",
  "dueDate": "2025-10-30",
  "creatorId": 1,
  "assignedMemberIds": [2, 3]
}

# Listar tarefas
GET /pangeia/teams/:teamId/tasks?status=PENDING&priority=HIGH

# Obter tarefa
GET /pangeia/tasks/:taskId

# Atualizar tarefa
PUT /pangeia/tasks/:taskId

# Atualizar status
PATCH /pangeia/tasks/:taskId/status
{
  "status": "COMPLETED",
  "changedById": 1,
  "comment": "Tarefa finalizada com sucesso"
}

# Atribuir membros
POST /pangeia/tasks/:taskId/assign
{
  "memberIds": [2, 3]
}

# Adicionar comentário
POST /pangeia/tasks/:taskId/comments
{
  "authorId": 1,
  "content": "Ótimo trabalho!"
}

# Listar comentários
GET /pangeia/tasks/:taskId/comments

# Deletar tarefa
DELETE /pangeia/tasks/:taskId
```

#### Relatórios

```http
# Estatísticas da equipe
GET /pangeia/teams/:teamId/statistics

# Tarefas em atraso
GET /pangeia/teams/:teamId/overdue

# Estatísticas do membro
GET /pangeia/members/:memberId/statistics

# Tarefas do membro
GET /pangeia/members/:memberId/tasks?status=PENDING
```

## 🏗️ Arquitetura

### Estrutura de Pastas

```
src/pangeia/
├── dto/                    # Data Transfer Objects
│   ├── team.dto.ts        # DTOs de equipe e membros
│   └── task.dto.ts        # DTOs de tarefas
├── services/              # Camada de negócios
│   ├── team.service.ts    # Gestão de equipes
│   ├── task.service.ts    # Gestão de tarefas
│   ├── agent.service.ts   # Processador conversacional
│   └── message-handler.service.ts  # Integração WhatsApp
├── controllers/           # Controladores da API
│   └── pangeia.controller.ts
└── routers/              # Rotas da API
    └── pangeia.router.ts
```

### Banco de Dados

#### Modelos Principais

**Team** - Equipes
- id, name, description, active
- Relacionamentos: members[], tasks[]

**TeamMember** - Membros da equipe
- id, whatsappJid, name, role (LEADER/ASSIGNED)
- Relacionamentos: team, assignedTasks[], createdTasks[]

**Task** - Tarefas
- id, title, description, status, priority, dueDate
- Relacionamentos: team, creator, assignments[], comments[]

**TaskAssignment** - Atribuições
- id, taskId, memberId

**TaskComment** - Comentários
- id, content, taskId, authorId

**TaskStatusHistory** - Histórico de status
- id, previousStatus, newStatus, taskId, changedById

### Fluxo de Processamento

1. **Mensagem recebida** no WhatsApp
2. **whatsapp.service.ts** detecta mensagem
3. **PangeiaMessageHandler** verifica se é para o agente
4. **PangeiaAgentService** processa comando via NLP
5. **TeamService/TaskService** executa ação no banco
6. **Resposta enviada** via WhatsApp

## 📱 Exemplos de Uso

### Exemplo 1: Criar e Atribuir Tarefa

**Usuário (Líder):**
```
/pangeia criar tarefa Implementar tela de login
```

**Pangeia:**
```
✅ Tarefa criada com sucesso!

📝 #15 - Implementar tela de login
📊 Status: Pendente
⭐ Prioridade: Média
👤 Criador: João Silva

Para atribuir a alguém, use:
/pangeia atribuir tarefa #15 para [nome]
```

**Usuário:**
```
/pangeia atribuir tarefa #15 para Maria
```

**Pangeia:**
```
✅ Tarefa #15 atribuída a Maria Santos!
```

### Exemplo 2: Acompanhar Progresso

**Usuário:**
```
/pangeia minhas tarefas
```

**Pangeia:**
```
📋 Minhas Tarefas

⏳ #15 - Implementar tela de login
   🟡 MEDIUM 📅 30/10/2025

🚀 #12 - Revisar código do backend
   🔴 URGENT

📊 Resumo
Pendentes: 1 | Em andamento: 1 | Concluídas: 8
```

### Exemplo 3: Relatório da Equipe

**Usuário (Líder):**
```
/pangeia relatório
```

**Pangeia:**
```
📊 Relatório da Equipe Pangeia

📋 Total de tarefas: 45
⏳ Pendentes: 12
🚀 Em andamento: 8
✅ Concluídas: 23
⏸️ Em espera: 1
❌ Canceladas: 1

Gerado em 24/10/2025 15:30
```

### Exemplo 4: Alertas de Atraso

**Usuário (Líder):**
```
/pangeia atrasadas
```

**Pangeia:**
```
⚠️ Tarefas em Atraso

⚠️ #10 - Atualizar documentação
   👤 Pedro Costa | 📅 3 dia(s) em atraso

⚠️ #8 - Corrigir bug de autenticação
   👤 Não atribuída | 📅 5 dia(s) em atraso

Total: 2 tarefa(s)
```

## 🔧 Personalização

### Alterar Nome da Equipe Padrão

No arquivo `src/pangeia/services/agent.service.ts`:

```typescript
private readonly DEFAULT_TEAM_NAME = 'Pangeia'; // Altere aqui
```

### Adicionar Novos Comandos

No método `identifyIntent()` do `agent.service.ts`, adicione novos padrões:

```typescript
{
  pattern: /^seu\s+padrão\s+aqui$/,
  intent: 'seu_intent',
  confidence: 0.9,
  extractor: (match) => ({ /* suas entities */ }),
}
```

E implemente o handler:

```typescript
private async handleSeuIntent(member: any, entities: any): Promise<string> {
  // Sua lógica aqui
  return 'Resposta ao usuário';
}
```

## 🎨 Emojis Usados

- 📋 Tarefas
- ⏳ Pendente
- 🚀 Em progresso
- ✅ Concluída
- ❌ Cancelada
- ⏸️ Em espera
- 🔵 Prioridade Baixa
- 🟡 Prioridade Média
- 🟠 Prioridade Alta
- 🔴 Urgente
- 👑 Líder
- 👤 Encarregado
- 💬 Comentário
- 📊 Estatísticas
- ⚠️ Alerta

## 🐛 Troubleshooting

### Bot não responde

1. Verifique se a mensagem começa com `/pangeia`
2. Confirme que o banco de dados foi migrado
3. Verifique os logs: `tail -f logs/app.log`

### Erro ao criar tarefa

1. Verifique se o membro está cadastrado na equipe
2. Confirme que a equipe Pangeia existe no banco
3. Verifique permissões do banco de dados

### Comandos não são reconhecidos

1. Use exatamente os padrões documentados
2. Verifique se não há caracteres especiais extras
3. Tente o comando de ajuda: `/pangeia ajuda`

## 📝 Licença

Copyright © 2025 Pangeia Team. Todos os direitos reservados.
Licensed under the Apache License, Version 2.0

## 🤝 Contribuindo

Este sistema foi desenvolvido como parte do whatsapp-api. Para contribuir:

1. Fork o repositório
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Consulte a documentação do whatsapp-api
- Use o comando `/pangeia ajuda` no WhatsApp

---

**Desenvolvido com ❤️ pela Equipe Pangeia**
