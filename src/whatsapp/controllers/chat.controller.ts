/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename chat.controller.ts                                                 │
 * │ Developed by: Cleber Wilson                                                  │
 * │ Creation date: Jul 17, 2022                                                  │
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
 * │ @constructs ChatController                                                   │
 * │ @param {WAMonitoringService} waMonit                                         │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import {
  ArchiveChatDto,
  DeleteMessage,
  NumberDto,
  ReadMessageDto,
  UpdatePresenceDto,
  WhatsAppNumberDto,
  ReadMessageIdDto,
  RejectCallDto,
  EditMessage,
} from '../dto/chat.dto';
import { InstanceDto } from '../dto/instance.dto';
import { WAMonitoringService } from '../services/monitor.service';
import { Query } from '../../repository/repository.service';
import { Contact, Message } from '@prisma/client';

export class ChatController {
  constructor(private readonly waMonitor: WAMonitoringService) {}

  public async whatsappNumber({ instanceName }: InstanceDto, data: WhatsAppNumberDto) {
    return await this.waMonitor.waInstances.get(instanceName).whatsappNumber(data);
  }

  /**
   * @deprecated
   */
  public async readMessage({ instanceName }: InstanceDto, data: ReadMessageDto) {
    return await this.waMonitor.waInstances.get(instanceName).markMessageAsRead(data);
  }

  public async readMessagesForId({ instanceName }: InstanceDto, data: ReadMessageIdDto) {
    return await this.waMonitor.waInstances.get(instanceName).readMessages(data);
  }

  public async archiveChat({ instanceName }: InstanceDto, data: ArchiveChatDto) {
    return await this.waMonitor.waInstances.get(instanceName).archiveChat(data);
  }

  public async deleteChat({ instanceName }: InstanceDto, data: string) {
    return await this.waMonitor.waInstances.get(instanceName).deleteChat(data);
  }

  public async deleteMessage({ instanceName }: InstanceDto, data: DeleteMessage) {
    return await this.waMonitor.waInstances.get(instanceName).deleteMessage(data);
  }

  public async fetchProfilePicture({ instanceName }: InstanceDto, data: NumberDto) {
    return await this.waMonitor.waInstances.get(instanceName).profilePicture(data.number);
  }

  public async fetchContacts({ instanceName }: InstanceDto, query: Query<Contact>) {
    return await this.waMonitor.waInstances.get(instanceName).fetchContacts(query);
  }

  public async updatePresence({ instanceName }: InstanceDto, data: UpdatePresenceDto) {
    return await this.waMonitor.waInstances.get(instanceName).updatePresence(data);
  }

  public async getBinaryMediaFromMessage(
    { instanceName }: InstanceDto,
    message: Message,
  ) {
    return await this.waMonitor.waInstances.get(instanceName).getMediaMessage(message);
  }

  public async fetchMessages({ instanceName }: InstanceDto, query: Query<Message>) {
    return await this.waMonitor.waInstances.get(instanceName).fetchMessages(query);
  }

  public async fetchChats({ instanceName }: InstanceDto, type?: string) {
    return await this.waMonitor.waInstances.get(instanceName).fetchChats(type);
  }

  public async rejectCall({ instanceName }: InstanceDto, data: RejectCallDto) {
    return await this.waMonitor.waInstances.get(instanceName).rejectCall(data);
  }

  public async assertSessions({ instanceName }: InstanceDto, data: WhatsAppNumberDto) {
    return await this.waMonitor.waInstances
      .get(instanceName)
      .assertSessions(data.numbers);
  }

  public async editMessage({ instanceName }: InstanceDto, data: EditMessage) {
    return await this.waMonitor.waInstances.get(instanceName).editMessage(data);
  }
}
