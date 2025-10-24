/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author Pangeia Team                                                         │
 * │ @filename agent.service.ts                                                   │
 * │ Developed by: Pangeia Task Management System                                 │
 * │ Creation date: Oct 24, 2025                                                  │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @copyright © Pangeia 2025. All rights reserved.                              │
 * │ Agente Conversacional para Gestão de Tarefas via WhatsApp                    │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { PrismaClient } from '@prisma/client';
import { TeamService } from './team.service';
import { TaskService } from './task.service';
import { TaskStatus, TaskPriority } from '../dto/task.dto';
import { AIService, AIConfig } from './ai.service';
import { ConversationContextService } from './conversation-context.service';

interface MessageContext {
  whatsappJid: string; // Quem enviou a mensagem
  senderName: string; // Nome do remetente
  messageText: string; // Texto da mensagem
  isGroup: boolean; // Se é mensagem de grupo
}

interface CommandMatch {
  intent: string; // Intenção identificada
  entities: Record<string, any>; // Entidades extraídas
  confidence: number; // Confiança na interpretação
}

export class PangeiaAgentService {
  private teamService: TeamService;
  private taskService: TaskService;
  private aiService: AIService | null = null;
  private contextService: ConversationContextService;
  private useAI: boolean = false;

  // Equipe padrão Pangeia (será criada automaticamente se não existir)
  private readonly DEFAULT_TEAM_NAME = 'Pangeia';

  constructor(private readonly prisma: PrismaClient, aiConfig?: AIConfig) {
    this.teamService = new TeamService(prisma);
    this.taskService = new TaskService(prisma);
    this.contextService = new ConversationContextService();

    // Inicializa IA se configuração foi fornecida
    if (aiConfig) {
      try {
        AIService.validateConfig(aiConfig);
        this.aiService = new AIService(aiConfig);
        this.useAI = true;
        console.log(`[Pangeia] IA ativada com provider: ${aiConfig.provider}`);
      } catch (error) {
        console.warn('[Pangeia] IA não configurada ou inválida, usando modo regex:', error.message);
        this.useAI = false;
      }
    }
  }

  /**
   * Processa uma mensagem recebida via WhatsApp
   */
  async processMessage(context: MessageContext): Promise<string> {
    try {
      // Garante que o time Pangeia existe
      await this.ensureTeamExists();

      // Normaliza o texto
      const normalizedText = this.normalizeText(context.messageText);

      // Se a mensagem começa com /pangeia ou @pangeia, processa como comando
      if (this.isAddressedToAgent(normalizedText)) {
        const cleanText = this.removeAgentPrefix(normalizedText);
        const response = await this.handleCommand(context, cleanText);

        // Registra interação no contexto
        const member = await this.getOrCreateMember(context);
        this.contextService.addMessage(
          context.whatsappJid,
          context.messageText,
          'processed',
          response
        );

        return response;
      }

      // Se não é direcionado ao agente, ignora
      return '';
    } catch (error) {
      console.error('Erro ao processar mensagem no Pangeia Agent:', error);
      return 'Desculpe, ocorreu um erro ao processar sua mensagem. 😔';
    }
  }

  /**
   * Verifica se a mensagem é direcionada ao agente
   */
  private isAddressedToAgent(text: string): boolean {
    const triggers = ['/pangeia', '@pangeia', 'pangeia', 'oi pangeia', 'olá pangeia'];
    return triggers.some((trigger) => text.startsWith(trigger));
  }

  /**
   * Remove o prefixo do agente da mensagem
   */
  private removeAgentPrefix(text: string): string {
    return text
      .replace(/^\/pangeia\s*/i, '')
      .replace(/^@pangeia\s*/i, '')
      .replace(/^pangeia\s*/i, '')
      .replace(/^(oi|olá)\s+pangeia\s*/i, '')
      .trim();
  }

