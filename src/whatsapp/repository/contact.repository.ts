/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename contact.repository.ts                                              │
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
 * │ @constructs ContactRepository @extends Repository                            │
 * │ @param {IWebhookModel} webhookModel                                          │
 * │ @param {ConfigService} configService                                         │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { opendirSync, readFileSync } from 'fs';
import { join } from 'path';
import { ConfigService } from '../../config/env.config';
import { ContactRaw, IContactModel } from '../models';
import { IInsert, Repository } from '../abstract/abstract.repository';

export class ContactQuery {
  where: ContactRaw;
}

export class ContactRepository extends Repository {
  constructor(
    private readonly contactModel: IContactModel,
    private readonly configService: ConfigService,
  ) {
    super(configService);
  }

  public async insert(data: ContactRaw[], saveDb = false): Promise<IInsert> {
    if (data.length === 0) {
      return;
    }

    try {
      if (this.dbSettings.ENABLED && saveDb) {
        const insert = await this.contactModel.insertMany([...data]);
        return { insertCount: insert.length };
      }

      data.forEach((contact) => {
        this.writeStore({
          path: join(this.storePath, 'contacts', contact.owner),
          fileName: contact.id,
          data: contact,
        });
      });

      return { insertCount: data.length };
    } catch (error) {
      return error;
    } finally {
      data = undefined;
    }
  }

  public async find(query: ContactQuery): Promise<ContactRaw[]> {
    try {
      if (this.dbSettings.ENABLED) {
        return await this.contactModel.find({ ...query.where });
      }
      const contacts: ContactRaw[] = [];
      if (query?.where?.id) {
        contacts.push(
          JSON.parse(
            readFileSync(
              join(
                this.storePath,
                'contacts',
                query.where.owner,
                query.where.id + '.json',
              ),
              { encoding: 'utf-8' },
            ),
          ),
        );
      } else {
        const openDir = opendirSync(join(this.storePath, 'contacts', query.where.owner), {
          encoding: 'utf-8',
        });
        for await (const dirent of openDir) {
          if (dirent.isFile()) {
            contacts.push(
              JSON.parse(
                readFileSync(
                  join(this.storePath, 'contacts', query.where.owner, dirent.name),
                  { encoding: 'utf-8' },
                ),
              ),
            );
          }
        }
      }
      return contacts;
    } catch (error) {
      return [];
    }
  }
}
