/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename auth.repository.ts                                                 │
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
 * │ @constructs AuthRepository @extends Repository                               │
 * │ @param {IWebhookModel} webhookModel                                          │
 * │ @param {ConfigService} configService                                         │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { join } from 'path';
import { Auth, ConfigService } from '../../config/env.config';
import { IInsert, Repository } from '../abstract/abstract.repository';
import { IAuthModel, AuthRaw } from '../models';
import { readFileSync, readdirSync } from 'fs';
import { AUTH_DIR } from '../../config/path.config';

export class AuthRepository extends Repository {
  constructor(
    private readonly authModel: IAuthModel,
    readonly configService: ConfigService,
  ) {
    super(configService);
    this.auth = configService.get<Auth>('AUTHENTICATION');
  }

  private readonly auth: Auth;

  public async create(data: AuthRaw, instance: string): Promise<IInsert> {
    try {
      if (this.dbSettings.ENABLED) {
        const insert = await this.authModel.replaceOne(
          { _id: instance },
          { ...data },
          { upsert: true },
        );
        return { insertCount: insert.modifiedCount };
      }

      this.writeStore<AuthRaw>({
        path: join(AUTH_DIR, this.auth.TYPE),
        fileName: instance,
        data,
      });

      return { insertCount: 1 };
    } catch (error) {
      return { error } as any;
    }
  }

  public async find(instance: string): Promise<AuthRaw> {
    try {
      if (this.dbSettings.ENABLED) {
        return await this.authModel.findOne({ _id: instance });
      }

      let authRaw: string;

      if (readdirSync(join(AUTH_DIR, 'jwt')).find((i) => i === instance)) {
        authRaw = readFileSync(join(AUTH_DIR, 'jwt', instance + '.json'), {
          encoding: 'utf-8',
        });
      } else {
        authRaw = readFileSync(join(AUTH_DIR, 'apikey', instance + '.json'), {
          encoding: 'utf-8',
        });
      }

      return JSON.parse(authRaw) as AuthRaw;
    } catch (error) {
      return {};
    }
  }
}
