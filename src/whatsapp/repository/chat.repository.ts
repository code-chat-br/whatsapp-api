/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename chat.repository.ts                                                 │
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
 * │ @constructs ChatRepository @extends Repository                               │
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
import { ConfigService } from '../../config/env.config';
import { IInsert, Repository } from '../abstract/abstract.repository';
import { opendirSync, readFileSync, rmSync } from 'fs';
import { ChatRaw, IChatModel } from '../models';

export class ChatQuery {
  where: ChatRaw;
}

export class ChatRepository extends Repository {
  constructor(
    private readonly chatModel: IChatModel,
    private readonly configService: ConfigService,
  ) {
    super(configService);
  }

  public async insert(data: ChatRaw[], saveDb = false): Promise<IInsert> {
    if (data.length === 0) {
      return;
    }

    try {
      if (this.dbSettings.ENABLED && saveDb) {
        const insert = await this.chatModel.insertMany([...data]);
        return { insertCount: insert.length };
      }

      data.forEach((chat) => {
        this.writeStore<ChatRaw>({
          path: join(this.storePath, 'chats', chat.owner),
          fileName: chat.id,
          data: chat,
        });
      });

      return { insertCount: data.length };
    } catch (error) {
      return error;
    } finally {
      data = undefined;
    }
  }

  public async find(query: ChatQuery): Promise<ChatRaw[]> {
    try {
      if (this.dbSettings.ENABLED) {
        return await this.chatModel.find({ owner: query.where.owner });
      }

      const chats: ChatRaw[] = [];
      const openDir = opendirSync(join(this.storePath, 'chats', query.where.owner));
      for await (const dirent of openDir) {
        if (dirent.isFile()) {
          chats.push(
            JSON.parse(
              readFileSync(
                join(this.storePath, 'chats', query.where.owner, dirent.name),
                { encoding: 'utf-8' },
              ),
            ),
          );
        }
      }

      return chats;
    } catch (error) {
      return [];
    }
  }

  public async delete(query: ChatQuery) {
    try {
      if (this.dbSettings.ENABLED) {
        return await this.chatModel.deleteOne({ ...query.where });
      }

      rmSync(join(this.storePath, 'chats', query.where.owner, query.where.id + '.josn'), {
        force: true,
        recursive: true,
      });

      return { deleted: { chatId: query.where.id } };
    } catch (error) {
      return { error: error?.toString() };
    }
  }
}
