/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author Pangeia Team                                                         │
 * │ @filename conversation-context.service.ts                                    │
 * │ Developed by: Pangeia Task Management System                                 │
 * │ Creation date: Oct 24, 2025                                                  │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @copyright © Pangeia 2025. All rights reserved.                              │
 * │ Gerenciamento de contexto e memória de conversação                           │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

export interface ConversationMessage {
  timestamp: Date;
  userMessage: string;
  intent: string;
  botResponse: string;
}

export interface UserContext {
  whatsappJid: string;
  userName: string;
  isLeader: boolean;
  conversationHistory: ConversationMessage[];
  lastInteraction: Date;
  recentTaskIds: number[];
  currentContext?: {
    waitingFor?: string; // Ex: "task_title", "assignee_name"
    relatedTaskId?: number;
    partialData?: Record<string, any>;
  };
}

/**
 * Serviço de gerenciamento de contexto de conversação
 * Mantém histórico e estado das conversas com cada usuário
 */
export class ConversationContextService {
  private contexts: Map<string, UserContext>;
  private readonly MAX_HISTORY = 10; // Últimas 10 mensagens
  private readonly CONTEXT_TIMEOUT = 5 * 60 * 1000; // 5 minutos

  constructor() {
    this.contexts = new Map();

    // Limpa contextos antigos a cada 10 minutos
    setInterval(() => this.cleanOldContexts(), 10 * 60 * 1000);
  }

  /**
   * Obtém ou cria contexto para um usuário
   */
  getContext(whatsappJid: string, userName: string, isLeader: boolean): UserContext {
    let context = this.contexts.get(whatsappJid);

    if (!context) {
      context = {
        whatsappJid,
        userName,
        isLeader,
        conversationHistory: [],
        lastInteraction: new Date(),
        recentTaskIds: [],
      };
      this.contexts.set(whatsappJid, context);
    } else {
      // Atualiza timestamp
      context.lastInteraction = new Date();
    }

    return context;
  }

  /**
   * Adiciona uma mensagem ao histórico
   */
  addMessage(
    whatsappJid: string,
    userMessage: string,
    intent: string,
    botResponse: string
  ): void {
    const context = this.contexts.get(whatsappJid);
    if (!context) return;

    context.conversationHistory.push({
      timestamp: new Date(),
      userMessage,
      intent,
      botResponse,
    });

    // Mantém apenas as últimas N mensagens
    if (context.conversationHistory.length > this.MAX_HISTORY) {
      context.conversationHistory = context.conversationHistory.slice(-this.MAX_HISTORY);
    }

    context.lastInteraction = new Date();
  }

  /**
   * Adiciona ID de tarefa às tarefas recentes
   */
  addRecentTask(whatsappJid: string, taskId: number): void {
    const context = this.contexts.get(whatsappJid);
    if (!context) return;

    // Adiciona no início da lista
    context.recentTaskIds.unshift(taskId);

    // Mantém apenas as últimas 5 tarefas
    if (context.recentTaskIds.length > 5) {
      context.recentTaskIds = context.recentTaskIds.slice(0, 5);
    }
  }

  /**
   * Define estado de espera (ex: aguardando nome de pessoa para atribuir)
   */
  setWaitingFor(
    whatsappJid: string,
    waitingFor: string,
    relatedTaskId?: number,
    partialData?: Record<string, any>
  ): void {
    const context = this.contexts.get(whatsappJid);
    if (!context) return;

    context.currentContext = {
      waitingFor,
      relatedTaskId,
      partialData: partialData || {},
    };
  }

  /**
   * Limpa estado de espera
   */
  clearWaitingState(whatsappJid: string): void {
    const context = this.contexts.get(whatsappJid);
    if (!context) return;

    context.currentContext = undefined;
  }

  /**
   * Obtém histórico recente formatado para IA
   */
  getHistoryForAI(whatsappJid: string, limit: number = 3): string {
    const context = this.contexts.get(whatsappJid);
    if (!context || context.conversationHistory.length === 0) {
      return 'Sem histórico recente.';
    }

    const recent = context.conversationHistory.slice(-limit);

    return recent
      .map((msg, idx) => {
        return `${idx + 1}. Usuário: "${msg.userMessage}" → Intent: ${msg.intent}`;
      })
      .join('\n');
  }

  /**
   * Obtém tarefas recentes formatadas
   */
  getRecentTasksFormatted(whatsappJid: string): string[] {
    const context = this.contexts.get(whatsappJid);
    if (!context || context.recentTaskIds.length === 0) {
      return [];
    }

    return context.recentTaskIds.map(id => `#${id}`);
  }

  /**
   * Verifica se há contexto ativo (usuário está no meio de algo)
   */
  hasActiveContext(whatsappJid: string): boolean {
    const context = this.contexts.get(whatsappJid);
    if (!context) return false;

    return !!context.currentContext?.waitingFor;
  }

  /**
   * Obtém contexto atual
   */
  getCurrentContext(whatsappJid: string): UserContext['currentContext'] | undefined {
    const context = this.contexts.get(whatsappJid);
    return context?.currentContext;
  }

  /**
   * Limpa contextos antigos (não usados há mais de X minutos)
   */
  private cleanOldContexts(): void {
    const now = new Date().getTime();

    for (const [jid, context] of this.contexts.entries()) {
      const timeSinceLastInteraction = now - context.lastInteraction.getTime();

      if (timeSinceLastInteraction > this.CONTEXT_TIMEOUT) {
        this.contexts.delete(jid);
      }
    }
  }

  /**
   * Reseta todo o contexto de um usuário
   */
  resetContext(whatsappJid: string): void {
    this.contexts.delete(whatsappJid);
  }

  /**
   * Obtém resumo do contexto para debug/logs
   */
  getContextSummary(whatsappJid: string): string {
    const context = this.contexts.get(whatsappJid);
    if (!context) return 'Sem contexto';

    return `User: ${context.userName}, Messages: ${context.conversationHistory.length}, Recent Tasks: [${context.recentTaskIds.join(', ')}], Active: ${!!context.currentContext}`;
  }

  /**
   * Obtém estatísticas gerais
   */
  getStats(): {
    totalUsers: number;
    activeContexts: number;
    totalMessages: number;
  } {
    let totalMessages = 0;
    let activeContexts = 0;

    for (const context of this.contexts.values()) {
      totalMessages += context.conversationHistory.length;
      if (context.currentContext?.waitingFor) {
        activeContexts++;
      }
    }

    return {
      totalUsers: this.contexts.size,
      activeContexts,
      totalMessages,
    };
  }
}
