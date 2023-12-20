/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename message.model.ts                                                   │
 * │ Developed by: Cleber Wilson                                                  │
 * │ Creation date: Dez 07, 2023                                                  │
 * │ Contact: contato@codechat.dev                                                │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @copyright © Cleber Wilson 2022. All rights reserved.                        │
 * │ Licensed under the Apache License, Version 2.0                               │
 * │                                                                              │
 * │  @license "https://github.com/code-chat-br/whatsapp-api/blob/main/LICENSE"   │
 * │                                                                              │
 * │ You may not use this file except in compliance with the License.             │
 * │ You may obtain a copy of the License at                                      │
 * │                                                                              │
 * │    http://www.apache.org/licenses/LICENSE-2.0                                │
 * │                                                                              │
 * │ Unless required by applicable law or agreed to in writing, software          │
 * │ distributed under the License is distributed on an "AS IS" BASIS,            │
 * │ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     │
 * │                                                                              │
 * │ See the License for the specific language governing permissions and          │
 * │ limitations under the License.                                               │
 * │                                                                              │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { Message, Typebot, TypebotSession } from '@prisma/client';
import { BadRequestException } from '../../exceptions';
import { Repository } from '../../repository/repository.service';
import { Response, ResponseMessage, RichText } from './dto/response';
import { TypebotDto, TypebotUpdateSessionDto } from './dto/typebot.dto';
import { getContentType } from '@whiskeysockets/baileys';
import axios, { AxiosResponse } from 'axios';
import { ConfigService } from '../../config/env.config';
import { Logger } from '../../config/logger.config';
import { isArray } from 'class-validator';

function formatterTextToWa(child: RichText) {
  const formatter = (text: string, f: '' | '*' | '_' = '') => {
    if (text?.endsWith(' ')) {
      text = text.slice(0, -1);
      text = `${f}${text}${f} `;
      return text;
    }

    return `${f}${text}${f}`;
  };

  if (child?.bold) {
    return formatter(child.text, '*');
  }
  if (child?.italic) {
    return formatter(child.text, '_');
  }
  return formatter(child.text);
}

function formatter(data: ResponseMessage[]) {
  let text = '';

  const arrayFormat: ArrayFormat = [];

  for (const item of data) {
    if (item.type === 'text') {
      for (const richText of item.content.richText) {
        if (['p', 'variable'].includes(richText.type)) {
          for (const child of richText.children) {
            if (isArray(child?.children)) {
              const children = child.children;
              for (const child of children) {
                if (child.type === 'p') {
                  for (const c of child.children) {
                    text = text.concat(formatterTextToWa(c));
                  }
                } else {
                  text = text.concat(formatterTextToWa(child));
                }
                const isStyle = child.bold || child.italic;
                if (!isStyle) {
                  text = text.concat('\n');
                }
              }
            }

            text = text.concat(formatterTextToWa(child));
          }

          if (text.endsWith('')) {
            text = text.concat('\n');
          }
        }
      }

      if (text.endsWith('\n')) {
        text = text.slice(0, -1);
      }

      arrayFormat.push({ text: text.replace(/undefined/gm, '') });
      text = '';
      continue;
    }

    if (item.type === 'image' && item.content.url.includes('svg')) {
      continue;
    }

    arrayFormat.push({ [item.type]: item.content.url });
  }

  return arrayFormat;
}

type ArrayFormat = {
  text?: string;
  audio?: string;
  image?: string;
  video?: string;
  embed?: string;
}[];

const typebotCache = new Map<number, Partial<Typebot>>();
const sessionCache = new Map<string, Partial<TypebotSession>>();

export class TypebotService {
  constructor(
    private readonly repository: Repository,
    private readonly configService: ConfigService,
  ) {}

  private readonly logger = new Logger(this.configService, TypebotService.name);

  private readonly select = Object.freeze({
    id: true,
    enabled: true,
    publicId: true,
    typebotUrl: true,
    createdAt: true,
    updatedAt: true,
    Instance: true,
  });

  public async getBotInstance(instanceName: string) {
    try {
      return await this.repository.instance.findUnique({
        where: { name: instanceName },
        select: {
          id: true,
          Typebot: true,
        },
      });
    } catch (error) {
      throw new BadRequestException('Bot instance not found');
    }
  }