  /**
   * Normaliza o texto para facilitar o processamento
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' '); // Remove espaços extras
  }

  /**
   * Identifica a intenção e entidades da mensagem
   * Usa IA se disponível, senão usa regex
   */
  private async identifyIntent(text: string, context: MessageContext): Promise<CommandMatch> {
    // Se IA está habilitada, tenta usar primeiro
    if (this.useAI && this.aiService) {
      try {
        const member = await this.getOrCreateMember(context);
        const userContext = this.contextService.getContext(
          context.whatsappJid,
          member.name,
          member.role === 'LEADER'
        );

        const aiResponse = await this.aiService.identifyIntent(text, {
          userName: member.name,
          isLeader: member.role === 'LEADER',
          recentTasks: this.contextService.getRecentTasksFormatted(context.whatsappJid),
        });

        // Se confiança da IA for alta, usa
        if (aiResponse.confidence >= 0.6) {
          console.log(`[Pangeia AI] Intent: ${aiResponse.intent}, Confidence: ${aiResponse.confidence}`);
          return {
            intent: aiResponse.intent,
            entities: aiResponse.entities,
            confidence: aiResponse.confidence,
          };
        } else {
          console.log(`[Pangeia AI] Baixa confiança (${aiResponse.confidence}), usando fallback regex`);
        }
      } catch (error) {
        console.error('[Pangeia AI] Erro ao usar IA, usando fallback regex:', error);
      }
    }

    // Fallback para regex (código original)
    return await this.identifyIntentWithRegex(text, context);
  }

  /**
   * Identifica intenção usando regex patterns (método original)
   */
  private async identifyIntentWithRegex(text: string, context: MessageContext): Promise<CommandMatch> {
    const patterns = [
      // ===== COMANDOS DE AJUDA =====
      {
        pattern: /^(ajuda|help|comandos|menu|\?)$/,
        intent: 'help',
        confidence: 1.0,
      },

      // ===== COMANDOS DE TAREFA =====
      {
        pattern: /^(criar|nova|adicionar|add)\s+(tarefa|task)\s+(.+)$/,
        intent: 'create_task',
        confidence: 0.9,
        extractor: (match: RegExpMatchArray) => ({ title: match[3] }),
      },
      {
        pattern: /^(listar|ver|mostrar|list)\s+(tarefas?|tasks?)(\s+(pendentes?|em\s+andamento|conclu[ií]das?|todas?))?$/,
        intent: 'list_tasks',
        confidence: 0.9,
        extractor: (match: RegExpMatchArray) => ({
          filter: match[4] || 'todas',
        }),
      },
      {
        pattern: /^(minhas\s+tarefas?|meus\s+tasks?)$/,
        intent: 'my_tasks',
        confidence: 1.0,
      },
      {
        pattern: /^(concluir|completar|finalizar)\s+(tarefa|task)\s+#?(\d+)$/,
        intent: 'complete_task',
        confidence: 0.9,
        extractor: (match: RegExpMatchArray) => ({ taskId: parseInt(match[3]) }),
      },
      {
        pattern: /^(iniciar|começar|start)\s+(tarefa|task)\s+#?(\d+)$/,
        intent: 'start_task',
        confidence: 0.9,
        extractor: (match: RegExpMatchArray) => ({ taskId: parseInt(match[3]) }),
      },
      {
        pattern: /^(detalhes?|info|ver)\s+(tarefa|task)\s+#?(\d+)$/,
        intent: 'task_details',
        confidence: 0.9,
        extractor: (match: RegExpMatchArray) => ({ taskId: parseInt(match[3]) }),
      },
      {
        pattern: /^(atribuir|assign)\s+(tarefa|task)\s+#?(\d+)\s+para\s+(.+)$/,
        intent: 'assign_task',
        confidence: 0.8,
        extractor: (match: RegExpMatchArray) => ({
          taskId: parseInt(match[3]),
          assignee: match[4],
        }),
      },
      {
        pattern: /^(comentar|comment)\s+(tarefa|task)\s+#?(\d+)\s+(.+)$/,
        intent: 'comment_task',
        confidence: 0.8,
        extractor: (match: RegExpMatchArray) => ({
          taskId: parseInt(match[3]),
          comment: match[4],
        }),
      },
      {
        pattern: /^(prioridade|priority)\s+(tarefa|task)\s+#?(\d+)\s+(baixa|média|media|alta|urgente|low|medium|high|urgent)$/,
        intent: 'set_priority',
        confidence: 0.9,
        extractor: (match: RegExpMatchArray) => ({
          taskId: parseInt(match[3]),
          priority: match[4],
        }),
      },

      // ===== COMANDOS DE EQUIPE =====
      {
        pattern: /^(membros|equipe|team|quem\s+está\s+na\s+equipe)$/,
        intent: 'list_members',
        confidence: 1.0,
      },
      {
        pattern: /^(l[ií]deres?|leaders?)$/,
        intent: 'list_leaders',
        confidence: 1.0,
      },
      {
        pattern: /^(adicionar|add)\s+(membro|member)\s+(.+)\s+como\s+(l[ií]der|encarregado)$/,
        intent: 'add_member',
        confidence: 0.8,
        extractor: (match: RegExpMatchArray) => ({
          name: match[3],
          role: match[4].toLowerCase().includes('líder') || match[4].toLowerCase().includes('lider') ? 'LEADER' : 'ASSIGNED',
        }),
      },

      // ===== COMANDOS DE RELATÓRIO =====
      {
        pattern: /^(relat[oó]rio|report|estat[ií]sticas?|stats?)$/,
        intent: 'team_report',
        confidence: 1.0,
      },
      {
        pattern: /^(atrasadas?|overdue|em\s+atraso)$/,
        intent: 'overdue_tasks',
        confidence: 1.0,
      },

      // ===== COMANDOS GERAIS =====
      {
        pattern: /^(oi|ol[aá]|hey|hi|hello)$/,
        intent: 'greeting',
        confidence: 1.0,
      },
    ];

    // Tenta encontrar um padrão que corresponda
    for (const { pattern, intent, confidence, extractor } of patterns) {
      const match = text.match(pattern);
      if (match) {
        const entities = extractor ? extractor(match) : {};
        return { intent, entities, confidence };
      }
    }

    // Nenhum padrão encontrado
    return { intent: 'unknown', entities: {}, confidence: 0.0 };
  }

