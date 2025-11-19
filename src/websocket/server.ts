/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename server.ts                                                          │
 * │ Developed by: Cleber Wilson                                                  │
 * │ Creation date: Jul 08, 2024                                                  │
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
 * │ @constructs Websocket                                                        │
 * │ @param {ConfigService} configService                                         │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import Ws from 'ws';
import { Logger } from '../config/logger.config';
import { Auth, ConfigService } from '../config/env.config';
import { Server } from 'http';
import { isJWT } from 'class-validator';
import { verify } from 'jsonwebtoken';
import { JwtPayload } from '../whatsapp/services/instance.service';
import { EventsType, ListEvents } from '../whatsapp/dto/webhook.dto';

export class Websocket {
  constructor(private readonly configService: ConfigService) {}

  private readonly logger = new Logger(this.configService, Websocket.name);

  private readonly hub = new Map<string, Ws>();

  send<T>(instance: string, event: EventsType, data: T): boolean {
    const key = `${instance}_${event}`;
    const client = this.hub.get(key);

    if (!client) {
      return;
    }

    const json = JSON.stringify(data);
    client.send(json);
  }

  server(server: Server) {
    const wss = new Ws.Server({ noServer: true });

    let key = '';
    let canActivate = false;

    wss.on('connection', (ws, req) => {
      if (!canActivate) {
        ws.close(401, 'HTTP/1.1 401 Unauthorized');
        return;
      }
      this.hub.set(key, ws);
    });

    server.on('upgrade', (req, socket, head) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const params = url.searchParams;

      const event = params.get('event') as EventsType;
      const token = params.get('token');

      try {
        if (
          url.pathname !== '/ws/events' ||
          !event ||
          !token ||
          !isJWT(token) ||
          !ListEvents.includes(event)
        ) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        const jwtOpts = this.configService.get<Auth>('AUTHENTICATION').JWT;
        const decode = verify(token, jwtOpts.SECRET, {
          ignoreExpiration: jwtOpts.EXPIRIN_IN === 0,
        }) as JwtPayload;

        canActivate = true;

        if (!canActivate) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }
        key = `${decode.instanceName}_${event}`;

        wss.handleUpgrade(req, socket, head, (socket) => {
          wss.emit('connection', socket, req);
        });
      } catch (error) {
        this.logger.error(error);
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
    });
  }
}
