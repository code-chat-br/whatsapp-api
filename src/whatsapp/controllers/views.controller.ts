/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename views.controller.ts                                                │
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
 * │ @constructs ViewsController                                                  │
 * │ @param {WAMonitoringService} waMonit                                         │
 * │ @param {ConfigService} configService                                         │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { Request, Response } from 'express';
import { BadRequestException } from '../../exceptions';
import { InstanceDto } from '../dto/instance.dto';
import { HttpStatus } from '../routers/index.router';
import { WAMonitoringService } from '../services/monitor.service';
import { AuthRaw } from '../models';
import { RepositoryBroker } from '../repository/repository.manager';

export class ViewsController {
  constructor(
    private readonly waMonit: WAMonitoringService,
    private readonly repository: RepositoryBroker,
  ) {}

  public async qrcode(request: Request, response: Response) {
    try {
      const param = request.params as unknown as InstanceDto;
      const instance = this.waMonit.waInstances[param.instanceName];
      if (instance.connectionStatus.state === 'open') {
        throw new BadRequestException('The instance is already connected');
      }

      let auth: AuthRaw;

      if (!request?.session?.[param.instanceName]) {
        auth = await this.repository.auth.find(param.instanceName);
      } else {
        auth = JSON.parse(
          Buffer.from(request.session[param.instanceName], 'base64').toString('utf8'),
        ) as AuthRaw;
      }

      const type = auth?.jwt ? 'jwt' : 'apikey';

      return response.status(HttpStatus.OK).render('qrcode', {
        ...param,
        type,
        auth,
        connectionState: instance.connectionStatus.state,
      });
    } catch (error) {
      console.log('ERROR: ', error);
    }
  }
}
