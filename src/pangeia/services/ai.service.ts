/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author Pangeia Team                                                         │
 * │ @filename ai.service.ts                                                      │
 * │ Developed by: Pangeia Task Management System                                 │
 * │ Creation date: Oct 24, 2025                                                  │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @copyright © Pangeia 2025. All rights reserved.                              │
 * │ Serviço de IA Conversacional para o Agente Pangeia                           │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import axios from 'axios';

export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'groq' | 'local';
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface IntentResponse {
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  explanation?: string;
  suggestedResponse?: string;
}

export class AIService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = {
      temperature: 0.7,
      maxTokens: 500,
      ...config,
    };
  }

  /**
   * Identifica a intenção do usuário usando IA
   */
  async identifyIntent(userMessage: string, context?: {
    userName: string;
    isLeader: boolean;
    recentTasks?: string[];
  }): Promise<IntentResponse> {
    const systemPrompt = this.buildIntentSystemPrompt();
    const userPrompt = this.buildIntentUserPrompt(userMessage, context);

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    try {
      const response = await this.chat(messages);
      return this.parseIntentResponse(response);
    } catch (error) {
      console.error('Erro ao identificar intenção com IA:', error);
      // Fallback para resposta padrão
      return {
        intent: 'unknown',
        entities: {},
        confidence: 0,
        explanation: 'Não consegui entender sua mensagem. Tente novamente.',
      };
    }
  }

  /**
   * Gera uma resposta conversacional usando IA
   */
  async generateResponse(
    intent: string,
    entities: Record<string, any>,
    taskResult: any,
    context?: {
      userName: string;
      isLeader: boolean;
    }
  ): Promise<string> {
    const systemPrompt = this.buildResponseSystemPrompt();
    const userPrompt = this.buildResponseUserPrompt(intent, entities, taskResult, context);

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    try {
      return await this.chat(messages);
    } catch (error) {
      console.error('Erro ao gerar resposta com IA:', error);
      return 'Ação realizada com sucesso!';
    }
  }

  /**
   * Chat genérico com IA
   */
  private async chat(messages: Message[]): Promise<string> {
    switch (this.config.provider) {
      case 'openai':
        return await this.chatOpenAI(messages);
      case 'anthropic':
        return await this.chatAnthropic(messages);
      case 'groq':
        return await this.chatGroq(messages);
      case 'local':
        return await this.chatLocal(messages);
      default:
        throw new Error(`Provider não suportado: ${this.config.provider}`);
    }
  }

  /**
   * Chat com OpenAI
   */
  private async chatOpenAI(messages: Message[]): Promise<string> {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: this.config.model || 'gpt-4o-mini',
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  }

  /**
   * Chat com Anthropic Claude
   */
  private async chatAnthropic(messages: Message[]): Promise<string> {
    // Separa system message
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: this.config.model || 'claude-3-5-sonnet-20241022',
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: systemMessage,
        messages: conversationMessages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      },
      {
        headers: {
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.content[0].text.trim();
  }

  /**
   * Chat com Groq (LLaMA, Mixtral, etc)
   */
  private async chatGroq(messages: Message[]): Promise<string> {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: this.config.model || 'llama-3.1-70b-versatile',
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  }

  /**
   * Chat com modelo local (Ollama, LM Studio, etc)
   */
  private async chatLocal(messages: Message[]): Promise<string> {
    const response = await axios.post(
      this.config.apiKey, // URL do servidor local
      {
        model: this.config.model || 'llama3',
        messages,
        stream: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.message.content.trim();
  }

  /**
   * Constrói o prompt de sistema para identificação de intenção
   */
  private buildIntentSystemPrompt(): string {
    return `Você é um assistente especializado em identificar intenções de usuários em um sistema de gestão de tarefas chamado Pangeia.

Seu trabalho é analisar mensagens de usuários e identificar:
1. A INTENÇÃO principal (intent)
2. As ENTIDADES relevantes (entities)
3. O nível de CONFIANÇA (0 a 1)

INTENÇÕES DISPONÍVEIS:
- create_task: Criar uma nova tarefa
- list_tasks: Listar tarefas (com filtros opcionais: pendentes, em andamento, concluídas, todas)
- my_tasks: Ver tarefas do próprio usuário
- task_details: Ver detalhes de uma tarefa específica
- start_task: Iniciar uma tarefa
- complete_task: Marcar tarefa como concluída
- cancel_task: Cancelar uma tarefa
- assign_task: Atribuir tarefa a alguém
- comment_task: Adicionar comentário em tarefa
- set_priority: Definir prioridade (baixa, média, alta, urgente)
- set_due_date: Definir prazo
- list_members: Listar membros da equipe
- list_leaders: Listar líderes
- team_report: Ver estatísticas da equipe
- overdue_tasks: Ver tarefas atrasadas
- help: Pedir ajuda
- greeting: Cumprimentar
- unknown: Intenção não identificada

ENTIDADES POSSÍVEIS:
- taskId: número da tarefa (ex: #5, tarefa 3)
- title: título da nova tarefa
- filter: filtro para listagem (pendentes, em andamento, concluídas, todas)
- assignee: nome da pessoa
- comment: texto do comentário
- priority: prioridade (baixa, média, alta, urgente)
- dueDate: data de prazo
- description: descrição adicional

RESPONDA SEMPRE EM JSON com esta estrutura:
{
  "intent": "nome_da_intencao",
  "entities": { "chave": "valor" },
  "confidence": 0.95,
  "explanation": "Breve explicação do que você entendeu"
}

Seja flexível com a linguagem natural do usuário. Exemplos:
- "preciso criar uma tarefa pra revisar o código" → create_task
- "quais são minhas tarefas?" → my_tasks
- "finaliza a tarefa 5" → complete_task (taskId: 5)
- "o que tem pra fazer?" → list_tasks (filter: "pendentes")`;
  }

  /**
   * Constrói o prompt de usuário para identificação de intenção
   */
  private buildIntentUserPrompt(
    userMessage: string,
    context?: {
      userName: string;
      isLeader: boolean;
      recentTasks?: string[];
    }
  ): string {
    let prompt = `Analise esta mensagem e identifique a intenção:\n\n"${userMessage}"`;

    if (context) {
      prompt += `\n\nCONTEXTO:`;
      prompt += `\n- Usuário: ${context.userName}`;
      prompt += `\n- É líder: ${context.isLeader ? 'Sim' : 'Não'}`;

      if (context.recentTasks && context.recentTasks.length > 0) {
        prompt += `\n- Tarefas recentes: ${context.recentTasks.join(', ')}`;
      }
    }

    prompt += `\n\nResponda APENAS com o JSON, sem texto adicional.`;

    return prompt;
  }

  /**
   * Constrói o prompt de sistema para geração de resposta
   */
  private buildResponseSystemPrompt(): string {
    return `Você é o Pangeia, um assistente amigável e eficiente de gestão de tarefas via WhatsApp.

PERSONALIDADE:
- Profissional mas amigável
- Conciso e direto
- Usa emojis apropriadamente (mas sem exagero)
- Encoraja e motiva a equipe
- Oferece ajuda proativa quando apropriado

REGRAS DE FORMATAÇÃO:
- Use *negrito* para destacar informações importantes
- Use emojis contextuais (✅ sucesso, ⚠️ atenção, 📋 tarefas, etc)
- Seja breve - máximo 200 caracteres para confirmações simples
- Para listas, use formato claro e organizado
- Sempre ofereça próximos passos quando relevante

EXEMPLOS DE BOM TOM:
- "✅ Tarefa criada! Quer que eu atribua a alguém?"
- "📋 Você tem 3 tarefas pendentes. Bora começar pela mais urgente?"
- "🎉 Parabéns! Mais uma tarefa concluída!"
- "⚠️ Opa! Essa tarefa já está atrasada. Precisa de ajuda?"`;
  }

  /**
   * Constrói o prompt de usuário para geração de resposta
   */
  private buildResponseUserPrompt(
    intent: string,
    entities: Record<string, any>,
    taskResult: any,
    context?: {
      userName: string;
      isLeader: boolean;
    }
  ): string {
    let prompt = `Gere uma resposta natural para o usuário baseada nesta ação:\n\n`;
    prompt += `INTENÇÃO: ${intent}\n`;
    prompt += `ENTIDADES: ${JSON.stringify(entities, null, 2)}\n`;
    prompt += `RESULTADO: ${JSON.stringify(taskResult, null, 2)}\n`;

    if (context) {
      prompt += `\nUSUÁRIO: ${context.userName}`;
      prompt += `\nÉ LÍDER: ${context.isLeader ? 'Sim' : 'Não'}`;
    }

    prompt += `\n\nGere uma resposta clara, amigável e útil. Inclua emojis apropriados.`;
    prompt += `\nResponda APENAS com o texto da mensagem, sem formatação JSON.`;

    return prompt;
  }

  /**
   * Faz parse da resposta de intenção
   */
  private parseIntentResponse(response: string): IntentResponse {
    try {
      // Remove possíveis markdown code blocks
      let cleaned = response.trim();
      cleaned = cleaned.replace(/^```json\s*/i, '');
      cleaned = cleaned.replace(/^```\s*/i, '');
      cleaned = cleaned.replace(/\s*```$/i, '');
      cleaned = cleaned.trim();

      const parsed = JSON.parse(cleaned);

      return {
        intent: parsed.intent || 'unknown',
        entities: parsed.entities || {},
        confidence: parsed.confidence || 0.5,
        explanation: parsed.explanation,
        suggestedResponse: parsed.suggestedResponse,
      };
    } catch (error) {
      console.error('Erro ao fazer parse da resposta de IA:', error);
      console.error('Resposta recebida:', response);
      return {
        intent: 'unknown',
        entities: {},
        confidence: 0,
        explanation: 'Erro ao processar resposta',
      };
    }
  }

  /**
   * Valida se a configuração está correta
   */
  static validateConfig(config: AIConfig): boolean {
    if (!config.provider) {
      throw new Error('Provider de IA não configurado');
    }

    if (!config.apiKey) {
      throw new Error('API Key não configurada');
    }

    return true;
  }

  /**
   * Testa a conexão com a IA
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.chat([
        { role: 'user', content: 'Responda apenas "OK" se você estiver funcionando.' }
      ]);

      return response.toLowerCase().includes('ok');
    } catch (error) {
      console.error('Erro ao testar conexão com IA:', error);
      return false;
    }
  }
}