  /**
   * Manipula o comando identificado
   */
  private async handleCommand(context: MessageContext, text: string): Promise<string> {
    const commandMatch = await this.identifyIntent(text, context);

    // Se a confiança for muito baixa, mostra ajuda
    if (commandMatch.confidence < 0.5) {
      return this.getHelpMessage();
    }

    // Obtém ou cria o membro
    const member = await this.getOrCreateMember(context);

    // Executa o comando apropriado
    switch (commandMatch.intent) {
      case 'greeting':
        return this.handleGreeting(member);

      case 'help':
        return this.getHelpMessage();

      case 'create_task':
        return await this.handleCreateTask(member, commandMatch.entities);

      case 'list_tasks':
        return await this.handleListTasks(member, commandMatch.entities);

      case 'my_tasks':
        return await this.handleMyTasks(member);

      case 'complete_task':
        return await this.handleCompleteTask(member, commandMatch.entities);

      case 'start_task':
        return await this.handleStartTask(member, commandMatch.entities);

      case 'task_details':
        return await this.handleTaskDetails(member, commandMatch.entities);

      case 'assign_task':
        return await this.handleAssignTask(member, commandMatch.entities);

      case 'comment_task':
        return await this.handleCommentTask(member, commandMatch.entities);

      case 'set_priority':
        return await this.handleSetPriority(member, commandMatch.entities);

      case 'list_members':
        return await this.handleListMembers(member);

      case 'list_leaders':
        return await this.handleListLeaders(member);

      case 'team_report':
        return await this.handleTeamReport(member);

      case 'overdue_tasks':
        return await this.handleOverdueTasks(member);

      default:
        return this.getHelpMessage();
    }
  }

  // ==================== HANDLERS ====================

  private handleGreeting(member: any): string {
    return `Olá, *${member.name}*! 👋\n\nSou o agente Pangeia, seu assistente de gestão de tarefas.\n\nDigite */pangeia ajuda* para ver os comandos disponíveis.`;
  }

