/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename env.config.ts                                                      │
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
 * │ @type {HttpServer} @type {HttpMethods} @type {Cors} @type {Log}              │
 * │ @type {SaveData} @type {StoreConf} @type {DBConnection} @type {Database}     │
 * │ @type {Redis} @type {EventsWebhook} @type {ApiKey} @type {Jwt} @type {Auth}  │
 * │ @type {DelInstance} @type {GlobalWebhook} @type {SslConf} @type {Webhook}    │
 * │ @type {ConfigSessionPhone} @type {QrCode} @type {Production}                 │
 * │ @interface Env                                                               │
 * │ @type {Key}                                                                  │
 * │                                                                              │
 * │ @class ConfigService                                                         │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { isEmpty } from 'class-validator';
import { config } from 'dotenv';

config();

export type HttpServer = { PORT: number };

export type Bucket = {
  ACCESS_KEY: string;
  SECRET_KEY: string;
  ENDPOINT: string;
  BUCKET_NAME: string;
  ENABLE: boolean;
  PORT?: number;
  USE_SSL?: boolean;
};

export type LogLevel = 'ERROR' | 'WARN' | 'DEBUG' | 'INFO' | 'LOG' | 'VERBOSE' | 'DARK';
export type Log = {
  LEVEL: LogLevel[];
  COLOR: boolean;
};

export type DBOptions = {
  SYNC_MESSAGES: boolean;
  NEW_MESSAGE: boolean;
  MESSAGE_UPDATE: boolean;
  CONTACTS: boolean;
  CHATS: boolean;
  LOGS: boolean;
  ACTIVITY_LOGS: boolean;
};

export type StoreConf = {
  CLEANING_INTERVAL: number;
  MESSAGES: boolean;
  CONTACTS: boolean;
  CHATS: boolean;
};

export type DBConnection = {
  URL: string;
};
export type Database = {
  CONNECTION: DBConnection;
  DB_OPTIONS: DBOptions;
};

export type ProviderSession = {
  ENABLED: boolean;
  HOST: string;
  PORT: string;
  PREFIX: string;
};

export type QrCode = {
  LIMIT: number;
  EXPIRATION_TIME: number;
  LIGHT_COLOR: string;
  DARK_COLOR: string;
};

export type Jwt = { EXPIRIN_IN: number; SECRET: string };
export type Auth = { GLOBAL_AUTH_TOKEN: string; JWT: Jwt };

export type InstanceExpirationTime = number | boolean;

export type GlobalWebhook = { URL: string; ENABLED: boolean };
export type ConfigSessionPhone = { CLIENT: string; NAME: string };
export type QrCodLimit = number;

export type EnvProxy = { WS?: string; FETCH?: string };

export interface Env {
  SERVER: HttpServer;
  STORE: StoreConf;
  DATABASE: Database;
  PROVIDER: ProviderSession;
  LOG: Log;
  INSTANCE_EXPIRATION_TIME: InstanceExpirationTime;
  GLOBAL_WEBHOOK: GlobalWebhook;
  CONFIG_SESSION_PHONE: ConfigSessionPhone;
  QRCODE: QrCode;
  CONNECTION_TIMEOUT: number;
  AUTHENTICATION: Auth;
  PRODUCTION?: boolean;
  SESSION_SECRET: string;
  S3?: Bucket;
  WA_VERSION: string;
  PROXY: EnvProxy;
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
    this.env = this.envProcess();
    this.env.PRODUCTION = process.env?.NODE_ENV === 'PROD';

    if (this.env.S3.ENABLE === true) {
      if (this.env.DATABASE.DB_OPTIONS.NEW_MESSAGE !== true) {
        throw new Error(
          'The bucket is disabled or the database is not configured to save new messages',
        );
      }
    }

