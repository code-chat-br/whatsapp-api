/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename webhook.service.ts                                                 │
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
 * │ @constructs waMonitor                                                        │
 * │ @param {WAMonitoringService} waMonitor                                       │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { BadRequestException } from '../../exceptions';
import { Repository } from '../../repository/repository.service';
import { InstanceDto } from '../dto/instance.dto';
import { WebhookDto } from '../dto/webhook.dto';
import { WAMonitoringService } from './monitor.service';

export class WebhookService {
  constructor(
    private readonly waMonitor: WAMonitoringService,
    private readonly repository: Repository,
  ) {}

  public async create({ instanceName }: InstanceDto, data: WebhookDto) {
    try {
      const instance = this.waMonitor.waInstances.get(instanceName);
      if (!instance) {
        const i = await this.repository.instance.findUnique({
          where: { name: instanceName },
          select: {
            id: true,
            Webhook: true,
          },
        });
        if (!i) {
          throw new Error('Instance not found');
        }

        if (i?.Webhook) {
          const update = await this.repository.webhook.update({
            where: { id: i.Webhook.id },
            data: {
              url: data.url,
              enabled: data.enabled,
            },
          });
          if (data?.events) {
            update.events = data.events as any;
            await this.repository.updateWebhook(update.id, update);
          }

          return update;
        }

        return await this.repository.webhook.create({
          data: {
            url: data.url,
            enabled: data.enabled,
            events: data?.events as any,
            instanceId: i.id,
          },
        });
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    return await this.waMonitor.waInstances.get(instanceName).setWebhook(data as any);
  }

  public async find({ instanceName }: InstanceDto) {
    try {
      return await this.repository.webhook.findFirst({
        where: { Instance: { name: instanceName } },
      });
    } catch (error) {
      return { enabled: null, url: '' };
    }
  }
}