  private getHelpMessage(): string {
    return `🤖 *Agente Pangeia - Comandos Disponíveis*

📋 *TAREFAS*
• *criar tarefa* [título] - Cria nova tarefa
• *listar tarefas* [pendentes/em andamento/concluídas/todas] - Lista tarefas
• *minhas tarefas* - Mostra suas tarefas
• *iniciar tarefa* #[id] - Inicia uma tarefa
• *concluir tarefa* #[id] - Marca tarefa como concluída
• *detalhes tarefa* #[id] - Mostra detalhes da tarefa
• *atribuir tarefa* #[id] para [nome] - Atribui tarefa
• *comentar tarefa* #[id] [texto] - Adiciona comentário
• *prioridade tarefa* #[id] [baixa/média/alta/urgente] - Define prioridade

👥 *EQUIPE*
• *membros* - Lista membros da equipe
• *líderes* - Lista líderes da equipe

📊 *RELATÓRIOS*
• *relatório* - Estatísticas da equipe
• *atrasadas* - Tarefas em atraso

❓ *AJUDA*
• *ajuda* - Mostra esta mensagem

_Para usar, inicie a mensagem com */pangeia* seguido do comando._
_Exemplo: /pangeia criar tarefa Revisar documentação_`;
  }

  private async handleCreateTask(member: any, entities: any): Promise<string> {
    const team = await this.teamService.getTeamByName(this.DEFAULT_TEAM_NAME);
    if (!team) {
      return 'Erro: Equipe Pangeia não encontrada.';
    }

    const task = await this.taskService.createTask(team.id, member.id, {
      title: entities.title,
      priority: TaskPriority.MEDIUM,
    });

    return `✅ *Tarefa criada com sucesso!*

📝 *#${task.id}* - ${task.title}
📊 Status: Pendente
⭐ Prioridade: Média
👤 Criador: ${member.name}

_Para atribuir a alguém, use:_
/pangeia atribuir tarefa #${task.id} para [nome]`;
  }

  private async handleListTasks(member: any, entities: any): Promise<string> {
    const team = await this.teamService.getTeamByName(this.DEFAULT_TEAM_NAME);
    if (!team) {
      return 'Erro: Equipe Pangeia não encontrada.';
    }

    const filter = entities.filter?.toLowerCase();
    let statusFilter: TaskStatus | undefined;

    if (filter?.includes('pendent')) statusFilter = TaskStatus.PENDING;
    else if (filter?.includes('andamento') || filter?.includes('progress')) statusFilter = TaskStatus.IN_PROGRESS;
    else if (filter?.includes('conclu')) statusFilter = TaskStatus.COMPLETED;

    const tasks = await this.taskService.getTeamTasks(team.id, statusFilter ? { status: statusFilter } : undefined);

    if (tasks.length === 0) {
      return '📭 Nenhuma tarefa encontrada.';
    }

    const taskList = tasks
      .slice(0, 20) // Limita a 20 tarefas
      .map((task) => {
        const statusEmoji = this.getStatusEmoji(task.status);
        const priorityEmoji = this.getPriorityEmoji(task.priority);
        const assignees = task.assignments.map((a) => a.member.name).join(', ') || 'Não atribuída';

        return `${statusEmoji} *#${task.id}* - ${task.title}
   ${priorityEmoji} ${task.priority} | 👤 ${assignees}`;
      })
      .join('\n\n');

    return `📋 *Tarefas da Equipe Pangeia*\n\n${taskList}\n\n_Total: ${tasks.length} tarefa(s)_`;
  }

  private async handleMyTasks(member: any): Promise<string> {
    const tasks = await this.taskService.getMemberTasks(member.id);

    if (tasks.length === 0) {
      return '📭 Você não tem tarefas atribuídas no momento.';
    }

    const taskList = tasks.map((task) => {
      const statusEmoji = this.getStatusEmoji(task.status);
      const priorityEmoji = this.getPriorityEmoji(task.priority);
      const dueDate = task.dueDate ? `📅 ${new Date(task.dueDate).toLocaleDateString('pt-BR')}` : '';

      return `${statusEmoji} *#${task.id}* - ${task.title}
   ${priorityEmoji} ${task.priority} ${dueDate}`;
    }).join('\n\n');

    const stats = await this.taskService.getMemberStatistics(member.id);

    return `📋 *Minhas Tarefas*\n\n${taskList}\n\n📊 *Resumo*\nPendentes: ${stats.pending} | Em andamento: ${stats.inProgress} | Concluídas: ${stats.completed}`;
  }

  private async handleCompleteTask(member: any, entities: any): Promise<string> {
    const taskId = entities.taskId;
    const task = await this.taskService.getTaskById(taskId);

    if (!task) {
      return `❌ Tarefa #${taskId} não encontrada.`;
    }

    await this.taskService.updateTaskStatus(taskId, TaskStatus.COMPLETED, member.id, 'Concluída via WhatsApp');

    return `✅ *Tarefa #${taskId} concluída!*\n\n📝 ${task.title}\n👏 Parabéns pelo trabalho!`;
  }

