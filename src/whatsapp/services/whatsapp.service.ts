/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename whatsapp.service.ts                                                │
 * │ Developed by: Cleber Wilson                                                  │
 * │ Creation date: Nov 27, 2022                                                  │
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
 * │ @class                                                                       │
 * │ @constructs WAStartupService                                                 │
 * │ @param {ConfigService} configService                                         │
 * | @param {EventEmitter2} eventEmitter                                          │
 * │ @param {RepositoryBroker} repository                                         │
 * │ @param {RedisCache} cache                                                    │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import makeWASocket, {
  AnyMessageContent,
  BufferedEventData,
  CacheStore,
  Chat,
  ConnectionState,
  Contact,
  delay,
  DisconnectReason,
  downloadMediaMessage,
  fetchLatestBaileysVersion,
  generateWAMessageFromContent,
  getContentType,
  getDevice,
  GroupMetadata,
  isJidGroup,
  isJidUser,
  makeCacheableSignalKeyStore,
  MessageUpsertType,
  ParticipantAction,
  prepareWAMessageMedia,
  proto,
  useMultiFileAuthState,
  UserFacingSocketConfig,
  WABrowserDescription,
  WAConnectionState,
  WAMediaUpload,
  WAMessageUpdate,
  WASocket,
} from '@whiskeysockets/baileys/';
import {
  ConfigService,
  ConfigSessionPhone,
  Database,
  GlobalWebhook,
  QrCode,
  Redis,
} from '../../config/env.config';
import { Logger } from '../../config/logger.config';
import { INSTANCE_DIR } from '../../config/path.config';
import { readFileSync } from 'fs';
import { join } from 'path';
import axios, { AxiosError } from 'axios';
import { v4 } from 'uuid';
import qrcode, { QRCodeToDataURLOptions } from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';
import { Boom } from '@hapi/boom';
import EventEmitter2 from 'eventemitter2';
import { release } from 'os';
import P from 'pino';
import {
  AudioMessageFileDto,
  ContactMessage,
  MediaFileDto,
  MediaMessage,
  Options,
  SendAudioDto,
  SendContactDto,
  SendLocationDto,
  SendMediaDto,
  SendReactionDto,
  SendTextDto,
} from '../dto/sendMessage.dto';
import { isBase64, isNotEmpty, isURL } from 'class-validator';
import {
  ArchiveChatDto,
  DeleteMessage,
  OnWhatsAppDto,
  ReadMessageDto,
  ReadMessageIdDto,
  UpdatePresenceDto,
  WhatsAppNumberDto,
} from '../dto/chat.dto';
import { BadRequestException, InternalServerErrorException } from '../../exceptions';
import {
  CreateGroupDto,
  GroupJid,
  GroupPictureDto,
  GroupUpdateParticipantDto,
} from '../dto/group.dto';
import Long from 'long';
import NodeCache from 'node-cache';
import {
  AuthState,
  AuthStateRedis,
} from '../../utils/use-multi-file-auth-state-redis-db';
import mime from 'mime-types';
import { Instance, Webhook } from '@prisma/client';
import { WebhookEvents, WebhookEventsEnum, WebhookEventsType } from '../dto/webhook.dto';
import { Query, Repository } from '../../repository/repository.service';
import PrismType from '@prisma/client';
import * as s3Service from '../../integrations/minio/minio.utils';
import { RedisCache } from '../../cache/redis';
import { TypebotSessionService } from '../../integrations/typebot/typebot.service';

type InstanceQrCode = {
  count: number;
  code?: string;
  base64?: string;
};

type InstanceStateConnection = {
  state: 'open' | 'close' | 'refused' | WAConnectionState;
  statusReason?: number;
};

