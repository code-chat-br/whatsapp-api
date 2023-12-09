/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename use-multi-file-auth-state-redis-db.ts                              │
 * │ Developed by: Cleber Wilson                                                  │
 * │ Creation date: Apr 09, 2023                                                  │
 * │ Contact: contato@codechat.dev                                                │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @copyright © Cleber Wilson 2023. All rights reserved.                        │
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
 * │ @type {AuthState}                                                            │
 * │ @function useMultiFileAuthStateRedisDb                                       │
 * │ @returns {Promise<AuthState>}                                                │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

export type AuthState = { state: AuthenticationState; saveCreds: () => Promise<void> };

import {
  AuthenticationCreds,
  AuthenticationState,
  BufferJSON,
  initAuthCreds,
  proto,
  SignalDataTypeMap,
} from '@whiskeysockets/baileys';
import { Logger } from '../config/logger.config';
import { ConfigService, Redis } from '../config/env.config';
import { RedisCache } from '../cache/redis';

export class AuthStateRedis {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisCache: RedisCache,
  ) {}

  private readonly logger = new Logger(this.configService, AuthStateRedis.name);
  private readonly config = Object.freeze(this.configService.get<Redis>('REDIS'));

  public async authStateRedisDb(instance: string): Promise<AuthState> {
    const defaultKey = `${this.config.PREFIX_KEY}:${instance}`;

    const writeData = async (data: any, key: string): Promise<any> => {
      try {
        const json = JSON.stringify(data, BufferJSON.replacer);
        return await this.redisCache.client.hSet(defaultKey, key, json);
      } catch (error) {
        this.logger.error({ localError: 'writeData', error });
        return;
      }
    };

    const readData = async (key: string): Promise<any> => {
      try {
        const data = await this.redisCache.client.hGet(defaultKey, key);
        if (data) {
          return JSON.parse(data, BufferJSON.reviver);
        }
      } catch (error) {
        this.logger.error({ readData: 'writeData', error });
        return;
      }
    };

    const removeData = async (key: string) => {
      try {
        return await this.redisCache.client.hDel(defaultKey, key);
      } catch (error) {
        this.logger.error({ readData: 'removeData', error });
        return;
      }
    };

    const creds: AuthenticationCreds = (await readData('creds')) || initAuthCreds();

    return {
      state: {
        creds,
        keys: {
          get: async (type, ids: string[]) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const data: { [_: string]: SignalDataTypeMap[type] } = {};
            await Promise.all(
              ids.map(async (id) => {
                let value = await readData(`${type}-${id}`);
                if (type === 'app-state-sync-key' && value) {
                  value = proto.Message.AppStateSyncKeyData.fromObject(value);
                }

                data[id] = value;
              }),
            );

            return data;
          },
          set: async (data: any) => {
            const tasks: Promise<void>[] = [];
            for (const category in data) {
              for (const id in data[category]) {
                const value = data[category][id];
                const key = `${category}-${id}`;
                tasks.push(value ? await writeData(value, key) : await removeData(key));
              }
            }

            await Promise.all(tasks);
          },
        },
      },
      saveCreds: async () => {
        return await writeData(creds, 'creds');
      },
    };
  }
}
