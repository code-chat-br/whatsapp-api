import { configService } from '../config/env.config';
import { Logger } from '../config/logger.config';
import { eventeEmitter } from '../config/event.config';
import { RepositoryBroker } from './repository/index.repository';
import { MessageRepository } from './repository/message.repository';
import { WAMonitoringService } from './services/monitor.service';
import { MessageModel, MessageUpModel } from './models/message.model';
import { ChatRepository } from './repository/chat.repository';
import { ChatModel } from './models/chat.model';
import { ContactRepository } from './repository/contact.repository';
import { ContactModel } from './models/contact.model';
import { MessageUpRepository } from './repository/messageUp.repository';
import { ChatController } from './controllers/chat.controller';
import { InstanceController } from './controllers/instance.controller';
import { SendMessageController } from './controllers/sendMessage.controller';
import { AuthService } from './services/auth.service';
import { GroupController } from './controllers/group.controller';
import { ViewsController } from './controllers/views.controller';
import { WebhookService } from './services/webhook.service';
import { WebhookController } from './controllers/webhook.controller';

const logger = new Logger('WA MODULE');

const messageRepository = new MessageRepository(MessageModel, configService);
const chatRepository = new ChatRepository(ChatModel, configService);
const contactRepository = new ContactRepository(ContactModel, configService);
const messageUpdateRepository = new MessageUpRepository(MessageUpModel, configService);

const repository = new RepositoryBroker(
  messageRepository,
  chatRepository,
  contactRepository,
  messageUpdateRepository,
);

const authService = new AuthService(configService);

export const waMonitor = new WAMonitoringService(
  eventeEmitter,
  configService,
  repository,
);

const webhookService = new WebhookService(waMonitor);

export const webhookController = new WebhookController(webhookService);

export const instanceController = new InstanceController(
  waMonitor,
  configService,
  repository,
  eventeEmitter,
  authService,
);
export const viewsController = new ViewsController(waMonitor, configService);
export const sendMessageController = new SendMessageController(waMonitor);
export const chatController = new ChatController(waMonitor);
export const groupController = new GroupController(waMonitor);

logger.info('Module - ON');
