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
  BufferJSON,
  CacheStore,
  Chat,
  ConnectionState,
  Contact,
  delay,
  DisconnectReason,
  downloadMediaMessage,
  fetchLatestBaileysVersion,
  generateWAMessageFromContent,
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
  WAMediaUpload,
  WAMessageUpdate,
  WASocket,
} from '@whiskeysockets/baileys';
import {
  ConfigService,
  ConfigSessionPhone,
  Database,
  QrCode,
  Redis,
  StoreConf,
  Webhook,
} from '../../config/env.config';
import { Logger } from '../../config/logger.config';
import { INSTANCE_DIR, ROOT_DIR } from '../../config/path.config';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import axios from 'axios';
import { v4 } from 'uuid';
import qrcode, { QRCodeToDataURLOptions } from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';
import { Events, TypeMediaMessage, wa, MessageSubtype } from '../types/wa.types';
import { Boom } from '@hapi/boom';
import EventEmitter2 from 'eventemitter2';
import { release } from 'os';
import P from 'pino';
import { execSync } from 'child_process';
import { RepositoryBroker } from '../repository/repository.manager';
import { MessageRaw, MessageUpdateRaw } from '../models/message.model';
import { ContactRaw } from '../models/contact.model';
import { ChatRaw } from '../models/chat.model';
import { getMIMEType } from 'node-mime-types';
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
  WhatsAppNumberDto,
} from '../dto/chat.dto';
import { MessageQuery } from '../repository/message.repository';
import { ContactQuery } from '../repository/contact.repository';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '../../exceptions';
import {
  CreateGroupDto,
  GroupJid,
  GroupPictureDto,
  GroupUpdateParticipantDto,
} from '../dto/group.dto';
import { MessageUpQuery } from '../repository/messageUp.repository';
import { useMultiFileAuthStateDb } from '../../utils/use-multi-file-auth-state-db';
import Long from 'long';
import { WebhookRaw } from '../models/webhook.model';
import { dbserver } from '../../db/db.connect';
import NodeCache from 'node-cache';
import { useMultiFileAuthStateRedisDb } from '../../utils/use-multi-file-auth-state-redis-db';
import { RedisCache } from '../../db/redis.client';

