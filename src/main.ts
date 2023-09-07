/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename main.ts                                                            │
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
 * │ @function initWA @param undefined                                            │
 * | @function bootstrap @param undefined                                         │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import compression from 'compression';
import { configService, Cors, HttpServer } from './config/env.config';
import cors from 'cors';
import express, { json, NextFunction, Request, Response, urlencoded } from 'express';
import { join } from 'path';
import { onUnexpectedError } from './config/error.config';
import { Logger } from './config/logger.config';
import { ROOT_DIR } from './config/path.config';
import { waMonitor } from './whatsapp/whatsapp.module';
import { HttpStatus, router } from './whatsapp/routers/index.router';
import 'express-async-errors';
import { ServerUP } from './utils/server-up';
import { swaggerRouter } from './docs/swagger.conf';
import session from 'express-session';

function initWA() {
  waMonitor.loadInstance();
}

function bootstrap() {
  const logger = new Logger('SERVER');
  const app = express();

  app.use(
    cors({
      origin(requestOrigin, callback) {
        const { ORIGIN } = configService.get<Cors>('CORS');
        if (ORIGIN.includes('*')) {
          return callback(null, true);
        }
        if (ORIGIN.indexOf(requestOrigin) !== -1) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      methods: [...configService.get<Cors>('CORS').METHODS],
      credentials: configService.get<Cors>('CORS').CREDENTIALS,
    }),
    urlencoded({ extended: true, limit: '50mb' }),
    json({ limit: '50mb' }),
    compression(),
  );

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

  app.use(
    (err: Error, req: Request, res: Response, next: NextFunction) => {
      if (err) {
        return res.status(err['status'] || 500).json(err);
      }
    },
    (req: Request, res: Response, next: NextFunction) => {
      const { method, url } = req;

      res.status(HttpStatus.NOT_FOUND).json({
        status: HttpStatus.NOT_FOUND,
        message: `Cannot ${method.toUpperCase()} ${url}`,
        error: 'Not Found',
      });

      next();
    },
  );

  const httpServer = configService.get<HttpServer>('SERVER');

  ServerUP.app = app;
  const server = ServerUP[httpServer.TYPE];

  server.listen(httpServer.PORT, () => {
    logger.log(httpServer.TYPE.toUpperCase() + ' - ON: ' + httpServer.PORT + '\n\n');
    new Logger('Swagger Docs').warn(
      `
      ┌──────────────────────────────┐
      │         Swagger Docs         │
      │  http://localhost:${httpServer.PORT}/docs  │
      └──────────────────────────────┘`.replace(/^ +/gm, '  '),
    );
  });

  initWA();

  onUnexpectedError();
}

bootstrap();
