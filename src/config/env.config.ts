import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { join } from 'path';
import { SRC_DIR } from './path.config';

export type HttpServer = { TYPE: 'http' | 'https'; PORT: number };

export type HttpMethods = 'POST' | 'GET' | 'PUT' | 'DELETE';
export type Cors = {
  ORIGIN: string[];
  METHODS: HttpMethods[];
  CREDENTIALS: boolean;
};

export type LogLevel = 'ERROR' | 'WARN' | 'DEBUG' | 'INFO' | 'LOG' | 'VERBOSE' | 'DARK';

export type SaveData = {
  OLD_MESSAGE: boolean;
  NEW_MESSAGE: boolean;
  MESSAGE_UPDATE: boolean;
  CONTACTS: boolean;
  CHATS: boolean;
};

export type StoreConf = {
  CLEANING_INTARVAL: number;
  MESSAGES: boolean;
  CONTACTS: boolean;
  CHATS: boolean;
};

export type DBConnection = {
  HOST: string;
  PORT: number;
  USER: string;
  PASSWORD: string;
  DB_PREFIX_NAME: string;
};
export type Database = {
  CONNECTION: DBConnection;
  ENABLED: boolean;
  SAVE_DATA: SaveData;
};

export type EventsWebhook = {
  STATUS_INSTANCE: boolean;
  QRCODE_UPDATED: boolean;
  MESSAGES_SET: boolean;
  MESSAGES_UPSERT: boolean;
  MESSAGES_UPDATE: boolean;
  SEND_MESSAGE: boolean;
  CONTACTS_SET: boolean;
  CONTACTS_UPDATE: boolean;
  CONTACTS_UPSERT: boolean;
  PRESENCE_UPDATE: boolean;
  CHATS_SET: boolean;
  CHATS_UPDATE: boolean;
  CHATS_UPSERT: boolean;
  CONNECTION_UPDATE: boolean;
  NEW_JWT_TOKEN: boolean;
};

export type ApiKey = { KEY: string };
export type Jwt = { EXPIRIN_IN: number; SECRET: string };
export type Auth = { API_KEY: ApiKey; JWT: Jwt; TYPE: 'jwt' | 'apikey' };

export type DelInstance = number | boolean;

export type GlobalWebhook = { URL: string; ENABLED: boolean };
export type SslConf = { PRIVKEY: string; FULLCHAIN: string };
export type Webhook = { GLOBAL?: GlobalWebhook; EVENTS: EventsWebhook };
export type ConfigSessionPhone = { CLIENT: string; NAME: string };
export type QrCode = { LINIT: number };
export type Production = boolean;

export interface Env {
  SERVER: HttpServer;
  CORS: Cors;
  SSL_CONF: SslConf;
  STORE: StoreConf;
  DATABASE: Database;
  LOG_LEVEL: LogLevel[];
  DEL_INSTANCE: DelInstance;
  WEBHOOK: Webhook;
  CONFIG_SESSION_PHONE: ConfigSessionPhone;
  QRCODE: QrCode;
  AUTHENTICATION: Auth;
  PRODUCTION?: Production;
}

export type Key = keyof Env;

export class ConfigService {
  constructor() {
    this.loadEnv();
  }

  private env: Env;

  public get<T = any>(key: Key) {
    return this.env[key] as T;
  }

  private loadEnv() {
    this.env = !process.env?.DOCKER_ENV ? this.envYaml() : this.envProcess();
    this.env.PRODUCTION = process.env?.NODE_ENV === 'PROD';
    if (process.env?.DOCKER_ENV === 'true') {
      this.env.SERVER.TYPE = 'http';
      this.env.SERVER.PORT = Number.parseInt(process.env?.SERVER_PORT ?? '8080');
    }
  }

  private envYaml(): Env {
    return load(readFileSync(join(SRC_DIR, 'env.yml'), { encoding: 'utf-8' })) as Env;
  }

