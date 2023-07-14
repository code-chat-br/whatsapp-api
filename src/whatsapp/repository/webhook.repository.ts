/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename webhook.repository.ts                                              │
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
 * │ @constructs WebhookRepository @extends Repository                            │
 * │ @param {IWebhookModel} webhookModel                                          │
 * │ @param {ConfigService} configService                                         │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { IInsert, Repository } from '../abstract/abstract.repository';
import { ConfigService } from '../../config/env.config';
import { join } from 'path';
import { readFileSync } from 'fs';
import { IWebhookModel, WebhookRaw } from '../models';

export class WebhookRepository extends Repository {
  constructor(
    private readonly webhookModel: IWebhookModel,
    private readonly configService: ConfigService,
  ) {
    super(configService);
  }

  public async create(data: WebhookRaw, instance: string): Promise<IInsert> {
    try {
      if (this.dbSettings.ENABLED) {
        const insert = await this.webhookModel.replaceOne(
          { _id: instance },
          { ...data },
          { upsert: true },
        );
        return { insertCount: insert.modifiedCount };
      }

      this.writeStore<WebhookRaw>({
        path: join(this.storePath, 'webhook'),
        fileName: instance,
        data,
      });

      return { insertCount: 1 };
    } catch (error) {
      return error;
    }
  }

  public async find(instance: string): Promise<WebhookRaw> {
    try {
      if (this.dbSettings.ENABLED) {
        return await this.webhookModel.findOne({ _id: instance });
      }

      return JSON.parse(
        readFileSync(join(this.storePath, 'webhook', instance + '.json'), {
          encoding: 'utf-8',
        }),
      ) as WebhookRaw;
    } catch (error) {
      return {};
    }
  }
}
