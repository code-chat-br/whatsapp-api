/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @filename newsletter.controller.ts                                           │
 * │ Creation date: Jul 28, 2026                                                  │
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
 * │ @constructs NewsletterController                                             │
 * │ @param {WAMonitoringService} waMonitor                                       │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { InstanceDto } from '../dto/instance.dto';
import {
  CreateNewsletterDto,
  FetchNewsletterMessagesDto,
  NewsletterJid,
  UpdateNewsletterDto,
} from '../dto/newsletter.dto';
import { WAMonitoringService } from '../services/monitor.service';

export class NewsletterController {
  constructor(private readonly waMonitor: WAMonitoringService) {}

  public async createNewsletter({ instanceName }: InstanceDto, create: CreateNewsletterDto) {
    return await this.waMonitor.waInstances.get(instanceName).createNewsletter(create);
  }

  public async allNewsletters({ instanceName }: InstanceDto) {
    return await this.waMonitor.waInstances.get(instanceName).findAllNewsletters();
  }

  public async findNewsletter({ instanceName }: InstanceDto, data: NewsletterJid) {
    return await this.waMonitor.waInstances.get(instanceName).findNewsletter(data);
  }

  public async subscribers({ instanceName }: InstanceDto, data: NewsletterJid) {
    return await this.waMonitor.waInstances.get(instanceName).newsletterSubscribers(data);
  }

  public async updateNewsletter({ instanceName }: InstanceDto, update: UpdateNewsletterDto) {
    return await this.waMonitor.waInstances.get(instanceName).updateNewsletter(update);
  }

  public async fetchMessages(
    { instanceName }: InstanceDto,
    data: FetchNewsletterMessagesDto,
  ) {
    return await this.waMonitor.waInstances
      .get(instanceName)
      .fetchNewsletterMessages(data);
  }
}