  public async createBotInstance(instanceName: string, data: TypebotDto) {
    const find = await this.getBotInstance(instanceName);
    if (find?.Typebot) {
      throw new BadRequestException('Bot instance already exists');
    }

    try {
      const create = await this.repository.typebot.create({
        data: {
          publicId: data.publicId,
          typebotUrl: data.typebotUrl,
          enabled: data.enabled,
          instanceId: find.id,
        },
        select: this.select,
      });

      typebotCache.set(find.id, {
        id: create.id,
        enabled: create.enabled,
        publicId: create.publicId,
        typebotUrl: create.typebotUrl,
      });

      return create;
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException('Bot instance already exists');
    }
  }

  public async updateBotInstance(instanceName: string, data: TypebotDto) {
    const find = await this.getBotInstance(instanceName);
    if (!find?.Typebot) {
      throw new BadRequestException('Bot instance not found');
    }

    const update = await this.repository.typebot.update({
      where: { id: find.Typebot.id },
      data: {
        publicId: data?.publicId,
        typebotUrl: data?.typebotUrl,
        enabled: data?.enabled,
      },
      select: this.select,
    });

    typebotCache.set(find.id, {
      id: update.id,
      enabled: update.enabled,
      publicId: update.publicId,
      typebotUrl: update.typebotUrl,
    });

    return update;
  }

  public async deleteBotInstance(instanceName: string) {
    const find = await this.getBotInstance(instanceName);
    if (!find?.Typebot) {
      throw new BadRequestException('Bot instance not found');
    }

    typebotCache.delete(find.id);

    return await this.repository.typebot.delete({
      where: { id: find.Typebot.id },
      select: this.select,
    });
  }

  public findSessionsRegistered(instanceName: string, data: TypebotUpdateSessionDto) {
    const sessions = this.repository.typebot.findMany({
      where: {
        Instance: { name: instanceName },
        TypebotSession: {
          some: {
            sessionId: data?.sessionId,
            remoteJid: data?.remoteJid,
            status: data?.action,
          },
        },
      },
      select: {
        id: true,
        enabled: true,
        publicId: true,
        typebotUrl: true,
        createdAt: true,
        updatedAt: true,
        Instance: true,
        TypebotSession: {
          select: {
            id: true,
            sessionId: true,
            remoteJid: true,
            status: true,
          },
        },
      },
    });

    if (!sessions) {
      throw new BadRequestException('Sessions not found');
    }

    return sessions;
  }