  private envProcess(): Env {
    return {
      SERVER: {
        TYPE: process.env.SERVER_TYPE as 'http' | 'https',
        PORT: Number.parseInt(process.env.SERVER_PORT),
      },
      CORS: {
        ORIGIN: process.env.CORS_ORIGIN.split(','),
        METHODS: process.env.CORS_METHODS.split(',') as HttpMethods[],
        CREDENTIALS: process.env?.CORS_CREDENTIALS === 'true',
      },
      SSL_CONF: {
        PRIVKEY: process.env.SSL_CONF_PRIVKEY,
        FULLCHAIN: process.env.SSL_CONF_FULLCHAIN,
      },
      STORE: {
        CLEANING_INTARVAL: Number.parseInt(process.env.STORE_CLEANING_TERMINAL),
        MESSAGES: process.env?.STORE_MESSAGE === 'true',
        CONTACTS: process.env?.STORE_CONTACTS === 'true',
        CHATS: process.env?.STORE_CHATS === 'true',
      },
      DATABASE: {
        CONNECTION: {
          HOST: process.env.DATABASE_CONNECTION_HOST,
          PORT: Number.parseInt(process.env.DATABASE_CONNECTION_HOST),
          USER: process.env.DATABASE_CONNECTION_USER,
          PASSWORD: process.env.DATABASE_CONNECTION_PASSWORD,
          DB_PREFIX_NAME: process.env.DATABASE_CONNECTION_DB_PREFIX_NAME,
        },
        ENABLED: process.env?.DATABASE_ENABLED === 'true',
        SAVE_DATA: {
          OLD_MESSAGE: process.env?.DATABASE_SAVE_DATA_OLD_MESSAGE === 'true',
          NEW_MESSAGE: process.env?.DATABASE_SAVE_DATA_NEW_MESSAGE === 'true',
          MESSAGE_UPDATE: process.env?.DATABASE_SAVE_MESSAGE_UPDATE === 'true',
          CONTACTS: process.env?.DATABASE_SAVE_DATA_CONTACTS === 'true',
          CHATS: process.env?.DATABASE_SAVE_DATA_CHATS === 'true',
        },
      },
      LOG_LEVEL: process.env.LOG_LEVEL.split(',') as LogLevel[],
      DEL_INSTANCE:
        typeof process.env.DEL_INSTANCE === 'boolean'
          ? process.env.DEL_INSTANCE === 'true'
          : Number.parseInt(process.env.DEL_INSTANCE),
      WEBHOOK: {
        GLOBAL: {
          URL: process.env?.WEBHOOK_GLOBAL_URL,
          ENABLED: process.env?.WEBHOOK_GLOBAL_ENABLED === 'true',
        },
        EVENTS: {
          STATUS_INSTANCE: process.env?.WEBHOOK_EVENTS_STATUS_INSTANCE === 'true',
          QRCODE_UPDATED: process.env?.WEBHOOK_EVENTS_QRCODE_UPDATED === 'true',
          MESSAGES_SET: process.env?.WEBHOOK_EVENTS_MESSAGES_SET === 'true',
          MESSAGES_UPSERT: process.env?.WEBHOOK_EVENTS_MESSAGES_UPSERT === 'true',
          MESSAGES_UPDATE: process.env?.WEBHOOK_EVENTS_MESSAGES_UPDATE === 'true',
          SEND_MESSAGE: process.env?.WEBHOOK_EVENTS_SEND_MESSAGE === 'true',
          CONTACTS_SET: process.env?.WEBHOOK_EVENTS_CONTACTS_SET === 'true',
          CONTACTS_UPDATE: process.env?.WEBHOOK_EVENTS_CONTACTS_UPDATE === 'true',
          CONTACTS_UPSERT: process.env?.WEBHOOK_EVENTS_CONTACTS_UPSERT === 'true',
          PRESENCE_UPDATE: process.env?.WEBHOOK_EVENTS_PRESENCE_UPDATE === 'true',
          CHATS_SET: process.env?.WEBHOOK_EVENTS_CHATS_SET === 'true',
          CHATS_UPDATE: process.env?.WEBHOOK_EVENTS_CHATS_UPDATE === 'true',
          CHATS_UPSERT: process.env?.WEBHOOK_EVENTS_CHATS_UPSERT === 'true',
          CONNECTION_UPDATE: process.env?.WEBHOOK_EVENTS_CONNECTION_UPDATE === 'true',
          NEW_JWT_TOKEN: process.env?.WEBHOOK_EVENTS_NEW_JWT_TOKEN === 'true',
        },
      },
      CONFIG_SESSION_PHONE: {
        CLIENT: process.env.CONFIG_SESSION_PHONE_CLIENST,
        NAME: process.env.CONFIG_SESSION_PHONE_NAME,
      },
      QRCODE: {
        LINIT: Number.parseInt(process.env.QRCODE_LIMIT),
      },
      AUTHENTICATION: {
        TYPE: process.env.AUTHENTICATION_TYPE as 'jwt',
        API_KEY: {
          KEY: process.env.AUTHENTICATION_API_KEY,
        },
        JWT: {
          EXPIRIN_IN: Number.parseInt(process.env.AUTHENTICATION_JWT_EXPIRIN_IN),
          SECRET: process.env.AUTHENTICATION_JWT_SECRET,
        },
      },
    };
  }
}

export const configService = new ConfigService();