  private async handleStartTask(member: any, entities: any): Promise<string> {
    const taskId = entities.taskId;
    const task = await this.taskService.getTaskById(taskId);

    if (!task) {
      return `❌ Tarefa #${taskId} não encontrada.`;
    }

    await this.taskService.updateTaskStatus(taskId, TaskStatus.IN_PROGRESS, member.id, 'Iniciada via WhatsApp');

    return `🚀 *Tarefa #${taskId} iniciada!*\n\n📝 ${task.title}\n💪 Boa sorte!`;
  }

  private async handleTaskDetails(member: any, entities: any): Promise<string> {
    const taskId = entities.taskId;
    const task = await this.taskService.getTaskById(taskId);

    if (!task) {
      return `❌ Tarefa #${taskId} não encontrada.`;
    }

    const statusEmoji = this.getStatusEmoji(task.status);
    const priorityEmoji = this.getPriorityEmoji(task.priority);
    const assignees = task.assignments.map((a) => a.member.name).join(', ') || 'Não atribuída';
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : 'Não definido';
    const comments = task.comments.length;

    return `📋 *Detalhes da Tarefa #${taskId}*

📝 *Título:* ${task.title}
${statusEmoji} *Status:* ${task.status}
${priorityEmoji} *Prioridade:* ${task.priority}
👤 *Atribuída a:* ${assignees}
📅 *Prazo:* ${dueDate}
👨‍💼 *Criador:* ${task.creator.name}
💬 *Comentários:* ${comments}

${task.description ? `📄 *Descrição:*\n${task.description}` : ''}`;
  }

  private async handleAssignTask(member: any, entities: any): Promise<string> {
    const taskId = entities.taskId;
    const assigneeName = entities.assignee;

    const team = await this.teamService.getTeamByName(this.DEFAULT_TEAM_NAME);
    if (!team) return 'Erro: Equipe não encontrada.';

    // Busca membro pelo nome (busca parcial)
    const members = await this.teamService.getTeamMembers(team.id);
    const targetMember = members.find((m) => m.name.toLowerCase().includes(assigneeName.toLowerCase()));

    if (!targetMember) {
      return `❌ Membro "${assigneeName}" não encontrado na equipe.`;
    }

    await this.taskService.assignMembers(taskId, [targetMember.id]);

    return `✅ *Tarefa #${taskId} atribuída a ${targetMember.name}!*`;
  }

  private async handleCommentTask(member: any, entities: any): Promise<string> {
    const taskId = entities.taskId;
    const comment = entities.comment;

    await this.taskService.addComment(taskId, member.id, { content: comment });

    return `💬 *Comentário adicionado à tarefa #${taskId}!*`;
  }

  private async handleSetPriority(member: any, entities: any): Promise<string> {
    const taskId = entities.taskId;
    const priority = this.mapPriority(entities.priority);

    await this.taskService.updateTask(taskId, { priority });

    return `⭐ *Prioridade da tarefa #${taskId} alterada para ${priority}!*`;
  }

  private async handleListMembers(member: any): Promise<string> {
    const team = await this.teamService.getTeamByName(this.DEFAULT_TEAM_NAME);
    if (!team) return 'Erro: Equipe não encontrada.';

    const members = await this.teamService.getTeamMembers(team.id);

    const memberList = members
      .map((m) => {
        const roleEmoji = m.role === 'LEADER' ? '👑' : '👤';
        return `${roleEmoji} *${m.name}* - ${m.role === 'LEADER' ? 'Líder' : 'Encarregado'}`;
      })
      .join('\n');

    return `👥 *Membros da Equipe Pangeia*\n\n${memberList}\n\n_Total: ${members.length} membro(s)_`;
  }

  private async handleListLeaders(member: any): Promise<string> {
    const team = await this.teamService.getTeamByName(this.DEFAULT_TEAM_NAME);
    if (!team) return 'Erro: Equipe não encontrada.';

    const leaders = await this.teamService.getTeamLeaders(team.id);

    if (leaders.length === 0) {
      return '👑 Nenhum líder cadastrado na equipe.';
    }

    const leaderList = leaders.map((l) => `👑 *${l.name}*`).join('\n');

    return `👑 *Líderes da Equipe Pangeia*\n\n${leaderList}`;
  }

