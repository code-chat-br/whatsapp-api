/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename auth.service.ts                                                    │
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
 * │ @class OldToken                                                              │
 * │                                                                              │
 * │ @class                                                                       │
 * │ @constructs AuthService                                                      │
 * │ @param {ConfigService} configService                                         │
 * │ @param {WAMonitoringService} waMonitor                                       │
 * │ @param {RepositoryBroker} repository                                         │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { Auth, ConfigService, Webhook } from '../../config/env.config';
import { InstanceDto } from '../dto/instance.dto';
import { name as apiName } from '../../../package.json';
import { verify, sign } from 'jsonwebtoken';
import { Logger } from '../../config/logger.config';
import { v4 } from 'uuid';
import { isJWT } from 'class-validator';
import { BadRequestException } from '../../exceptions';
import axios from 'axios';
import { WAMonitoringService } from './monitor.service';
import { RepositoryBroker } from '../repository/repository.manager';

export type JwtPayload = {
  instanceName: string;
  apiName: string;
  jwt?: string;
  apikey?: string;
  tokenId: string;
};

export class OldToken {
  oldToken: string;
}

export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly waMonitor: WAMonitoringService,
    private readonly repository: RepositoryBroker,
  ) {}

  private readonly logger = new Logger(AuthService.name);

  private async jwt(instance: InstanceDto) {
    const jwtOpts = this.configService.get<Auth>('AUTHENTICATION').JWT;
    const token = sign(
      {
        instanceName: instance.instanceName,
        apiName,
        tokenId: v4(),
      },
      jwtOpts.SECRET,
      { expiresIn: jwtOpts.EXPIRIN_IN, encoding: 'utf8', subject: 'g-t' },
    );

    const auth = await this.repository.auth.create({ jwt: token }, instance.instanceName);

    if (auth['error']) {
      this.logger.error({
        localError: AuthService.name + '.jwt',
        error: auth['error'],
      });
      throw new BadRequestException('Authentication error', auth['error']?.toString());
    }

    return { jwt: token };
  }

  private async apikey(instance: InstanceDto) {
    const apikey = v4().toUpperCase();

    const auth = await this.repository.auth.create({ apikey }, instance.instanceName);

    if (auth['error']) {
      this.logger.error({
        localError: AuthService.name + '.jwt',
        error: auth['error'],
      });
      throw new BadRequestException('Authentication error', auth['error']?.toString());
    }

    return { apikey };
  }

  public async generateHash(instance: InstanceDto) {
    const options = this.configService.get<Auth>('AUTHENTICATION');
    return (await this[options.TYPE](instance)) as { jwt: string } | { apikey: string };
  }

  public async refreshToken({ oldToken }: OldToken) {
    if (!isJWT(oldToken)) {
      throw new BadRequestException('Invalid "oldToken"');
    }

    try {
      const jwtOpts = this.configService.get<Auth>('AUTHENTICATION').JWT;
      const decode = verify(oldToken, jwtOpts.SECRET, {
        ignoreExpiration: true,
      }) as Pick<JwtPayload, 'apiName' | 'instanceName' | 'tokenId'>;

      const tokenStore = await this.repository.auth.find(decode.instanceName);

      const decodeTokenStore = verify(tokenStore.jwt, jwtOpts.SECRET, {
        ignoreExpiration: true,
      }) as Pick<JwtPayload, 'apiName' | 'instanceName' | 'tokenId'>;

      if (decode.tokenId !== decodeTokenStore.tokenId) {
        throw new BadRequestException('Invalid "oldToken"');
      }

      const token = {
        jwt: (await this.jwt({ instanceName: decode.instanceName })).jwt,
        instanceName: decode.instanceName,
      };

      try {
        const webhook = await this.repository.webhook.find(decode.instanceName);
        if (
          webhook?.enabled &&
          this.configService.get<Webhook>('WEBHOOK').EVENTS.NEW_JWT_TOKEN
        ) {
          const httpService = axios.create({ baseURL: webhook.url });
          await httpService.post(
            '',
            {
              event: 'new.jwt',
              instance: decode.instanceName,
              data: token,
            },
            { params: { owner: this.waMonitor.waInstances[decode.instanceName].wuid } },
          );
        }
      } catch (error) {
        this.logger.error(error);
      }

      return token;
    } catch (error) {
      this.logger.error({
        localError: AuthService.name + '.refreshToken',
        error,
      });
      throw new BadRequestException('Invalid "oldToken"');
    }
  }
}
