/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author Pangeia Team                                                         │
 * │ @filename message-handler.service.ts                                         │
 * │ Developed by: Pangeia Task Management System                                 │
 * │ Creation date: Oct 24, 2025                                                  │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @copyright © Pangeia 2025. All rights reserved.                              │
 * │ Handler para integração com mensagens do WhatsApp                            │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { PrismaClient } from '@prisma/client';
import { PangeiaAgentService } from './agent.service';
import { AIConfig } from './ai.service';

export interface IncomingMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message?: any;
  pushName?: string;
  messageTimestamp?: number;
}

export interface SendMessageFunction {
  (to: string, text: string): Promise<any>;
}

export class PangeiaMessageHandler {
  private agentService: PangeiaAgentService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly sendMessage: SendMessageFunction,
    aiConfig?: AIConfig,
  ) {
    this.agentService = new PangeiaAgentService(prisma, aiConfig);
  }

  /**
   * Processa uma mensagem recebida do WhatsApp
   * Retorna true se a mensagem foi processada pelo agente
   */
  async handleIncomingMessage(msg: IncomingMessage): Promise<boolean> {
    try {
      // Ignora mensagens enviadas por nós mesmos
      if (msg.key.fromMe) {
        return false;
      }

      // Extrai o texto da mensagem
      const messageText = this.extractMessageText(msg);
      if (!messageText) {
        return false;
      }

      // Verifica se a mensagem é direcionada ao agente Pangeia
      if (!this.isForPangeia(messageText)) {
        return false;
      }

      // Prepara o contexto da mensagem
      const context = {
        whatsappJid: msg.key.remoteJid,
        senderName: msg.pushName || 'Usuário',
        messageText: messageText,
        isGroup: msg.key.remoteJid.includes('@g.us'),
      };

      // Processa a mensagem através do agente
      const response = await this.agentService.processMessage(context);

      // Se houver resposta, envia de volta
      if (response && response.trim().length > 0) {
        await this.sendMessage(msg.key.remoteJid, response);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao processar mensagem no Pangeia Handler:', error);

      // Tenta enviar mensagem de erro
      try {
        await this.sendMessage(
          msg.key.remoteJid,
          'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        );
      } catch (sendError) {
        console.error('Erro ao enviar mensagem de erro:', sendError);
      }

      return false;
    }
  }

  /**
   * Extrai o texto da mensagem
   */
  private extractMessageText(msg: IncomingMessage): string | null {
    if (!msg.message) {
      return null;
    }

    // Conversation (texto simples)
    if (msg.message.conversation) {
      return msg.message.conversation;
    }

    // Extended text message
    if (msg.message.extendedTextMessage?.text) {
      return msg.message.extendedTextMessage.text;
    }

    // Image with caption
    if (msg.message.imageMessage?.caption) {
      return msg.message.imageMessage.caption;
    }

    // Video with caption
    if (msg.message.videoMessage?.caption) {
      return msg.message.videoMessage.caption;
    }

    return null;
  }

  /**
   * Verifica se a mensagem é direcionada ao agente Pangeia
   */
  private isForPangeia(text: string): boolean {
    const normalizedText = text.toLowerCase().trim();
    const triggers = [
      '/pangeia',
      '@pangeia',
      'pangeia',
      'oi pangeia',
      'olá pangeia',
      'ola pangeia',
    ];

    return triggers.some((trigger) => normalizedText.startsWith(trigger));
  }

  /**
   * Envia notificação proativa para um usuário ou grupo
   */
  async sendProactiveNotification(to: string, message: string): Promise<void> {
    try {
      await this.sendMessage(to, message);
    } catch (error) {
      console.error('Erro ao enviar notificação proativa:', error);
    }
  }

  /**
   * Notifica líderes sobre uma nova tarefa
   */
  async notifyLeadersAboutTask(teamId: number, taskTitle: string): Promise<void> {
    try {
      const teamService = this.agentService['teamService'];
      const leaders = await teamService.getTeamLeaders(teamId);

      for (const leader of leaders) {
        const message = `🔔 *Nova tarefa criada*\n\n📝 ${taskTitle}\n\n_Use "/pangeia listar tarefas" para ver todas as tarefas._`;
        await this.sendMessage(leader.whatsappJid, message);
      }
    } catch (error) {
      console.error('Erro ao notificar líderes:', error);
    }
  }

  /**
   * Envia lembrete de tarefas pendentes
   */
  async sendPendingTasksReminder(memberId: number): Promise<void> {
    try {
      const taskService = this.agentService['taskService'];
      const member = await this.agentService['teamService'].getMemberById(memberId);

      if (!member) {
        return;
      }

      const tasks = await taskService.getMemberTasks(memberId, { status: 'PENDING' as any });

      if (tasks.length === 0) {
        return;
      }

      const message = `🔔 *Lembrete de Tarefas Pendentes*\n\nVocê tem ${tasks.length} tarefa(s) pendente(s).\n\n_Use "/pangeia minhas tarefas" para ver detalhes._`;
      await this.sendMessage(member.whatsappJid, message);
    } catch (error) {
      console.error('Erro ao enviar lembrete de tarefas:', error);
    }
  }
}