  public async updateSessionRegistered(
    instanceName: string,
    data: TypebotUpdateSessionDto,
  ) {
    const session = await this.repository.typebotSession.findFirst({
      where: {
        remoteJid: data.remoteJid,
        Typebot: { Instance: { name: instanceName } },
      },
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    const update = await this.repository.typebotSession.update({
      where: { id: session.id },
      data: {
        status: data.action,
      },
      select: {
        id: true,
        sessionId: true,
        remoteJid: true,
        status: true,
        Typebot: true,
      },
    });

    if (!update) {
      throw new BadRequestException('Sessions not found');
    }

    if (data.action === 'closed') {
      sessionCache.delete(`${update.Typebot.id}:${update.remoteJid}`);
    } else {
      sessionCache.set(`${update.Typebot.id}:${update.remoteJid}`, {
        id: update.id,
        remoteJid: update.remoteJid,
        status: update.status,
      });
    }

    return update;
  }

  public async load() {
    const typebots = await this.repository.typebot.findMany({
      where: {
        enabled: true,
      },
      select: {
        id: true,
        enabled: true,
        publicId: true,
        typebotUrl: true,
        instanceId: true,
        TypebotSession: {
          select: {
            id: true,
            sessionId: true,
            remoteJid: true,
            status: true,
          },
        },
      },
    });
    typebots.forEach((typebot) => {
      typebotCache.set(typebot.instanceId, {
        id: typebot.id,
        enabled: typebot.enabled,
        publicId: typebot.publicId,
        typebotUrl: typebot.typebotUrl,
      });
      typebot.TypebotSession.forEach((session) => {
        if (session && session.status !== 'closed')
          sessionCache.set(`${typebot.id}:${session.remoteJid}`, {
            id: session.id,
            remoteJid: session.remoteJid,
            status: session.status,
          });
      });
    });
  }
}

export class TypebotSessionService {
  constructor(
    private readonly repository: Repository,
    private readonly configService: ConfigService,
  ) {}

  private readonly logger = new Logger(this.configService, TypebotSessionService.name);

  public async onMessage(
    newMessage: Message,
    execute: (data: ArrayFormat) => Promise<void>,
  ) {
    if (['audioMessage', 'videoMessage'].includes(newMessage.messageType)) {
      return;
    }

    const typebot = typebotCache.get(newMessage.instanceId);
    const session = sessionCache.get(
      `${newMessage.instanceId}:${newMessage.keyRemoteJid}`,
    );

    if (['pause', 'close'].includes(session?.status)) {
      return;
    }

    const toGroup = newMessage.isGroup && typebot?.enableGroup;

    if (!typebot?.enabled || newMessage.keyFromMe || toGroup) {
      return;
    }

    if (['ephemeralMessage', 'viewOnceMessage'].includes(newMessage.messageType)) {
      newMessage.messageType = getContentType(
        newMessage.content?.['ephemeralMessage']?.message ||
          newMessage.content?.['viewOnceMessage']?.message,
      );

      newMessage.content =
        newMessage.content?.['ephemeralMessage']?.message?.[newMessage.messageType] ||
        newMessage.content?.['viewOnceMessage']?.message?.[newMessage.messageType];
    }

    if (newMessage.messageType === 'extendedTextMessage') {
      newMessage.content = newMessage.content?.['extendedTextMessage']?.text;
    }

    let response: AxiosResponse<Response>;

    try {
      const text = newMessage.content?.['text'] || newMessage.content;

      response = await axios.post<Response>(
        `${typebot.typebotUrl}/api/v1/sessions/${session?.sessionId}/continueChat`,
        { message: text },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      const sessionNotFound =
        error?.response?.data?.message === 'Session not found.' &&
        error?.response?.data?.code === 'NOT_FOUND';
      if (sessionNotFound) {
        const { id, keyRemoteJid, keyId, messageType, pushName, instanceId } = newMessage;

        try {
          response = await axios.post<Response>(
            `${typebot.typebotUrl}/api/v1/typebots/${typebot.publicId}/startChat`,
            {
              isStreamEnabled: true,
              isOnlyRegistering: false,
              prefilledVariables: {
                messageId: id,
                keyRemoteJid,
                keyId,
                messageType,
                pushName,
                instanceId,
              },
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            },
          );

          sessionCache.set(`${newMessage.instanceId}:${newMessage.keyRemoteJid}`, {
            sessionId: response.data.sessionId,
            remoteJid: newMessage.keyRemoteJid,
            status: 'open',
          });
        } catch (error) {
          this.logger.error(error?.response?.data || error);
          return;
        }
      }

      const badRequest = error?.response?.data?.code === 'BAD_REQUEST';
      if (badRequest) {
        this.logger.error(error?.response?.data || error);
        return;
      }
    }

    const data = formatter(response.data.messages);

    await execute(data);

    const sessionId =
      response.data?.sessionId ||
      sessionCache.get(`${newMessage.instanceId}:${newMessage.keyRemoteJid}`)?.sessionId;

    this.repository.typebotSession
      .findFirst({
        where: { sessionId, status: 'open', typebotId: typebot.id },
      })
      .then(async (session) => {
        if (session) {
          await this.repository.typebotSession.updateMany({
            where: { remoteJid: newMessage.keyRemoteJid, typebotId: typebot.id },
            data: { status: 'closed' },
          });
          session = await this.repository.typebotSession.update({
            where: { id: session.id },
            data: { status: 'open', sessionId },
          });
        } else {
          session = await this.repository.typebotSession.create({
            data: {
              sessionId,
              remoteJid: newMessage.keyRemoteJid,
              status: 'open',
              typebotId: typebot.id,
            },
          });
        }

        if (newMessage?.id) {
          this.logger.debug(newMessage);
          try {
            await this.repository.message.update({
              where: { id: newMessage.id },
              data: {
                typebotSessionId: session.id,
              },
            });
          } catch (error) {
            this.logger.error(error);
          }
        }
      });
  }
}