export class WAStartupService {
  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly repository: Repository,
    private readonly redisCache: RedisCache,
  ) {
    this.authStateRedis = new AuthStateRedis(this.configService, this.redisCache);
  }

  private readonly logger = new Logger(this.configService, WAStartupService.name);
  private readonly instance: Partial<Instance> = {};
  private readonly webhook: Partial<Webhook> & { events?: WebhookEvents } = {};
  private readonly msgRetryCounterCache: CacheStore = new NodeCache();
  private readonly userDevicesCache: CacheStore = new NodeCache();
  private readonly instanceQr: InstanceQrCode = { count: 0 };
  private readonly stateConnection: InstanceStateConnection = { state: 'close' };
  private readonly typebotSession = new TypebotSessionService(
    this.repository,
    this.configService,
  );
  private readonly databaseOptions: Database =
    this.configService.get<Database>('DATABASE');

  private endSession = false;
  public client: WASocket;
  private authState: Partial<AuthState> = {};
  private authStateRedis: AuthStateRedis;

  public async setInstanceName(name: string) {
    const i = await this.repository.instance.findUnique({
      where: { name },
    });

    Object.assign(this.instance, i);
    this.sendDataWebhook('statusInstance', {
      instance: this.instance.name,
      status: 'loaded',
    });

    this.logger.subContext(`${i.id}:${i.name}`);
  }

  public get instanceName() {
    return this.instance.name;
  }

  public get ownerJid() {
    return this.instance.ownerJid;
  }

  public get profilePictureUrl() {
    return this.instance.profilePicUrl;
  }

  public get qrCode(): Partial<InstanceQrCode> {
    return this.instanceQr;
  }

  public async loadWebhook() {
    const data = await this.repository.webhook.findFirst({
      where: { instanceId: this.instance.id },
    });
    this.webhook.url = data?.url;
    this.webhook.enabled = data?.enabled;
    this.webhook.events = data?.events;
  }

  public async setWebhook(data: typeof this.webhook) {
    const find = await this.repository.webhook.findUnique({
      where: { instanceId: this.instance.id },
    });

    let update: typeof this.webhook;

    if (find) {
      update = await this.repository.updateWebhook(this.instance.id, data);
    } else {
      update = await this.repository.webhook.create({
        data: {
          url: data.url,
          enabled: data.enabled,
          events: data?.events,
          instanceId: this.instance.id,
        },
        select: {
          id: true,
          url: true,
          enabled: true,
          events: true,
          instanceId: true,
        },
      });
    }
    Object.assign(this.webhook, update);

    return update;
  }

  public async findWebhook() {
    return await this.repository.webhook.findUnique({
      where: { instanceId: this.instance.id },
    });
  }

  private async sendDataWebhook<T = any>(event: WebhookEventsType, data: T) {
    const eventDesc = WebhookEventsEnum[event];

    try {
      if (
        this.webhook?.enabled &&
        isURL(this.webhook?.url, { protocols: ['http', 'https'] })
      ) {
        if (this.webhook?.events && this.webhook?.events[event]) {
          await axios.post(
            this.webhook.url,
            {
              event: eventDesc,
              instance: this.instance,
              data,
            },
            { headers: { 'Resource-Owner': this.instance.ownerJid } },
          );
        }
        if (!this.webhook?.events) {
          await axios.post(
            this.webhook.url,
            {
              event: eventDesc,
              instance: this.instance,
              data,
            },
            { headers: { 'Resource-Owner': this.instance.ownerJid } },
          );
        }
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      const records = this.logger.error({
        local: 'sendDataWebhook-local',
        message: axiosError?.message,
        hostName: error?.hostname,
        code: axiosError?.code,
        headers: JSON.stringify(axiosError?.request?.headers || {}),
        data: JSON.stringify(axiosError?.response?.data || {}),
        stack: error?.stack,
        name: error?.name,
      });
      this.repository.createLogs(this.instance.name, {
        content: records,
        type: 'error',
        context: WAStartupService.name,
        description: 'Error on send data to webhook',
      });
    }

    try {
      const globalWebhook = this.configService.get<GlobalWebhook>('GLOBAL_WEBHOOK');
      if (globalWebhook?.ENABLED && isURL(globalWebhook.URL)) {
        await axios.post(
          globalWebhook.URL,
          {
            event: eventDesc,
            instance: this.instance,
            data,
          },
          { headers: { 'Resource-owner': this.instance.ownerJid } },
        );
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      const records = this.logger.error({
        local: 'sendDataWebhook-global',
        message: axiosError?.message,
        hostName: error?.hostname,
        code: axiosError?.code,
        headers: JSON.stringify(axiosError?.request?.headers || {}),
        data: JSON.stringify(axiosError?.response?.data || {}),
        stack: error?.stack,
        name: error?.name,
      });
      this.repository.createLogs(this.instance.name, {
        content: records,
        type: 'error',
        context: WAStartupService.name,
        description: 'Error on send data to webhook',
      });
    }
  }

  private async connectionUpdate({
    qr,
    connection,
    lastDisconnect,
  }: Partial<ConnectionState>) {
    if (qr) {
      if (this.qrCode === this.configService.get<QrCode>('QRCODE').LIMIT) {
        this.sendDataWebhook('qrcodeUpdated', {
          message: 'QR code limit reached, please login again',
          statusCode: DisconnectReason.badSession,
        });

        this.stateConnection.state = 'refused';
        this.stateConnection.statusReason = DisconnectReason.connectionClosed;

        this.sendDataWebhook('connectionUpdated', {
          instance: this.instance.name,
          ...this.stateConnection,
        });

        this.sendDataWebhook('statusInstance', {
          instance: this.instance.name,
          status: 'removed',
        });

        this.endSession = true;

        return this.eventEmitter.emit('no.connection', this.instance);
      }

      this.instanceQr.count++;

      const optsQrcode: QRCodeToDataURLOptions = {
        margin: 3,
        scale: 4,
        errorCorrectionLevel: 'H',
        color: { light: '#ffffff', dark: '#198754' },
      };

      qrcode.toDataURL(qr, optsQrcode, (error, base64) => {
        if (error) {
          this.logger.error('Qrcode generate failed:' + error.toString());
          return;
        }

        this.instanceQr.base64 = base64;
        this.instanceQr.code = qr;

        this.sendDataWebhook('qrcodeUpdated', {
          qrcode: { instance: this.instance.name, code: qr, base64 },
        });
      });

      qrcodeTerminal.generate(qr, { small: true }, (qrcode) =>
        this.logger.log(
          `\n{ instance: ${this.instance.name}, qrcodeCount: ${this.instanceQr.count} }\n` +
            qrcode,
        ),
      );
    }

    if (connection) {
      this.stateConnection.state = connection;
      this.stateConnection.statusReason =
        (lastDisconnect?.error as Boom)?.output?.statusCode ?? 200;
      this.sendDataWebhook('connectionUpdated', {
        instance: this.instance.name,
        ...this.stateConnection,
      });
    }

    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        await this.connectToWhatsapp();
      } else {
        this.sendDataWebhook('statusInstance', {
          instance: this.instance.name,
          status: 'removed',
        });
        this.eventEmitter.emit('remove.instance', this.instance, 'inner');
        this.client?.ws?.close();
        this.client.end(new Error('Close connection'));
      }
    }

    if (connection === 'open') {
      this.instance.ownerJid = this.client.user.id.replace(/:\d+/, '');
      this.instance.profilePicUrl = (
        await this.profilePicture(this.instance.ownerJid)
      ).profilePictureUrl;
      this.instance.connectionStatus = 'ONLINE';

      this.repository.instance
        .update({
          where: { id: this.instance.id },
          data: {
            ownerJid: this.instance.ownerJid,
            profilePicUrl: this.instance.profilePicUrl,
            connectionStatus: this.instance.connectionStatus,
          },
        })
        .catch((err) => this.logger.error(err));

      this.logger.info(
        `
        ┌──────────────────────────────┐
        │    CONNECTED TO WHATSAPP     │
        └──────────────────────────────┘`.replace(/^ +/gm, '  '),
      );
    }
  }

  private async getMessage(key: PrismType.Message, full = false) {
    try {
      const message = await this.repository.message.findFirst({
        where: {
          instanceId: this.instance.id,
          keyId: key.keyId,
        },
      });
      const webMessageInfo: Partial<proto.WebMessageInfo> = {
        key: {
          id: message.keyId,
          remoteJid: message.keyRemoteJid,
          fromMe: message.keyFromMe,
        },
        message: {
          [message.messageType]: message.content,
        },
      };
      if (full) {
        return webMessageInfo;
      }
      return webMessageInfo.message;
    } catch (error) {
      return { conversation: '' };
    }
  }

  private async defineAuthState() {
    const redis = this.configService.get<Redis>('REDIS');

    if (redis?.ENABLED) {
      return await this.authStateRedis.authStateRedisDb(
        `${this.instance.id}:${this.instance.name}`,
      );
    }

    return await useMultiFileAuthState(join(INSTANCE_DIR, this.instance.name));
  }

  private async setSocket() {
    this.endSession = false;

    this.authState = (await this.defineAuthState()) as AuthState;

    const { version } = await fetchLatestBaileysVersion();
    const session = this.configService.get<ConfigSessionPhone>('CONFIG_SESSION_PHONE');
    const browser: WABrowserDescription = [session.CLIENT, session.NAME, release()];

    const { EXPIRATION_TIME } = this.configService.get<QrCode>('QRCODE');
    const CONNECTION_TIMEOUT = this.configService.get<number>('CONNECTION_TIMEOUT');

    const socketConfig: UserFacingSocketConfig = {
      auth: {
        creds: this.authState.state.creds,
        keys: makeCacheableSignalKeyStore(
          this.authState.state.keys,
          P({ level: 'silent' }) as any,
        ),
      },
      logger: P({ level: 'silent' }) as any,
      printQRInTerminal: false,
      browser,
      version,
      connectTimeoutMs: CONNECTION_TIMEOUT * 1000,
      qrTimeout: EXPIRATION_TIME * 1000,
      emitOwnEvents: true,
      msgRetryCounterCache: this.msgRetryCounterCache,
      getMessage: this.getMessage as any,
      generateHighQualityLinkPreview: true,
      syncFullHistory: true,
      userDevicesCache: this.userDevicesCache,
      transactionOpts: { maxCommitRetries: 1, delayBetweenTriesMs: 10 },
    };

    return makeWASocket(socketConfig);
  }

  public async reloadConnection(): Promise<WASocket> {
    try {
      this.client = await this.setSocket();
      return this.client;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error?.toString());
    }
  }

  public async connectToWhatsapp(): Promise<WASocket> {
    try {
      this.loadWebhook();
      this.client = await this.setSocket();
      this.eventHandler();

      return this.client;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error?.toString());
    }
  }

  private readonly chatHandle = {
    'chats.upsert': async (chats: Chat[]) => {
      const chatsRepository = await this.repository.chat.findMany({
        where: {
          instanceId: this.instance.id,
        },
      });

      const chatsRaw: PrismType.Chat[] = [];
      for await (const chat of chats) {
        if (chatsRepository.find((cr) => cr.remoteJid === chat.id)) {
          continue;
        }

        chatsRaw.push({
          remoteJid: chat.id,
          instanceId: this.instance.id,
        } as PrismType.Chat);
      }

      await this.sendDataWebhook('chatsUpsert', chatsRaw);
      await this.repository.chat.createMany({
        data: chatsRaw,
      });
    },

    'chats.update': async (
      chats: Partial<
        proto.IConversation & {
          lastMessageRecvTimestamp?: number;
        } & {
          conditional: (bufferedData: BufferedEventData) => boolean;
        }
      >[],
    ) => {
      const chatsRaw: PrismType.Chat[] = chats.map((chat) => {
        return { remoteJid: chat.id, instanceId: this.instance.id } as PrismType.Chat;
      });
      await this.sendDataWebhook('chatsUpdated', chatsRaw);
    },

    'chats.delete': async (chats: string[]) => {
      await this.sendDataWebhook('chatsDeleted', [...chats]);
      for await (const chat of chats) {
        const c = await this.repository.chat.findFirst({
          where: {
            remoteJid: chat,
          },
        });
        await this.repository.chat.delete({
          where: {
            id: c.id,
          },
        });
      }
    },
  };

  private readonly contactHandle = {
    'contacts.upsert': async (contacts: Contact[]) => {
      const contactsRepository = await this.repository.contact.findMany({
        where: { instanceId: this.instance.id },
      });

      const contactsRaw: PrismType.Contact[] = [];
      for await (const contact of contacts) {
        if (contactsRepository.find((cr) => cr.remoteJid === contact.id)) {
          continue;
        }

        contactsRaw.push({
          remoteJid: contact.id,
          pushName: contact?.name || contact?.verifiedName,
          profilePicUrl: (await this.profilePicture(contact.id)).profilePictureUrl,
          instanceId: this.instance.id,
        } as unknown as PrismType.Contact);
      }
      await this.sendDataWebhook('contactsUpsert', contactsRaw);
      await this.repository.contact.createMany({
        data: contactsRaw,
      });
    },

    'contacts.update': async (contacts: Partial<Contact>[]) => {
      const contactsRaw: PrismType.Contact[] = [];
      for await (const contact of contacts) {
        contactsRaw.push({
          remoteJid: contact.id,
          pushName: contact?.name ?? contact?.verifiedName,
          profilePicUrl: (await this.profilePicture(contact.id)).profilePictureUrl,
          instanceId: this.instance.id,
        } as unknown as PrismType.Contact);
      }
      await this.repository.contact.createMany({
        data: contactsRaw,
      });
    },
  };

  private async syncMessage(messages: PrismType.Message[]) {
    const messagesRepository = await this.repository.message.findMany({
      where: { instanceId: this.instance.id },
    });

    for await (const message of messages) {
      if (messagesRepository.find((mr) => mr.keyId === message.keyId)) {
        continue;
      }

      await this.repository.message.create({
        data: message,
      });
    }
  }

  private readonly messageHandle = {
    'messaging-history.set': async ({
      messages,
      chats,
      isLatest,
    }: {
      chats: Chat[];
      contacts: Contact[];
      messages: proto.IWebMessageInfo[];
      isLatest: boolean;
    }) => {
      if (isLatest) {
        const chatsRaw: PrismType.Chat[] = chats.map((chat) => {
          return {
            remoteJid: chat.id,
            instanceId: this.instance.id,
          } as PrismType.Chat;
        });
        await this.sendDataWebhook('chatsSet', chatsRaw);
        await this.repository.chat.createMany({ data: chatsRaw });
      }

      const messagesRaw: PrismType.Message[] = [];
      for await (const [, m] of Object.entries(messages)) {
        if (
          m.message?.protocolMessage ||
          m.message?.senderKeyDistributionMessage ||
          !m.message
        ) {
          continue;
        }

        if (Long.isLong(m?.messageTimestamp)) {
          m.messageTimestamp = m.messageTimestamp?.toNumber();
        }

        const messageType = getContentType(m.message);

        if (!messageType) {
          continue;
        }

        messagesRaw.push({
          keyId: m.key.id,
          keyRemoteJid: m.key.remoteJid,
          keyFromMe: m.key.fromMe,
          pushName: m?.pushName,
          keyParticipant: m.participant,
          messageType,
          content: m.message[messageType] as PrismType.Prisma.JsonValue,
          messageTimestamp: m.messageTimestamp as number,
          instanceId: this.instance.id,
          device: getDevice(m.key.id),
        } as PrismType.Message);
      }

      this.sendDataWebhook('messagesSet', [...messagesRaw]);

      if (this.databaseOptions.DB_OPTIONS.SYNC_MESSAGES) {
        await this.syncMessage(messagesRaw);
      }

      messages = undefined;
    },

    'messages.upsert': async ({
      messages,
      type,
    }: {
      messages: proto.IWebMessageInfo[];
      type: MessageUpsertType;
    }) => {
      for (const received of messages) {
        if (
          type !== 'notify' ||
          !received?.message ||
          received.message?.protocolMessage ||
          received.message.senderKeyDistributionMessage
        ) {
          return;
        }

        this.client.sendPresenceUpdate('unavailable');

        if (Long.isLong(received.messageTimestamp)) {
          received.messageTimestamp = received.messageTimestamp?.toNumber();
        }

        const messageType = getContentType(received.message);

        const messageRaw = {
          keyId: received.key.id,
          keyRemoteJid: received.key.remoteJid,
          keyFromMe: received.key.fromMe,
          pushName: received.pushName,
          keyParticipant: received.participant,
          messageType,
          content: received.message[messageType] as PrismType.Prisma.JsonValue,
          messageTimestamp: received.messageTimestamp as number,
          instanceId: this.instance.id,
          device: getDevice(received.key.id),
          isGroup: isJidGroup(received.key.remoteJid),
        } as PrismType.Message;

        if (this.databaseOptions.DB_OPTIONS.NEW_MESSAGE) {
          const { id } = await this.repository.message.create({ data: messageRaw });
          messageRaw.id = id;
        }

        this.logger.log(messageRaw);

        await this.sendDataWebhook('messagesUpsert', messageRaw);

        if (s3Service.BUCKET?.ENABLE) {
          try {
            const media = await this.getMediaMessage(messageRaw, true);
            if (media) {
              const { stream, mediaType, fileName } = media;
              const { id, name } = this.instance;
              const mimetype = mime.lookup(fileName).toString();
              const fullName = join(
                `${id}_${name}`,
                messageRaw.keyRemoteJid,
                mediaType,
                fileName,
              );
              await s3Service.uploadFile(fullName, stream, {
                'Content-Type': mimetype,
                'custom-header-fromMe': String(!!received.key?.fromMe),
                'custom-header-keyRemoteJid': received.key.remoteJid,
                'custom-header-pushName': received?.pushName,
                'custom-header-mediaType': mediaType,
                'custom-header-messageId': messageRaw.keyId,
              });

              await this.repository.media.create({
                data: {
                  messageId: messageRaw.id,
                  type: mediaType,
                  fileName: fullName,
                  mimetype,
                },
              });
            }
          } catch (error) {
            this.logger.error([
              'Error on upload file to s3',
              error?.message,
              error?.stack,
            ]);
            this.repository.createLogs(this.instance.name, {
              content: [error?.toString(), JSON.stringify(error?.stack)],
              type: 'error',
              context: WAStartupService.name,
              description: 'Error on upload file to s3',
            });
          }
        }

        this.typebotSession.onMessage(messageRaw, async (items) => {
          for await (const item of items) {
            if (item?.text) {
              await this.textMessage({
                number: messageRaw.keyRemoteJid,
                textMessage: { text: item.text },
                options: { delay: 1200, presence: 'composing' },
              });
              continue;
            }

            if (item?.video || item?.embed) {
              const url = item?.video || item?.embed;
              const head = await (async () => {
                try {
                  return await axios.head(url);
                } catch (error) {
                  return {
                    headers: {
                      'content-type': 'text/html; charset=utf-8',
                    },
                  };
                }
              })();

              const ext = mime.extension(head.headers['content-type']);
              if (ext && ext.includes('html')) {
                await this.textMessage({
                  number: messageRaw.keyRemoteJid,
                  textMessage: { text: url },
                  options: { delay: 1200, presence: 'composing' },
                });
                continue;
              }

              await this.mediaMessage({
                number: messageRaw.keyRemoteJid,
                mediaMessage: {
                  mediatype: 'document',
                  media: url,
                },
                options: { delay: 1200, presence: 'composing' },
              });
              continue;
            }

            if (item?.image) {
              await this.mediaMessage({
                number: messageRaw.keyRemoteJid,
                mediaMessage: {
                  mediatype: 'image',
                  fileName: 'image.jpg',
                  media: item.image,
                },
                options: { delay: 1200, presence: 'composing' },
              });
              continue;
            }

            if (item?.audio) {
              const head = await axios.head(item.audio);

              if (head.headers['content-type'].includes('audio/ogg')) {
                await this.audioWhatsapp({
                  number: messageRaw.keyRemoteJid,
                  audioMessage: {
                    audio: item.audio,
                  },
                  options: { delay: 1200, presence: 'recording' },
                });
                continue;
              }

              await this.mediaMessage({
                number: messageRaw.keyRemoteJid,
                mediaMessage: {
                  mediatype: 'audio',
                  media: item.audio,
                },
                options: { delay: 1200, presence: 'composing' },
              });
              continue;
            }
          }
        });
      }
    },

    'messages.update': async (args: WAMessageUpdate[]) => {
      const status = {
        0: 'ERROR',
        1: 'PENDING',
        2: 'SERVER_ACK',
        3: 'DELIVERY_ACK',
        4: 'READ',
        5: 'PLAYED',
      };
      for await (const { key, update } of args) {
        if (key.remoteJid !== 'status@broadcast' && !key?.remoteJid?.match(/(:\d+)/)) {
          const message = {
            ...key,
            status: status[update.status],
            dateTime: new Date(),
            instanceId: this.instance.id,
          };
          await this.sendDataWebhook('messagesUpdated', message);
          if (this.databaseOptions.DB_OPTIONS.MESSAGE_UPDATE) {
            this.repository.message
              .findFirst({
                where: {
                  instanceId: this.instance.id,
                  keyId: key.id,
                },
              })
              .then(async (result) => {
                if (result) {
                  await this.repository.messageUpdate.create({
                    data: {
                      messageId: result.id,
                      status: status[update?.status || 3],
                      dateTime: new Date(),
                    },
                  });
                }
              })
              .catch((error) => this.logger.error(error));
          }
        }
      }
    },
  };

  private readonly groupHandler = {
    'groups.upsert': (groupMetadata: GroupMetadata[]) => {
      this.sendDataWebhook('groupsUpsert', groupMetadata);
    },

    'groups.update': (groupMetadataUpdate: Partial<GroupMetadata>[]) => {
      this.sendDataWebhook('groupsUpdated', groupMetadataUpdate);
    },

    'group-participants.update': (participantsUpdate: {
      id: string;
      participants: string[];
      action: ParticipantAction;
    }) => {
      this.sendDataWebhook('groupsParticipantsUpdated', participantsUpdate);
    },
  };

  private eventHandler() {
    this.client.ev.process((events) => {
      if (!this.endSession) {
        const database = this.configService.get<Database>('DATABASE');

        if (events['connection.update']) {
          this.connectionUpdate(events['connection.update']);
        }

        if (events['creds.update']) {
          this.authState.saveCreds();
        }

        if (events['messaging-history.set']) {
          const payload = events['messaging-history.set'];
          this.messageHandle['messaging-history.set'](payload);
        }

        if (events['messages.upsert']) {
          const payload = events['messages.upsert'];
          this.messageHandle['messages.upsert'](payload);
        }

        if (events['messages.update']) {
          const payload = events['messages.update'];
          this.messageHandle['messages.update'](payload);
        }

        if (events['presence.update']) {
          const payload = events['presence.update'];
          this.sendDataWebhook('presenceUpdated', payload);
        }

        if (events['groups.upsert']) {
          const payload = events['groups.upsert'];
          this.groupHandler['groups.upsert'](payload);
        }

        if (events['groups.update']) {
          const payload = events['groups.update'];
          this.groupHandler['groups.update'](payload);
        }

        if (events['group-participants.update']) {
          const payload = events['group-participants.update'];
          this.groupHandler['group-participants.update'](payload);
        }

        if (events['chats.upsert']) {
          const payload = events['chats.upsert'];
          this.chatHandle['chats.upsert'](payload);
        }

        if (events['chats.update']) {
          const payload = events['chats.update'];
          this.chatHandle['chats.update'](payload);
        }

        if (events['chats.delete']) {
          const payload = events['chats.delete'];
          this.chatHandle['chats.delete'](payload);
        }

        if (events['contacts.upsert']) {
          const payload = events['contacts.upsert'];
          this.contactHandle['contacts.upsert'](payload);
        }

        if (events['contacts.update']) {
          const payload = events['contacts.update'];
          this.contactHandle['contacts.update'](payload);
        }
      }
    });
  }

  // Check if the number is MX or AR
  private formatMXOrARNumber(jid: string): string {
    const regexp = new RegExp(/^(\d{2})(\d{2})\d{1}(\d{8})$/);
    if (regexp.test(jid)) {
      const match = regexp.exec(jid);
      if (match && (match[1] === '52' || match[1] === '54')) {
        const joker = Number.parseInt(match[3][0]);
        const ddd = Number.parseInt(match[2]);
        if (joker < 7 || ddd < 11) {
          return match[0];
        }
        return match[1] === '52' ? '52' + match[3] : '54' + match[3];
      }
    }
    return jid;
  }

  // Check if the number is br
  private formatBRNumber(jid: string) {
    const regexp = new RegExp(/^(\d{2})(\d{2})\d{1}(\d{8})$/);
    if (regexp.test(jid)) {
      const match = regexp.exec(jid);
      if (match && match[1] === '55') {
        const joker = Number.parseInt(match[3][0]);
        const ddd = Number.parseInt(match[2]);
        if (joker < 7 || ddd < 31) {
          return match[0];
        }
        return match[1] + match[2] + match[3];
      }
    } else {
      return jid;
    }
  }

  private createJid(number: string): string {
    if (number.includes('@g.us') || number.includes('@s.whatsapp.net')) {
      return number;
    }

    const formattedBRNumber = this.formatBRNumber(number);
    if (formattedBRNumber !== number) {
      return `${formattedBRNumber}@s.whatsapp.net`;
    }

    const formattedMXARNumber = this.formatMXOrARNumber(number);
    if (formattedMXARNumber !== number) {
      return `${formattedMXARNumber}@s.whatsapp.net`;
    }

    if (number.includes('-')) {
      return `${number}@g.us`;
    }

    return `${number}@s.whatsapp.net`;
  }

  public async profilePicture(number: string) {
    const jid = this.createJid(number);
    try {
      return {
        wuid: jid,
        profilePictureUrl: await this.client.profilePictureUrl(jid, 'image'),
      };
    } catch (error) {
      return {
        wuid: jid,
        profilePictureUrl: null,
      };
    }
  }

  public async updatePresence(data: UpdatePresenceDto) {
    const jid = this.createJid(data.number);
    const isWA = (await this.whatsappNumber({ numbers: [jid] }))[0];
    if (!isWA.exists && !isJidGroup(isWA.jid)) {
      throw new BadRequestException(isWA);
    }

    const recipient = isJidGroup(jid) ? jid : isWA.jid;

    if (isJidGroup(recipient)) {
      try {
        await this.client.groupMetadata(recipient);
      } catch (error) {
        throw new BadRequestException('Group not found');
      }
    }

    await this.client.presenceSubscribe(recipient);
    await this.client.sendPresenceUpdate(data.presence, recipient);

    return { message: 'success' };
  }

  private async sendMessageWithTyping<T = proto.IMessage>(
    number: string,
    message: T,
    options?: Options,
  ) {
    let quoted: PrismType.Message;
    if (options?.quotedMessageId) {
      if (!this.databaseOptions?.DB_OPTIONS?.NEW_MESSAGE) {
        throw new BadRequestException(
          'The DATABASE_SAVE_DATA_NEW_MESSAGE environment variable is disabled',
        );
      }

      quoted = await this.repository.message.findUnique({
        where: { id: options.quotedMessageId },
      });

      if (!quoted) {
        throw new BadRequestException('Quoted message not found');
      }
    }

    const jid = this.createJid(number);
    const isWA = (await this.whatsappNumber({ numbers: [jid] }))[0];
    if (!isWA.exists && !isJidGroup(isWA.jid)) {
      throw new BadRequestException(isWA);
    }

    const recipient = isJidGroup(jid) ? jid : isWA.jid;

    if (isJidGroup(recipient)) {
      try {
        await this.client.groupMetadata(recipient);
      } catch (error) {
        throw new BadRequestException('Group not found');
      }
    }

    try {
      if (options?.delay) {
        await this.client.presenceSubscribe(recipient);
        await this.client.sendPresenceUpdate(options?.presence ?? 'composing', jid);
        await delay(options.delay);
        await this.client.sendPresenceUpdate('paused', recipient);
      }

      const messageSent: PrismType.Message = await (async () => {
        let m: proto.IWebMessageInfo;
        let q: proto.IWebMessageInfo;
        if (quoted) {
          q = {
            key: {
              remoteJid: quoted.keyRemoteJid,
              fromMe: quoted.keyFromMe,
              id: quoted.keyId,
            },
            message: {
              [quoted.messageType]: quoted.content,
            },
          };
        }
        if (!message['audio']) {
          m = await this.client.sendMessage(
            recipient,
            {
              forward: {
                key: { remoteJid: this.instance.ownerJid, fromMe: true },
                message,
              },
            },
            { quoted: q },
          );
        } else {
          m = await this.client.sendMessage(
            recipient,
            message as unknown as AnyMessageContent,
            { quoted: q },
          );
        }

        return {
          id: undefined,
          keyId: m.key.id,
          keyFromMe: m.key.fromMe,
          keyRemoteJid: m.key.remoteJid,
          keyParticipant: m?.participant,
          pushName: m?.pushName,
          messageType: getContentType(m.message),
          content: m.message[getContentType(m.message)] as PrismType.Prisma.JsonValue,
          messageTimestamp: (() => {
            if (Long.isLong(m.messageTimestamp)) {
              return m.messageTimestamp.toNumber();
            }
            return m.messageTimestamp as number;
          })(),
          instanceId: this.instance.id,
          device: getDevice(m.key.id),
          isGroup: isJidGroup(m.key.remoteJid),
          typebotSessionId: undefined,
        };
      })();
      if (this.databaseOptions.DB_OPTIONS.NEW_MESSAGE) {
        const { id } = await this.repository.message.create({
          data: messageSent,
        });
        messageSent.id = id;
      }

      this.sendDataWebhook('sendMessage', messageSent).catch((error) =>
        this.logger.error(error),
      );

      return messageSent;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(error.toString());
    }
  }

  // Instance Controller
  public get connectionStatus() {
    return this.stateConnection;
  }

  // Send Message Controller
  public async textMessage(data: SendTextDto) {
    return await this.sendMessageWithTyping(
      data.number,
      {
        extendedTextMessage: {
          text: data.textMessage.text,
        },
      },
      data?.options,
    );
  }

  private async prepareMediaMessage(mediaMessage: MediaMessage) {
    try {
      const prepareMedia = await prepareWAMessageMedia(
        {
          [mediaMessage.mediatype]: isURL(mediaMessage.media as string)
            ? { url: mediaMessage.media }
            : (mediaMessage.media as Buffer),
        } as any,
        { upload: this.client.waUploadToServer },
      );

      const mediaType = mediaMessage.mediatype + 'Message';

      if (mediaMessage.mediatype === 'document' && !mediaMessage.fileName) {
        const regex = new RegExp(/.*\/(.+?)\./);
        const arrayMatch = regex.exec(mediaMessage.media as string);
        mediaMessage.fileName = arrayMatch[1];
      }

      let mimetype: string | boolean;

      if (typeof mediaMessage.media === 'string' && isURL(mediaMessage.media)) {
        mimetype = mime.lookup(mediaMessage.media);
        if (!mimetype) {
          const head = await axios.head(mediaMessage.media as string);
          mimetype = head.headers['content-type'];
        }
      } else {
        mimetype = mime.lookup(mediaMessage.fileName);
      }

      prepareMedia[mediaType].caption = mediaMessage?.caption;
      prepareMedia[mediaType].mimetype = mimetype;
      prepareMedia[mediaType].fileName = mediaMessage.fileName;

      if (mediaMessage.mediatype === 'video') {
        prepareMedia[mediaType].jpegThumbnail = Uint8Array.from(
          readFileSync(join(process.cwd(), 'public', 'images', 'video-cover.png')),
        );
        prepareMedia[mediaType].gifPlayback = false;
      }

      return generateWAMessageFromContent(
        '',
        { [mediaType]: { ...prepareMedia[mediaType] } },
        { userJid: this.instance.ownerJid },
      );
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error?.toString() || error);
    }
  }

  public async mediaMessage(data: SendMediaDto) {
    const generate = await this.prepareMediaMessage(data.mediaMessage);

    return await this.sendMessageWithTyping(
      data.number,
      { ...generate.message },
      data?.options,
    );
  }

  public async mediaFileMessage(data: MediaFileDto, file: Express.Multer.File) {
    const generate = await this.prepareMediaMessage({
      fileName: file.originalname,
      media: file.buffer,
      mediatype: data.mediatype,
      caption: data?.caption,
    });

    return await this.sendMessageWithTyping(
      data.number,
      { ...generate.message },
      {
        presence: isNotEmpty(data?.presence) ? data.presence : undefined,
        delay: data?.delay,
      },
    );
  }

  public async audioWhatsapp(data: SendAudioDto) {
    return this.sendMessageWithTyping<AnyMessageContent>(
      data.number,
      {
        audio: isURL(data.audioMessage.audio)
          ? { url: data.audioMessage.audio }
          : Buffer.from(data.audioMessage.audio, 'base64'),
        ptt: true,
        mimetype: 'audio/aac',
      },
      { presence: 'recording', delay: data?.options?.delay },
    );
  }

  public async audioWhatsAppFile(data: AudioMessageFileDto, file: Express.Multer.File) {
    return this.sendMessageWithTyping<AnyMessageContent>(
      data.number,
      {
        audio: file.buffer,
        ptt: true,
        mimetype: 'audio/aac',
      },
      { presence: 'recording', delay: data?.delay },
    );
  }

  public async locationMessage(data: SendLocationDto) {
    return await this.sendMessageWithTyping(
      data.number,
      {
        locationMessage: {
          degreesLatitude: data.locationMessage.latitude,
          degreesLongitude: data.locationMessage.longitude,
          name: data.locationMessage?.name,
          address: data.locationMessage?.address,
        },
      },
      data?.options,
    );
  }

  public async contactMessage(data: SendContactDto) {
    const message: proto.IMessage = {};

    const vcard = (contact: ContactMessage) => {
      return (
        'BEGIN:VCARD\n' +
        'VERSION:3.0\n' +
        'FN:' +
        contact.fullName +
        '\n' +
        'item1.TEL;waid=' +
        contact.wuid +
        ':' +
        contact.phoneNumber +
        '\n' +
        'item1.X-ABLabel:Celular\n' +
        'END:VCARD'
      );
    };

    if (data.contactMessage.length === 1) {
      message.contactMessage = {
        displayName: data.contactMessage[0].fullName,
        vcard: vcard(data.contactMessage[0]),
      };
    } else {
      message.contactsArrayMessage = {
        displayName: `${data.contactMessage.length} contacts`,
        contacts: data.contactMessage.map((contact) => {
          return {
            displayName: contact.fullName,
            vcard: vcard(contact),
          };
        }),
      };
    }

    return await this.sendMessageWithTyping(data.number, { ...message }, data?.options);
  }

  public async reactionMessage(data: SendReactionDto) {
    return await this.sendMessageWithTyping(data.reactionMessage.key.remoteJid, {
      reactionMessage: {
        key: data.reactionMessage.key,
        text: data.reactionMessage.reaction,
      },
    });
  }

  // Chat Controller
  public async whatsappNumber(data: WhatsAppNumberDto) {
    const onWhatsapp: OnWhatsAppDto[] = [];
    for await (const number of data.numbers) {
      const jid = this.createJid(number);
      if (isJidGroup(jid)) {
        const group = await this.findGroup({ groupJid: jid }, 'inner');
        onWhatsapp.push(new OnWhatsAppDto(group.id, !!group?.id, group?.subject));
      } else if (jid.includes('@broadcast')) {
        onWhatsapp.push(new OnWhatsAppDto(jid, true));
      } else {
        try {
          const result = (await this.client.onWhatsApp(jid))[0];
          onWhatsapp.push(new OnWhatsAppDto(result.jid, result.exists));
        } catch (error) {
          onWhatsapp.push(new OnWhatsAppDto(number, false));
        }
      }
    }

    return onWhatsapp;
  }

  /**
   * @deprecated
   */
  public async markMessageAsRead(data: ReadMessageDto) {
    try {
      const keys: proto.IMessageKey[] = [];
      data.readMessages.forEach((read) => {
        if (isJidGroup(read.remoteJid) || isJidUser(read.remoteJid)) {
          keys.push({
            remoteJid: read.remoteJid,
            fromMe: read.fromMe,
            id: read.id,
          });
        }
      });
      await this.client.readMessages(keys);
      return { message: 'Read messages', read: 'success' };
    } catch (error) {
      throw new InternalServerErrorException('Read messages fail', error.toString());
    }
  }

  public async readMessages(data: ReadMessageIdDto) {
    const keys: proto.IMessageKey[] = [];
    try {
      const messages = await this.repository.message.findMany({
        where: { id: { in: data.messageId } },
        select: {
          keyFromMe: true,
          keyId: true,
          keyRemoteJid: true,
          keyParticipant: true,
        },
      });

      for (const message of messages) {
        keys.push({
          remoteJid: message.keyRemoteJid,
          fromMe: message.keyFromMe,
          id: message.keyId,
          participant: message?.keyParticipant,
        });
      }
      await this.client.readMessages(keys);
      return { message: 'Read messages', read: 'success' };
    } catch (error) {
      throw new InternalServerErrorException('Read messages fail', error.toString());
    }
  }

  public async archiveChat(data: ArchiveChatDto) {
    try {
      data.lastMessage.messageTimestamp =
        data.lastMessage?.messageTimestamp ?? Date.now();
      await this.client.chatModify(
        {
          archive: data.archive,
          lastMessages: [data.lastMessage],
        },
        data.lastMessage.key.remoteJid,
      );

      return {
        chatId: data.lastMessage.key.remoteJid,
        archived: true,
      };
    } catch (error) {
      throw new InternalServerErrorException({
        archived: false,
        message: [
          'An error occurred while archiving the chat. Open a calling.',
          error.toString(),
        ],
      });
    }
  }

  public async deleteMessage(del: DeleteMessage) {
    try {
      const id = Number.parseInt(del.id);
      const message = await this.repository.message.findUnique({
        where: { id },
      });
      return await this.client.sendMessage(message.keyRemoteJid, {
        delete: {
          id: message.keyId,
          fromMe: message.keyFromMe,
          participant: message?.keyParticipant,
          remoteJid: message.keyRemoteJid,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Error while deleting message for everyone',
        error?.toString(),
      );
    }
  }

  public async getMediaMessage(m: PrismType.Message, inner = false) {
    const MessageSubtype = [
      'ephemeralMessage',
      'documentWithCaptionMessage',
      'viewOnceMessage',
      'viewOnceMessageV2',
    ];
    const TypeMediaMessage = [
      'imageMessage',
      'documentMessage',
      'audioMessage',
      'videoMessage',
      'stickerMessage',
    ];

    try {
      const msg: proto.IWebMessageInfo = m?.content
        ? {
            key: {
              id: m.keyId,
              fromMe: m.keyFromMe,
              remoteJid: m.keyRemoteJid,
            },
            message: {
              [m.messageType]: m.content,
            },
          }
        : ((await this.getMessage(m, true)) as proto.IWebMessageInfo);

      for (const subtype of MessageSubtype) {
        if (msg.message[subtype]) {
          msg.message = msg.message[subtype].message;
        }
      }

      let mediaMessage: any;
      let mediaType: string;

      for (const type of TypeMediaMessage) {
        mediaMessage = msg.message[type];
        if (mediaMessage) {
          mediaType = type;
          break;
        }
      }

      if (!mediaMessage) {
        if (inner) {
          return;
        }
        throw 'The message is not of the media type';
      }

      if (typeof mediaMessage['mediaKey'] === 'object') {
        msg.message = JSON.parse(JSON.stringify(msg.message));
      }

      const stream = await downloadMediaMessage(
        { key: msg?.key, message: msg?.message },
        'stream',
        {},
        {
          logger: P({ level: 'silent' }) as any,
          reuploadRequest: this.client.updateMediaMessage,
        },
      );

      const ext = mime.extension(mediaMessage?.['mimetype']);

      const fileName =
        mediaMessage?.['fileName'] || `${msg.key.id}.${ext}` || `${v4()}.${ext}`;

      return {
        mediaType,
        fileName,
        caption: mediaMessage?.['caption'],
        size: {
          fileLength: mediaMessage?.['fileLength'],
          height: mediaMessage?.['height'],
          width: mediaMessage?.['width'],
        },
        mimetype: mediaMessage?.['mimetype'],
        stream,
      };
    } catch (error) {
      this.logger.error(error);
      this.repository.activityLogs
        .create({
          data: {
            type: 'error',
            context: WAStartupService.name,
            description: 'Error on get media message',
            content: [error?.toString(), JSON.stringify(error?.stack)],
            instanceId: this.instance.id,
          },
        })
        .catch((error) => this.logger.error(error));
      if (inner) {
        return;
      }
      throw new BadRequestException(error.toString());
    }
  }

  async getMediaUrl(messageId: number, expiry: number) {
    if (!s3Service.BUCKET?.ENABLE) {
      throw new BadRequestException('S3 is not enabled');
    }

    const media = await this.repository.media.findFirst({
      where: { messageId },
    });

    const mediaUrl = await s3Service.getObjectUrl(media.fileName, expiry);

    return { mediaUrl };
  }

  public async fetchContacts(query: Query<PrismType.Contact>) {
    return await this.repository.contact.findMany({
      where: {
        instanceId: this.instance.id,
        remoteJid: query.where?.remoteJid,
      },
    });
  }

  public async fetchMessages(query: Query<PrismType.Message>) {
    const count = await this.repository.message.count({
      where: {
        instanceId: this.instance.id,
        id: query?.where?.id,
        keyId: query?.where?.keyId,
        keyFromMe: query?.where?.keyFromMe,
        keyRemoteJid: query.where?.keyRemoteJid,
        device: query?.where?.device,
        messageType: query?.where?.messageType,
      },
    });

    if (!query?.offset) {
      query.offset = 50;
    }

    if (!query?.page) {
      query.page = 1;
    }

    const messages = await this.repository.message.findMany({
      where: {
        instanceId: this.instance.id,
        id: query?.where?.id,
        keyId: query?.where?.keyId,
        keyFromMe: query?.where?.keyFromMe,
        keyRemoteJid: query.where?.keyRemoteJid,
        device: query?.where?.device,
        messageType: query?.where?.messageType,
      },
      orderBy: {
        messageTimestamp: 'desc',
      },
      skip: query.offset * (query?.page === 1 ? 0 : (query?.page as number) - 1),
      take: query.offset,
      select: {
        id: true,
        keyId: true,
        keyFromMe: true,
        keyRemoteJid: true,
        keyParticipant: true,
        pushName: true,
        messageType: true,
        content: true,
        messageTimestamp: true,
        instanceId: true,
        device: true,
        MessageUpdate: {
          select: {
            status: true,
            dateTime: true,
          },
        },
      },
    });

    return {
      messages: {
        total: count,
        pages: Math.ceil(count / query.offset),
        currentPage: query.page,
        records: messages,
      },
    };
  }

  public async fetchChats() {
    return await this.repository.chat.findMany({
      where: { instanceId: this.instance.id },
    });
  }

  // Group
  public async createGroup(create: CreateGroupDto) {
    try {
      const participants = create.participants.map((p) => this.createJid(p));
      const { id } = await this.client.groupCreate(create.subject, participants);
      if (create?.description) {
        await this.client.groupUpdateDescription(id, create.description);
      }

      const group = await this.client.groupMetadata(id);

      return { groupMetadata: group };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Error creating group', error.toString());
    }
  }

  public async updateGroupPicture(picture: GroupPictureDto) {
    try {
      let pic: WAMediaUpload;
      if (isURL(picture.image)) {
        pic = (await axios.get(picture.image, { responseType: 'arraybuffer' })).data;
      } else if (isBase64(picture.image)) {
        pic = Buffer.from(picture.image, 'base64');
      } else {
        throw new BadRequestException('"profilePicture" must be a url or a base64');
      }
      await this.client.updateProfilePicture(picture.groupJid, pic);

      return { update: 'success' };
    } catch (error) {
      throw new InternalServerErrorException('Error creating group', error.toString());
    }
  }

  public async findGroup(id: GroupJid, reply: 'inner' | 'out' = 'out') {
    try {
      return await this.client.groupMetadata(id.groupJid);
    } catch (error) {
      if (reply === 'inner') {
        return;
      }
      throw new BadRequestException('Error fetching group', error.toString());
    }
  }

  public async invitationCode(id: GroupJid) {
    try {
      const code = await this.client.groupInviteCode(id.groupJid);
      return { inviteUrl: `https://chat.whatsapp.com/${code}`, inviteCode: code };
    } catch (error) {
      throw new BadRequestException('No invite code', error.toString());
    }
  }

  public async revokeInvitationCode(id: GroupJid) {
    try {
      const inviteCode = await this.client.groupRevokeInvite(id.groupJid);
      return { revoked: true, inviteCode };
    } catch (error) {
      throw new BadRequestException('Revoke error', error.toString());
    }
  }

  public async findParticipants(id: GroupJid) {
    try {
      const participants = (await this.client.groupMetadata(id.groupJid)).participants;
      return { participants };
    } catch (error) {
      throw new BadRequestException('No participants', error.toString());
    }
  }

  public async updateGParticipant(update: GroupUpdateParticipantDto) {
    try {
      const participants = update.participants.map((p) => this.createJid(p));
      const updateParticipants = await this.client.groupParticipantsUpdate(
        update.groupJid,
        participants,
        update.action,
      );
      return { updateParticipants: updateParticipants };
    } catch (error) {
      throw new BadRequestException('Error updating participants', error.toString());
    }
  }

  public async leaveGroup(id: GroupJid) {
    try {
      await this.client.groupLeave(id.groupJid);
      return { groupJid: id.groupJid, leave: true };
    } catch (error) {
      throw new BadRequestException('Unable to leave the group', error.toString());
    }
  }
}