  private async handleTeamReport(member: any): Promise<string> {
    const team = await this.teamService.getTeamByName(this.DEFAULT_TEAM_NAME);
    if (!team) return 'Erro: Equipe não encontrada.';

    const stats = await this.taskService.getTeamStatistics(team.id);

    return `📊 *Relatório da Equipe Pangeia*

📋 *Total de tarefas:* ${stats.total}
⏳ *Pendentes:* ${stats.pending}
🚀 *Em andamento:* ${stats.inProgress}
✅ *Concluídas:* ${stats.completed}
⏸️ *Em espera:* ${stats.onHold}
❌ *Canceladas:* ${stats.cancelled}

_Gerado em ${new Date().toLocaleString('pt-BR')}_`;
  }

  private async handleOverdueTasks(member: any): Promise<string> {
    const team = await this.teamService.getTeamByName(this.DEFAULT_TEAM_NAME);
    if (!team) return 'Erro: Equipe não encontrada.';

    const overdueTasks = await this.taskService.getOverdueTasks(team.id);

    if (overdueTasks.length === 0) {
      return '✅ Nenhuma tarefa em atraso! Parabéns! 🎉';
    }

    const taskList = overdueTasks
      .map((task) => {
        const assignees = task.assignments.map((a) => a.member.name).join(', ') || 'Não atribuída';
        const daysOverdue = Math.floor((new Date().getTime() - new Date(task.dueDate!).getTime()) / (1000 * 60 * 60 * 24));

        return `⚠️ *#${task.id}* - ${task.title}
   👤 ${assignees} | 📅 ${daysOverdue} dia(s) em atraso`;
      })
      .join('\n\n');

    return `⚠️ *Tarefas em Atraso*\n\n${taskList}\n\n_Total: ${overdueTasks.length} tarefa(s)_`;
  }

  // ==================== UTILITY METHODS ====================

  private async ensureTeamExists() {
    let team = await this.teamService.getTeamByName(this.DEFAULT_TEAM_NAME);

    if (!team) {
      team = await this.teamService.createTeam({
        name: this.DEFAULT_TEAM_NAME,
        description: 'Equipe Pangeia - Gestão de Tarefas',
        active: true,
      });
    }

    return team;
  }

  private async getOrCreateMember(context: MessageContext) {
    const team = await this.teamService.getTeamByName(this.DEFAULT_TEAM_NAME);
    if (!team) {
      throw new Error('Equipe Pangeia não encontrada');
    }

    let member = await this.teamService.getMemberByWhatsAppJid(team.id, context.whatsappJid);

    if (!member) {
      // Cria automaticamente como encarregado
      member = await this.teamService.addMember(team.id, {
        whatsappJid: context.whatsappJid,
        name: context.senderName,
        role: 'ASSIGNED' as any,
        active: true,
      });
    }

    return member;
  }

  private getStatusEmoji(status: string): string {
    const emojis: Record<string, string> = {
      PENDING: '⏳',
      IN_PROGRESS: '🚀',
      COMPLETED: '✅',
      CANCELLED: '❌',
      ON_HOLD: '⏸️',
    };
    return emojis[status] || '📋';
  }

  private getPriorityEmoji(priority: string): string {
    const emojis: Record<string, string> = {
      LOW: '🔵',
      MEDIUM: '🟡',
      HIGH: '🟠',
      URGENT: '🔴',
    };
    return emojis[priority] || '⭐';
  }

  private mapPriority(priority: string): TaskPriority {
    const map: Record<string, TaskPriority> = {
      baixa: TaskPriority.LOW,
      low: TaskPriority.LOW,
      média: TaskPriority.MEDIUM,
      media: TaskPriority.MEDIUM,
      medium: TaskPriority.MEDIUM,
      alta: TaskPriority.HIGH,
      high: TaskPriority.HIGH,
      urgente: TaskPriority.URGENT,
      urgent: TaskPriority.URGENT,
    };
    return map[priority.toLowerCase()] || TaskPriority.MEDIUM;
  }
}
