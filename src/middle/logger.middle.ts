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

import { Request, Response } from 'express';
import { Logger } from '../config/logger.config';
import pinoHttp, { HttpLogger } from 'pino-http';
import { IncomingMessage, ServerResponse } from 'http';
import { randomUUID } from 'crypto';

export class LoggerMiddleware {
  constructor(logger: Logger) {
    this.log = pinoHttp({
      logger: logger.log,
      autoLogging: true,
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.password',
          'req.body.token',
        ],
        censor: '******************',
      },

      genReqId: (req) => {
        if (!req.headers?.['x-request-id']) {
          req.headers['x-request-id'] = randomUUID();
        }
        return req.headers['x-request-id'];
      },

      serializers: {
        req: (req: Request) => {
          return {
            id: req.id,
            method: req.method,
            url: req.url,
            host: req.host,
            ips: (req.headers?.['x-forwarded-for'] as string)?.split(',') ?? [
              req.headers?.['x-real-ip'] ??
                req.headers['x-request-ip'] ??
                req?.ip ??
                req?.['remoteAddress'],
            ],
            remoteAddress: req.socket?.remoteAddress,
            remotePort: req.socket?.remotePort,
            headers: req.headers,
            params: req.params ?? {},
          };
        },
        res: (res: Response) => ({ statusCode: res.statusCode }),
      },

      // customReceivedObject: (req, res, val) => ({
      //   ...val,
      //   category: 'application-event',
      //   eventCode: 'REQUEST_RECEIVED',
      // }),
      // customSuccessObject: (req, res, val) => ({
      //   ...val,
      //   category: 'application-event',
      //   eventCode:
      //     res.statusCode < 300
      //       ? 'REQUEST_PROCESSED'
      //       : res.statusCode < 400
      //         ? 'REQUEST_REDIRECT'
      //         : 'REQUEST_FAILED',
      // }),
      // customErrorObject: (req, res, val) => ({
      //   ...val,
      //   category: 'application-event',
      //   eventCode: 'REQUEST_FAILED',
      // }),
    });
  }

  private log: HttpLogger<IncomingMessage, ServerResponse<IncomingMessage>, never>;

  get use() {
    return this.log;
  }
}
