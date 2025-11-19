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
 * | @function bootstrap @param undefined                                         │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { ConfigService, HttpServer } from './config/env.config';
import { onUnexpectedError } from './config/error.config';
import { Logger } from './config/logger.config';
import { AppModule } from './app.module';

const context = new Map<string, any>();

export async function bootstrap() {
  await AppModule(context);

  const configService = context.get('module:config') as ConfigService;

  const logger = new Logger(configService, 'SERVER');

  context.get('module:logger').info('INITIALIZER');
  context.set('server:logger', logger);

  const httpServer = configService.get<HttpServer>('SERVER');

  context.get('app').listen(httpServer.PORT, () => {
    logger.log('HTTP' + ' - ON: ' + httpServer.PORT);
    new Logger(configService, 'Swagger Docs').warn(
      `
        ..
        .       Swagger Docs
        . http://localhost:${httpServer.PORT}/docs
        . https://${process.env?.API_BACKEND || 'no-value'}/docs
        .. `.replace(/^ +/gm, '  '),
    );
  });

  onUnexpectedError(configService);
}

bootstrap();

process.on('SIGINT', async () => {
  context.get('module:provider').onModuleDestroy();
  context.get('module:repository').onModuleDestroy();
  context.get('module:logger').warn('APP MODULE - OFF');
  context.get('server:logger').warn('HTTP - OFF');
  process.exit(0);
});
