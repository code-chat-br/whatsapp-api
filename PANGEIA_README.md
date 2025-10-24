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
