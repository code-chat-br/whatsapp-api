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

import { NextFunction, Request, Response } from 'express';
import { Logger } from '../config/logger.config';
import { Repository } from '../repository/repository.service';
import { ConfigService, Database } from '../config/env.config';

export class LoggerMiddleware {
  constructor(
    private readonly repository: Repository,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const logger = new Logger(this.configService, LoggerMiddleware.name);

    if (!this.configService.get<boolean>('PRODUCTION')) {
      logger.log({
        originalUrl: req.originalUrl,
        method: req.method.toUpperCase(),
        headers: JSON.stringify(req.headers),
        params: JSON.stringify(req?.params || {}),
        query: JSON.stringify(req?.query || {}),
        body: JSON.stringify(req?.body || {}),
      });
    }

    if (this.configService.get<Database>('DATABASE').DB_OPTIONS.ACTIVITY_LOGS) {
      this.repository.activityLogs
        .create({
          data: {
            context: 'LoggerMiddleware',
            type: 'http',
            content: {
              originalUrl: req.originalUrl,
              method: req.method.toUpperCase(),
              headers: JSON.stringify(req.headers),
              params: JSON.stringify(req?.params || {}),
              query: JSON.stringify(req?.query || {}),
              body: JSON.stringify(req?.body || {}),
            },
            description: 'Request received',
            instanceId: req?.params?.instanceId
              ? Number(req.params.instanceId)
              : undefined,
          },
        })
        .catch((error) => logger.error(error));
    }

    next();
  }
}
