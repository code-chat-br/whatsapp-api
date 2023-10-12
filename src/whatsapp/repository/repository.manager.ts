/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename repository.manager.ts                                              │
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
 * │ @constructs RepositoryBroker                                                 │
 * │ @param {MessageRepository} message                                           │
 * │ @param {ChatRepository} chat                                                 │
 * │ @param {ContactRepository} contact                                           │
 * │ @param {MessageUpRepository} messageUpdate                                   │
 * │ @param {WebhookRepository} webhook                                           │
 * │ @param {AuthRepository} auth                                                 │
 * │ @param {ConfigService} configService                                         │
 * │ @param {MongoClient} dbServer                                                │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { MessageRepository } from './message.repository';
import { ChatRepository } from './chat.repository';
import { ContactRepository } from './contact.repository';
import { MessageUpRepository } from './messageUp.repository';
import { MongoClient } from 'mongodb';
import { WebhookRepository } from './webhook.repository';
import { AuthRepository } from './auth.repository';
import { Auth, ConfigService, Database } from '../../config/env.config';
import { execSync } from 'child_process';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
export class RepositoryBroker {
  constructor(
    public readonly message: MessageRepository,
    public readonly chat: ChatRepository,
    public readonly contact: ContactRepository,
    public readonly messageUpdate: MessageUpRepository,
    public readonly webhook: WebhookRepository,
    public readonly auth: AuthRepository,
    private configService: ConfigService,
    dbServer?: MongoClient,
  ) {
    this.dbClient = dbServer;
    this.__init_repo_without_db__();
  }

  private dbClient?: MongoClient;

  public get dbServer() {
    return this.dbClient;
  }

  private __init_repo_without_db__() {
    if (!this.configService.get<Database>('DATABASE').ENABLED) {
      // const storePath = join(process.cwd(), 'store');
      // execSync(
      //   `mkdir -p ${join(
      //     storePath,
      //     'auth',
      //     this.configService.get<Auth>('AUTHENTICATION').TYPE,
      //   )}`,
      // );

      const createDirectoryIfNotExists = (dir: string) => {
        if (!existsSync(dir)) {
          mkdirSync(dir);
        }
      };

      const storePath = join(process.cwd(), 'store');
      const authType = this.configService.get<Auth>('AUTHENTICATION').TYPE;

      createDirectoryIfNotExists(join(storePath, 'auth', authType));
      createDirectoryIfNotExists(join(storePath, 'chats'));
      createDirectoryIfNotExists(join(storePath, 'contacts'));
      createDirectoryIfNotExists(join(storePath, 'messages'));
      createDirectoryIfNotExists(join(storePath, 'message-up'));
      createDirectoryIfNotExists(join(storePath, 'webhook'));
    }
  }
}
