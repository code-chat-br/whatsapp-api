/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename whatsapp.module.ts                                                 │
 * │ Developed by: Cleber Wilson                                                  │
 * │ Creation date: Dez 06, 2022                                                  │
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
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import express, {
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router,
  json,
  urlencoded,
} from 'express';
import { Logger } from './config/logger.config';
import { S3Service } from './integrations/minio/s3.service';
import { Repository } from './repository/repository.service';
import { RedisCache } from './cache/redis';
import { ConfigService } from './config/env.config';
import { TypebotService } from './integrations/typebot/typebot.service';
import { eventEmitter } from './config/event.config';
import { ChatController } from './whatsapp/controllers/chat.controller';
import { GroupController } from './whatsapp/controllers/group.controller';
import { InstanceController } from './whatsapp/controllers/instance.controller';
import { SendMessageController } from './whatsapp/controllers/sendMessage.controller';
import { ViewsController } from './whatsapp/controllers/views.controller';
import { WebhookController } from './whatsapp/controllers/webhook.controller';
import { InstanceService } from './whatsapp/services/instance.service';
import { WAMonitoringService } from './whatsapp/services/monitor.service';
import { WebhookService } from './whatsapp/services/webhook.service';
import { S3Router } from './integrations/minio/s3.router';
import { TypebotRouter } from './integrations/typebot/typebot.router';
import { ChatRouter } from './whatsapp/routers/chat.router';
import { InstanceRouter } from './whatsapp/routers/instance.router';
import { ViewsRouter } from './whatsapp/routers/view.router';
import { MessageRouter } from './whatsapp/routers/sendMessage.router';
import { GroupRouter } from './whatsapp/routers/group.router';
import { WebhookRouter } from './whatsapp/routers/webhook.router';
import session from 'express-session';
import { swaggerRouter } from './config/swagger.config';
import { ROOT_DIR } from './config/path.config';
import { join } from 'path';
import { LoggerMiddleware } from './middle/logger.middle';
import { InstanceGuard } from './guards/instance.guard';
import { JwtGuard } from './guards/auth.guard';
import { ErrorMiddle } from './middle/error.middle';
import 'express-async-errors';

export function describeRoutes(
  rootPath: string,
  router: Router,
  logger: Logger,
): RequestHandler[] {
  for (const r of router.stack) {
    if (r.route) {
      const { path } = r.route;
      const authType = r.route.stack[0].method.toUpperCase();
      logger.subContext('ROUTE');
      logger.info(`[${authType}] ${rootPath}${path}`);
      logger.subContext();
    }
  }

  return [rootPath, router] as RequestHandler[];
}

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NOT_FOUND = 404,
  FORBIDDEN = 403,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  INTERNAL_SERVER_ERROR = 500,
}

export async function AppModule(context: Map<string, any>) {
  const app = express();

  const configService = new ConfigService();

  const logger = new Logger(configService, 'APP MODULE');

  const redisCache = new RedisCache(configService);
  logger.info('Cache:Redis - ON');
  await redisCache.onModuleInit();

  const repository = new Repository(configService);
  logger.info('Repository - ON');
  await repository.onModuleInit();

  const waMonitor = new WAMonitoringService(
    eventEmitter,
    configService,
    repository,
    redisCache,
  );

  logger.info('WAMonitoringService - ON');
  await waMonitor.loadInstance();
  logger.info('Load Instances - ON');

  const middlewares = [
    async (req: Request, res: Response, next: NextFunction) =>
      await new LoggerMiddleware(repository, configService).use(req, res, next),
    async (req: Request, res: Response, next: NextFunction) =>
      await new JwtGuard(configService).canActivate(req, res, next),
    async (req: Request, res: Response, next: NextFunction) =>
      await new InstanceGuard(waMonitor, redisCache).canActivate(req, res, next),
  ];
  logger.info('Middlewares - ON');

  const webhookService = new WebhookService(waMonitor, repository);
  logger.info('WebhookService - ON');

  const instanceService = new InstanceService(configService, waMonitor, repository);
  logger.info('InstanceService - ON');
  const instanceController = new InstanceController(
    waMonitor,
    configService,
    repository,
    eventEmitter,
    instanceService,
    redisCache,
  );
  logger.info('InstanceController - ON');

  const instanceRouter = InstanceRouter(instanceController, ...middlewares);
  logger.info('InstanceRouter - ON');

  const viewsController = new ViewsController(waMonitor, repository);
  logger.info('ViewsController - ON');
  const viewsRouter = ViewsRouter(viewsController, ...middlewares);

  const sendMessageController = new SendMessageController(waMonitor);
  logger.info('SendMessageController - ON');
  const messageRouter = MessageRouter(sendMessageController, ...middlewares);

  const chatController = new ChatController(waMonitor);
  logger.info('ChatController - ON');
  const chatRouter = ChatRouter(chatController, ...middlewares);
  logger.info('ChatRouter - ON');

  const groupController = new GroupController(waMonitor);
  logger.info('GroupController - ON');
  const groupRouter = GroupRouter(groupController, ...middlewares);
  logger.info('GroupRouter - ON');

  const webhookController = new WebhookController(webhookService);
  logger.info('WebhookController - ON');
  const webhookRouter = WebhookRouter(webhookController, ...middlewares);
  logger.info('WebhookRouter - ON');

  const s3Service = new S3Service(repository);
  const s3Router = S3Router(s3Service, ...middlewares);
  logger.info('Integration:S3Service - ON');

  const typebotService = new TypebotService(repository, configService);
  typebotService.load();
  const typebotRouter = TypebotRouter(typebotService, ...middlewares);
  logger.info('Integration:TypebotService - ON');

  const router = Router();
  router.use(...describeRoutes('/instance', instanceRouter, logger));
  router.use(...describeRoutes('/instance', viewsRouter, logger));
  router.use(...describeRoutes('/message', messageRouter, logger));
  router.use(...describeRoutes('/chat', chatRouter, logger));
  router.use(...describeRoutes('/group', groupRouter, logger));
  router.use(...describeRoutes('/webhook', webhookRouter, logger));
  router.use(...describeRoutes('/s3', s3Router, logger));
  router.use(...describeRoutes('/typebot', typebotRouter, logger));

  app.use(urlencoded({ extended: true, limit: '100mb' }), json({ limit: '100mb' }));

  app.use(
    session({
      secret: configService.get<string>('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      name: 'codechat.api.sid',
    }),
  );

  app.set('view engine', 'hbs');
  app.set('views', join(ROOT_DIR, 'views'));
  app.use(express.static(join(ROOT_DIR, 'public')));

  app.use('/', router);

  app.use(swaggerRouter);

  app.use(ErrorMiddle.appError, ErrorMiddle.pageNotFound);

  app['close'] = async () => {
    await repository.onModuleDestroy();
    await redisCache.onModuleDestroy();
  };

  context.set('app', app);
  context.set('module:logger', logger);
  context.set('module:repository', repository);
  context.set('module:redisCache', redisCache);
  context.set('module:config', configService);
}