    // if (isEmpty(this.env.WA_VERSION)) {
    //   throw new Error(
    //     'The WhatsApp version must be specified in the environment variables.\n\nDefault variable [file: .env]: WA_VERSION=[ 2, 3000, 1015901307 ]\n',
    //   );
    // }
  }

  private envProcess(): Env {
    return {
      SERVER: {
        PORT: Number.parseInt(process.env?.SERVER_PORT || '8084'),
      },
      STORE: {
        CLEANING_INTERVAL: Number.isInteger(process.env?.STORE_CLEANING_TERMINAL)
          ? Number.parseInt(process.env.STORE_CLEANING_TERMINAL)
          : undefined,
        MESSAGES: process.env?.STORE_MESSAGE === 'true',
        CONTACTS: process.env?.STORE_CONTACTS === 'true',
        CHATS: process.env?.STORE_CHATS === 'true',
      },
      DATABASE: {
        CONNECTION: {
          URL: process.env.DATABASE_URL,
        },
        DB_OPTIONS: {
          SYNC_MESSAGES: process.env?.DATABASE_SYNC_MESSAGES === 'true',
          NEW_MESSAGE: process.env?.DATABASE_SAVE_DATA_NEW_MESSAGE === 'true',
          MESSAGE_UPDATE: process.env?.DATABASE_SAVE_MESSAGE_UPDATE === 'true',
          CONTACTS: process.env?.DATABASE_SAVE_DATA_CONTACTS === 'true',
          CHATS: process.env?.DATABASE_SAVE_DATA_CHATS === 'true',
          LOGS: process.env?.DATABASE_SAVE_LOGS === 'true',
          ACTIVITY_LOGS: process.env?.DATABASE_SAVE_ACTIVITY_LOGS
            ? process.env?.DATABASE_SAVE_ACTIVITY_LOGS === 'true'
            : true,
        },
      },
      PROVIDER: {
        ENABLED: process.env?.PROVIDER_ENABLED === 'true',
        HOST: process.env.PROVIDER_HOST,
        PORT: process.env?.PROVIDER_PORT || '5656',
        PREFIX: process.env?.PROVIDER_PREFIX,
      },
      LOG: {
        LEVEL: process.env?.LOG_LEVEL.split('|') as LogLevel[],
        COLOR: process.env?.LOG_COLOR === 'true',
      },
      INSTANCE_EXPIRATION_TIME:
        process.env?.INSTANCE_EXPIRATION_TIME === 'false'
          ? false
          : Number.parseInt(process.env?.INSTANCE_EXPIRATION_TIME || '5'),
      GLOBAL_WEBHOOK: {
        URL: process.env?.WEBHOOK_GLOBAL_URL,
        ENABLED: process.env?.WEBHOOK_GLOBAL_ENABLED === 'true',
      },
      CONFIG_SESSION_PHONE: {
        CLIENT: process.env?.CONFIG_SESSION_PHONE_CLIENT,
        NAME: process.env?.CONFIG_SESSION_PHONE_NAME,
      },
      QRCODE: {
        LIMIT: Number.parseInt(process.env?.QRCODE_LIMIT || '10'),
        EXPIRATION_TIME: Number.parseInt(process.env?.QRCODE_EXPIRATION_TIME || '60'),
        LIGHT_COLOR: process.env?.QRCODE_LIGHT_COLOR
          ? process.env?.QRCODE_LIGHT_COLOR
          : '#ffffff',
        DARK_COLOR: process.env?.QRCODE_DARK_COLOR
          ? process.env?.QRCODE_DARK_COLOR
          : '#198754',
      },
      CONNECTION_TIMEOUT: Number.parseInt(process.env?.CONNECTION_TIMEOUT || '300'),
      AUTHENTICATION: {
        GLOBAL_AUTH_TOKEN: process.env.AUTHENTICATION_GLOBAL_AUTH_TOKEN,
        JWT: {
          EXPIRIN_IN:
            Number.isInteger(process.env?.AUTHENTICATION_JWT_EXPIRES_IN) ||
            process.env?.AUTHENTICATION_JWT_EXPIRES_IN === '0'
              ? Number.parseInt(process.env.AUTHENTICATION_JWT_EXPIRES_IN)
              : 3600,
          SECRET: process.env.AUTHENTICATION_JWT_SECRET,
        },
      },
      SESSION_SECRET: process.env.SESSION_HTTP_SECRET,
      S3: {
        ACCESS_KEY: process.env?.S3_ACCESS_KEY,
        SECRET_KEY: process.env?.S3_SECRET_KEY,
        ENDPOINT: process.env?.S3_ENDPOINT,
        BUCKET_NAME: process.env?.S3_BUCKET,
        ENABLE: process.env?.S3_ENABLED === 'true',
        PORT: Number.parseInt(process.env?.S3_PORT || '9000'),
        USE_SSL: process.env?.S3_USE_SSL === 'true',
      },
      WA_VERSION: process.env?.WA_VERSION,
      PROXY: {
        WS: process.env?.WS_PROXY_URL || null,
        FETCH: process.env?.FETCH_PROXY_URL || null,
      },
    };
  }
}