export class WAStartupService {
  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly repository: RepositoryBroker,
    private readonly cache: RedisCache,
  ) {
    this.cleanStore();
    this.instance.qrcode = { count: 0 };
  }

  private readonly logger = new Logger(WAStartupService.name);
  private readonly instance: wa.Instance = {};
  public client: WASocket;
  private readonly localWebhook: wa.LocalWebHook = {};
  private stateConnection: wa.StateConnection = { state: 'close' };
  private readonly storePath = join(ROOT_DIR, 'store');
  private readonly msgRetryCounterCache: CacheStore = new NodeCache();
  private readonly userDevicesCache: CacheStore = new NodeCache();
  private endSession = false;

  public set instanceName(name: string) {
    if (!name) {
      this.instance.name = v4();
      return;
    }
    this.instance.name = name;
    this.sendDataWebhook(Events.STATUS_INSTANCE, {
      instance: this.instance.name,
      status: 'created',
    });
  }

  public get instanceName() {
    return this.instance.name;
  }

  public get wuid() {
    return this.instance.wuid;
  }

  public async getProfileName() {
    let profileName = this.client.user?.name ?? this.client.user?.verifiedName;
    if (!profileName) {
      if (this.configService.get<Database>('DATABASE').ENABLED) {
        const collection = dbserver
          .getClient()
          .db(
            this.configService.get<Database>('DATABASE').CONNECTION.DB_PREFIX_NAME +
              '-instances',
          )
          .collection(this.instanceName);
        const data = await collection.findOne({ _id: 'creds' });
        if (data) {
          const creds = JSON.parse(JSON.stringify(data), BufferJSON.reviver);
          profileName = creds.me?.name || creds.me?.verifiedName;
        }
      } else if (existsSync(join(INSTANCE_DIR, this.instanceName, 'creds.json'))) {
        const creds = JSON.parse(
          readFileSync(join(INSTANCE_DIR, this.instanceName, 'creds.json'), {
            encoding: 'utf-8',
          }),
        );
        profileName = creds.me?.name || creds.me?.verifiedName;
      }
    }
    return profileName;
  }

  public get profilePictureUrl() {
    return this.instance.profilePictureUrl;
  }

  public get qrCode(): wa.QrCode {
    return {
      code: this.instance.qrcode?.code,
      base64: this.instance.qrcode?.base64,
    };
  }

  private async loadWebhook() {
    const data = await this.repository.webhook.find(this.instanceName);
    this.localWebhook.url = data?.url;
    this.localWebhook.enabled = data?.enabled;
  }

  public async setWebhook(data: WebhookRaw) {
    await this.repository.webhook.create(data, this.instanceName);
    Object.assign(this.localWebhook, data);
  }

  public async findWebhook() {
    return await this.repository.webhook.find(this.instanceName);
  }

  private async sendDataWebhook<T = any>(event: Events, data: T) {
    const webhook = this.configService.get<Webhook>('WEBHOOK');
    const we = event.replace(/[\.-]/gm, '_').toUpperCase();
    if (webhook.EVENTS[we]) {
      try {
        if (this.localWebhook.enabled && isURL(this.localWebhook.url)) {
          const httpService = axios.create({ baseURL: this.localWebhook.url });
          await httpService.post(
            '',
            {
              event,
              instance: this.instance.name,
              data,
            },
            { params: { owner: this.instance.wuid } },
          );
        }
      } catch (error) {
        this.logger.error({
          local: WAStartupService.name + '.sendDataWebhook-local',
          message: error?.message,
          hostName: error?.hostname,
          syscall: error?.syscall,
          code: error?.code,
          error: error?.errno,
          stack: error?.stack,
          name: error?.name,
        });
      }

      try {
        const globalWebhook = this.configService.get<Webhook>('WEBHOOK').GLOBAL;
        if (globalWebhook && globalWebhook?.ENABLED && isURL(globalWebhook.URL)) {
          const httpService = axios.create({ baseURL: globalWebhook.URL });
          await httpService.post(
            '',
            {
              event,
              instance: this.instance.name,
              data,
            },
            { params: { owner: this.instance.wuid } },
          );
        }
      } catch (error) {
        this.logger.error({
          local: WAStartupService.name + '.sendDataWebhook-global',
          message: error?.message,
          hostName: error?.hostname,
          syscall: error?.syscall,
          code: error?.code,
          error: error?.errno,
          stack: error?.stack,
          name: error?.name,
        });
      }
    }
  }

  private async connectionUpdate({
    qr,
    connection,
    lastDisconnect,
  }: Partial<ConnectionState>) {
    if (qr) {
      if (this.instance.qrcode.count === this.configService.get<QrCode>('QRCODE').LIMIT) {
        this.sendDataWebhook(Events.QRCODE_UPDATED, {
          message: 'QR code limit reached, please login again',
          statusCode: DisconnectReason.badSession,
        });

        this.sendDataWebhook(Events.CONNECTION_UPDATE, {
          instance: this.instance.name,
          state: 'refused',
          statusReason: DisconnectReason.connectionClosed,
        });

        this.sendDataWebhook(Events.STATUS_INSTANCE, {
          instance: this.instance.name,
          status: 'removed',
        });

        this.endSession = true;

        return this.eventEmitter.emit('no.connection', this.instance.name);
      }

      this.instance.qrcode.count++;

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

        this.instance.qrcode.base64 = base64;
        this.instance.qrcode.code = qr;

        this.sendDataWebhook(Events.QRCODE_UPDATED, {
          qrcode: { instance: this.instance.name, code: qr, base64 },
        });
      });

      qrcodeTerminal.generate(qr, { small: true }, (qrcode) =>
        this.logger.log(
          `\n{ instance: ${this.instance.name}, qrcodeCount: ${this.instance.qrcode.count} }\n` +
            qrcode,
        ),
      );
    }

    if (connection) {
      this.stateConnection = {
        state: connection,
        statusReason: (lastDisconnect?.error as Boom)?.output?.statusCode ?? 200,
      };
      this.sendDataWebhook(Events.CONNECTION_UPDATE, {
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
        this.sendDataWebhook(Events.STATUS_INSTANCE, {
          instance: this.instance.name,
          status: 'removed',
        });
        this.eventEmitter.emit('remove.instance', this.instance.name, 'inner');
        this.client?.ws?.close();
        this.client.end(new Error('Close connection'));
      }
    }

    if (connection === 'open') {
      this.instance.wuid = this.client.user.id.replace(/:\d+/, '');
      this.instance.profilePictureUrl = (
        await this.profilePicture(this.instance.wuid)
      ).profilePictureUrl;
      this.logger.info(
        `
        ┌──────────────────────────────┐
        │    CONNECTED TO WHATSAPP     │
        └──────────────────────────────┘`.replace(/^ +/gm, '  '),
      );
    }
  }

  private async getMessage(key: proto.IMessageKey, full = false) {
    try {
      const webMessageInfo = (await this.repository.message.find({
        where: { owner: this.instance.wuid, key: { id: key.id } },
      })) as unknown as proto.IWebMessageInfo[];
      if (full) {
        return webMessageInfo[0];
      }
      return webMessageInfo[0].message;
    } catch (error) {
      return { conversation: '' };
    }
  }

  private cleanStore() {
    const store = this.configService.get<StoreConf>('STORE');
    const database = this.configService.get<Database>('DATABASE');
    if (store?.CLEANING_INTERVAL && !database.ENABLED) {
      setInterval(() => {
        try {
          for (const [key, value] of Object.entries(store)) {
            if (value === true) {
              execSync(
                `rm -rf ${join(
                  this.storePath,
                  key.toLowerCase(),
                  this.instance.wuid,
                )}/*.json`,
              );
            }
          }
        } catch (error) {}
      }, (store?.CLEANING_INTERVAL ?? 3600) * 1000);
    }
  }

  private async defineAuthState() {
    const db = this.configService.get<Database>('DATABASE');
    const redis = this.configService.get<Redis>('REDIS');

    if (redis?.ENABLED) {
      this.cache.reference = this.instance.name;
      return await useMultiFileAuthStateRedisDb(this.cache);
    }

    if (db.SAVE_DATA.INSTANCE && db.ENABLED) {
      return await useMultiFileAuthStateDb(this.instance.name);
    }

    return await useMultiFileAuthState(join(INSTANCE_DIR, this.instance.name));
  }

  public async connectToWhatsapp(): Promise<WASocket> {
    try {
      this.loadWebhook();

      this.instance.authState = await this.defineAuthState();

      const { version } = await fetchLatestBaileysVersion();
      const session = this.configService.get<ConfigSessionPhone>('CONFIG_SESSION_PHONE');
      const browser: WABrowserDescription = [session.CLIENT, session.NAME, release()];

      const socketConfig: UserFacingSocketConfig = {
        auth: {
          creds: this.instance.authState.state.creds,
          keys: makeCacheableSignalKeyStore(
            this.instance.authState.state.keys,
            P({ level: 'error' }),
          ),
        },
        logger: P({ level: 'error' }),
        printQRInTerminal: false,
        browser,
        version,
        connectTimeoutMs: 60_000,
        qrTimeout: 10_000,
        emitOwnEvents: false,
        msgRetryCounterCache: this.msgRetryCounterCache,
        getMessage: this.getMessage as any,
        generateHighQualityLinkPreview: true,
        syncFullHistory: true,
        userDevicesCache: this.userDevicesCache,
        transactionOpts: { maxCommitRetries: 1, delayBetweenTriesMs: 10 },
        patchMessageBeforeSending: (message) => {
          const requiresPatch = !!(message.buttonsMessage || message.listMessage);
          if (requiresPatch) {
            message = {
              viewOnceMessageV2: {
                message: {
                  messageContextInfo: {
                    deviceListMetadataVersion: 2,
                    deviceListMetadata: {},
                  },
                  ...message,
                },
              },
            };
          }

          return message;
        },
      };

      this.endSession = false;

      this.client = makeWASocket(socketConfig);

      this.eventHandler();

      return this.client;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error?.toString());
    }
  }

  private readonly chatHandle = {
    'chats.upsert': async (chats: Chat[], database: Database) => {
      const chatsRepository = await this.repository.chat.find({
        where: { owner: this.instance.wuid },
      });

      const chatsRaw: ChatRaw[] = [];
      for await (const chat of chats) {
        if (chatsRepository.find((cr) => cr.id === chat.id)) {
          continue;
        }

        chatsRaw.push({ id: chat.id, owner: this.instance.wuid });
      }

      await this.sendDataWebhook(Events.CHATS_UPSERT, chatsRaw);
      await this.repository.chat.insert(chatsRaw, database.SAVE_DATA.CHATS);
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
      const chatsRaw: ChatRaw[] = chats.map((chat) => {
        return { id: chat.id, owner: this.instance.wuid };
      });
      await this.sendDataWebhook(Events.CHATS_UPDATE, chatsRaw);
    },

    'chats.delete': async (chats: string[]) => {
      chats.forEach(
        async (chat) =>
          await this.repository.chat.delete({
            where: { owner: this.instance.wuid, id: chat },
          }),
      );
      await this.sendDataWebhook(Events.CHATS_DELETE, [...chats]);
    },
  };

  private readonly contactHandle = {
    'contacts.upsert': async (contacts: Contact[], database: Database) => {
      const contactsRepository = await this.repository.contact.find({
        where: { owner: this.instance.wuid },
      });

      const contactsRaw: ContactRaw[] = [];
      for await (const contact of contacts) {
        if (contactsRepository.find((cr) => cr.id === contact.id)) {
          continue;
        }

        contactsRaw.push({
          id: contact.id,
          pushName: contact?.name || contact?.verifiedName,
          profilePictureUrl: (await this.profilePicture(contact.id)).profilePictureUrl,
          owner: this.instance.wuid,
        });
      }
      await this.sendDataWebhook(Events.CONTACTS_UPSERT, contactsRaw);
      await this.repository.contact.insert(contactsRaw, database.SAVE_DATA.CONTACTS);
    },

    'contacts.update': async (contacts: Partial<Contact>[]) => {
      const contactsRaw: ContactRaw[] = [];
      for await (const contact of contacts) {
        contactsRaw.push({
          id: contact.id,
          pushName: contact?.name ?? contact?.verifiedName,
          profilePictureUrl: (await this.profilePicture(contact.id)).profilePictureUrl,
          owner: this.instance.wuid,
        });
      }
      await this.sendDataWebhook(Events.CONTACTS_UPDATE, contactsRaw);
    },
  };

  private readonly messageHandle = {
    'messaging-history.set': async (
      {
        messages,
        chats,
        isLatest,
      }: {
        chats: Chat[];
        contacts: Contact[];
        messages: proto.IWebMessageInfo[];
        isLatest: boolean;
      },
      database: Database,
    ) => {
      if (isLatest) {
        const chatsRaw: ChatRaw[] = chats.map((chat) => {
          return {
            id: chat.id,
            owner: this.instance.wuid,
          };
        });
        await this.sendDataWebhook(Events.CHATS_SET, chatsRaw);
        await this.repository.chat.insert(chatsRaw, database.SAVE_DATA.CHATS);
      }

      const messagesRaw: MessageRaw[] = [];
      const messagesRepository = await this.repository.message.find({
        where: { owner: this.instance.wuid },
      });
      for await (const [, m] of Object.entries(messages)) {
        if (
          m.message?.protocolMessage ||
          m.message?.senderKeyDistributionMessage ||
          !m.message
        ) {
          continue;
        }
        if (
          messagesRepository.find(
            (mr) => mr.owner === this.instance.wuid && mr.key.id === m.key.id,
          )
        ) {
          continue;
        }

        if (Long.isLong(m?.messageTimestamp)) {
          m.messageTimestamp = m.messageTimestamp?.toNumber();
        }

        messagesRaw.push({
          key: m.key,
          pushName: m.pushName,
          participant: m.participant,
          message: { ...m.message },
          messageTimestamp: m.messageTimestamp as number,
          owner: this.instance.wuid,
        });
      }

      await this.repository.message.insert(
        [...messagesRaw],
        database.SAVE_DATA.OLD_MESSAGE,
      );
      this.sendDataWebhook(Events.MESSAGES_SET, [...messagesRaw]);
      messages = undefined;
    },

    'messages.upsert': async (
      {
        messages,
        type,
      }: {
        messages: proto.IWebMessageInfo[];
        type: MessageUpsertType;
      },
      database: Database,
    ) => {
      const received = messages[0];
      if (
        type !== 'notify' ||
        !received?.message ||
        received.message?.protocolMessage ||
        received.message.senderKeyDistributionMessage
      ) {
        return;
      }

      if (Long.isLong(received.messageTimestamp)) {
        received.messageTimestamp = received.messageTimestamp?.toNumber();
      }

      const messageRaw: MessageRaw = {
        key: received.key,
        pushName: received.pushName,
        message: { ...received.message },
        messageTimestamp: received.messageTimestamp as number,
        owner: this.instance.wuid,
        source: getDevice(received.key.id),
      };

      this.logger.log(received);

      await this.repository.message.insert([messageRaw], database.SAVE_DATA.NEW_MESSAGE);
      await this.sendDataWebhook(Events.MESSAGES_UPSERT, messageRaw);
    },

    'messages.update': async (args: WAMessageUpdate[], database: Database) => {
      const status: Record<number, wa.StatusMessage> = {
        0: 'ERROR',
        1: 'PENDING',
        2: 'SERVER_ACK',
        3: 'DELIVERY_ACK',
        4: 'READ',
        5: 'PLAYED',
      };
      for await (const { key, update } of args) {
        if (key.remoteJid !== 'status@broadcast' && !key?.remoteJid?.match(/(:\d+)/)) {
          const message: MessageUpdateRaw = {
            ...key,
            status: status[update.status],
            datetime: Date.now(),
            owner: this.instance.wuid,
          };
          await this.sendDataWebhook(Events.MESSAGES_UPDATE, message);
          await this.repository.messageUpdate.insert(
            [message],
            database.SAVE_DATA.MESSAGE_UPDATE,
          );
        }
      }
    },
  };

  private readonly groupHandler = {
    'groups.upsert': (groupMetadata: GroupMetadata[]) => {
      this.sendDataWebhook(Events.GROUPS_UPSERT, groupMetadata);
    },

    'groups.update': (groupMetadataUpdate: Partial<GroupMetadata>[]) => {
      this.sendDataWebhook(Events.GROUPS_UPDATE, groupMetadataUpdate);
    },

    'group-participants.update': (participantsUpdate: {
      id: string;
      participants: string[];
      action: ParticipantAction;
    }) => {
      this.sendDataWebhook(Events.GROUP_PARTICIPANTS_UPDATE, participantsUpdate);
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
          this.instance.authState.saveCreds();
        }

        if (events['messaging-history.set']) {
          const payload = events['messaging-history.set'];
          this.messageHandle['messaging-history.set'](payload, database);
        }

        if (events['messages.upsert']) {
          const payload = events['messages.upsert'];
          this.messageHandle['messages.upsert'](payload, database);
        }

        if (events['messages.update']) {
          const payload = events['messages.update'];
          this.messageHandle['messages.update'](payload, database);
        }

        if (events['presence.update']) {
          const payload = events['presence.update'];
          this.sendDataWebhook(Events.PRESENCE_UPDATE, payload);
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
          this.chatHandle['chats.upsert'](payload, database);
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
          this.contactHandle['contacts.upsert'](payload, database);
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

  private async sendMessageWithTyping<T = proto.IMessage>(
    number: string,
    message: T,
    options?: Options,
  ) {
    const jid = this.createJid(number);
    const isWA = (await this.whatsappNumber({ numbers: [jid] }))[0];
    if (!isWA.exists && !isJidGroup(isWA.jid)) {
      throw new BadRequestException(isWA);
    }

    const sender = isJidGroup(jid) ? jid : isWA.jid;

    if (isJidGroup(sender)) {
      try {
        await this.client.groupMetadata(sender);
      } catch (error) {
        throw new NotFoundException('Group not found');
      }
    }

    try {
      if (options?.delay) {
        await this.client.presenceSubscribe(sender);
        await this.client.sendPresenceUpdate(options?.presence ?? 'composing', jid);
        await delay(options.delay);
        await this.client.sendPresenceUpdate('paused', sender);
      }

      const messageSent = await (async () => {
        if (!message['audio']) {
          return await this.client.sendMessage(sender, {
            forward: {
              key: { remoteJid: this.instance.wuid, fromMe: true },
              message,
            },
          });
        }

        return await this.client.sendMessage(
          sender,
          message as unknown as AnyMessageContent,
        );
      })();

      this.sendDataWebhook(Events.SEND_MESSAGE, messageSent).catch((error) =>
        this.logger.error(error),
      );
      this.repository.message
        .insert(
          [{ ...messageSent, owner: this.instance.wuid }],
          this.configService.get<Database>('DATABASE').SAVE_DATA.NEW_MESSAGE,
        )
        .catch((error) => this.logger.error(error));

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

      let mimetype: string;

      if (typeof mediaMessage.media === 'string' && isURL(mediaMessage.media)) {
        mimetype = getMIMEType(mediaMessage.media);
      } else {
        mimetype = getMIMEType(mediaMessage.fileName);
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
        { userJid: this.instance.wuid },
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
      return await this.client.sendMessage(del.remoteJid, { delete: del });
    } catch (error) {
      throw new InternalServerErrorException(
        'Error while deleting message for everyone',
        error?.toString(),
      );
    }
  }

  public async getBase64FromMediaMessage(m: proto.IWebMessageInfo) {
    try {
      const msg = m?.message
        ? m
        : ((await this.getMessage(m.key, true)) as proto.IWebMessageInfo);

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
        throw 'The message is not of the media type';
      }

      if (typeof mediaMessage['mediaKey'] === 'object') {
        msg.message = JSON.parse(JSON.stringify(msg.message));
      }

      const buffer = await downloadMediaMessage(
        { key: msg?.key, message: msg?.message },
        'buffer',
        {},
        {
          logger: P({ level: 'error' }),
          reuploadRequest: this.client.updateMediaMessage,
        },
      );

      return {
        mediaType,
        fileName: mediaMessage['fileName'],
        caption: mediaMessage['caption'],
        size: {
          fileLength: mediaMessage['fileLength'],
          height: mediaMessage['height'],
          width: mediaMessage['width'],
        },
        mimetype: mediaMessage['mimetype'],
        base64: buffer.toString('base64'),
      };
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(error.toString());
    }
  }

  public async fetchContacts(query: ContactQuery) {
    if (query?.where) {
      query.where.owner = this.instance.wuid;
    } else {
      query = {
        where: {
          owner: this.instance.wuid,
        },
      };
    }
    return await this.repository.contact.find(query);
  }

  public async fetchMessages(query: MessageQuery) {
    if (query?.where) {
      query.where.owner = this.instance.wuid;
    } else {
      query = {
        where: {
          owner: this.instance.wuid,
        },
        limit: query?.limit,
      };
    }
    return await this.repository.message.find(query);
  }

  public async fetchStatusMessage(query: MessageUpQuery) {
    if (query?.where) {
      query.where.owner = this.instance.wuid;
    } else {
      query = {
        where: {
          owner: this.instance.wuid,
        },
        limit: query?.limit,
      };
    }
    return await this.repository.messageUpdate.find(query);
  }

  public async fetchChats() {
    return await this.repository.chat.find({ where: { owner: this.instance.wuid } });
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
      throw new NotFoundException('Error fetching group', error.toString());
    }
  }

  public async inviteCode(id: GroupJid) {
    try {
      const code = await this.client.groupInviteCode(id.groupJid);
      return { inviteUrl: `https://chat.whatsapp.com/${code}`, inviteCode: code };
    } catch (error) {
      throw new NotFoundException('No invite code', error.toString());
    }
  }

  public async revokeInviteCode(id: GroupJid) {
    try {
      const inviteCode = await this.client.groupRevokeInvite(id.groupJid);
      return { revoked: true, inviteCode };
    } catch (error) {
      throw new NotFoundException('Revoke error', error.toString());
    }
  }

  public async findParticipants(id: GroupJid) {
    try {
      const participants = (await this.client.groupMetadata(id.groupJid)).participants;
      return { participants };
    } catch (error) {
      throw new NotFoundException('No participants', error.toString());
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
