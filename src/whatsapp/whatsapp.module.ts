/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename whatsapp.module.ts                                                 │
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
 * │ @constant logger @constant messageRepository @constant chatRepository        │
 * │ @constant contactRepository @constant messageUpdateRepository                │
 * │ @constant webhookRepository @constant authRepository @constant repository    │
 * │ @constant cache @constant authService @constant webhookService               │
 * │ @constant webhookController @constant instanceController                     │
 * │ @constant viewsController @constant sendMessageController                    │
 * │ @constant chatController @constant groupController                           │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { configService } from '../config/env.config';
import { Logger } from '../config/logger.config';
import { eventEmitter } from '../config/event.config';
import { MessageRepository } from './repository/message.repository';
import { WAMonitoringService } from './services/monitor.service';
import { ChatRepository } from './repository/chat.repository';
import { ContactRepository } from './repository/contact.repository';
import { MessageUpRepository } from './repository/messageUp.repository';
import { ChatController } from './controllers/chat.controller';
import { InstanceController } from './controllers/instance.controller';
import { SendMessageController } from './controllers/sendMessage.controller';
import { AuthService } from './services/auth.service';
import { GroupController } from './controllers/group.controller';
import { ViewsController } from './controllers/views.controller';
import { WebhookService } from './services/webhook.service';
import { WebhookController } from './controllers/webhook.controller';
import { RepositoryBroker } from './repository/repository.manager';
import {
  AuthModel,
  ChatModel,
  ContactModel,
  MessageModel,
  MessageUpModel,
} from './models';
import { dbserver } from '../db/db.connect';
import { WebhookRepository } from './repository/webhook.repository';
import { WebhookModel } from './models/webhook.model';
import { AuthRepository } from './repository/auth.repository';
import { RedisCache } from '../db/redis.client';

const logger = new Logger('WA MODULE');

const messageRepository = new MessageRepository(MessageModel, configService);
const chatRepository = new ChatRepository(ChatModel, configService);
const contactRepository = new ContactRepository(ContactModel, configService);
const messageUpdateRepository = new MessageUpRepository(MessageUpModel, configService);
const webhookRepository = new WebhookRepository(WebhookModel, configService);
const authRepository = new AuthRepository(AuthModel, configService);

export const repository = new RepositoryBroker(
  messageRepository,
  chatRepository,
  contactRepository,
  messageUpdateRepository,
  webhookRepository,
  authRepository,
  configService,
  dbserver?.getClient(),
);

export const cache = new RedisCache();

export const waMonitor = new WAMonitoringService(
  eventEmitter,
  configService,
  repository,
  cache,
);

const authService = new AuthService(configService, waMonitor, repository);

const webhookService = new WebhookService(waMonitor);

export const webhookController = new WebhookController(webhookService);

export const instanceController = new InstanceController(
  waMonitor,
  configService,
  repository,
  eventEmitter,
  authService,
  cache,
);
export const viewsController = new ViewsController(waMonitor, repository);
export const sendMessageController = new SendMessageController(waMonitor);
export const chatController = new ChatController(waMonitor);
export const groupController = new GroupController(waMonitor);

logger.info('Module - ON');
