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
  PRODUCTION: Production;
}

export type Key = keyof Env;

export class ConfigService {
  constructor() {
    this.env = this.configEnv();
  }

  private env: Env;

  public get<T = any>(key: Key) {
    return this.env[key] as T;
  }

  private configEnv(): Env {
    const YAML_PATH = join(SRC_DIR, 'env.yml');
    const configYml = load(readFileSync(YAML_PATH, { encoding: 'utf-8' })) as Env;
    configYml.PRODUCTION = process.env.NODE_ENV === 'PROD' ? true : false;
    if (process.env.SERVER_TYPE) {
      configYml.SERVER.TYPE = process.env.SERVER_TYPE as 'http';
      configYml.SERVER.PORT = Number.parseInt(process.env.SERVER_PORT);
    }
    return configYml;
  }
}

export const configService = new ConfigService();
