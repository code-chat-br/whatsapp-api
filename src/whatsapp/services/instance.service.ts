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

import { Auth, ConfigService } from '../../config/env.config';
import { InstanceDto } from '../dto/instance.dto';
import { name as apiName } from '../../../package.json';
import { verify, sign } from 'jsonwebtoken';
import { Logger } from '../../config/logger.config';
import { isArray, isJWT } from 'class-validator';
import { BadRequestException } from '../../exceptions';
import axios from 'axios';
import { Repository } from '../../repository/repository.service';
import { WebhookEvents } from '../dto/webhook.dto';
import { WAMonitoringService } from './monitor.service';
import { ulid } from 'ulid';

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

export class InstanceService {
  constructor(
    private readonly configService: ConfigService,
    private readonly waMonitor: WAMonitoringService,
    private readonly repository: Repository,
  ) {}

  private readonly logger = new Logger(this.configService, InstanceService.name);

  private async generateToken(instanceName: string) {
    const jwtOpts = this.configService.get<Auth>('AUTHENTICATION').JWT;
    const token = sign(
      {
        instanceName,
        apiName,
        tokenId: ulid(Date.now()),
      },
      jwtOpts.SECRET,
      { expiresIn: jwtOpts.EXPIRIN_IN, encoding: 'utf8', subject: 'g-t' },
    );

    return token;
  }

  public async createInstance(instance: InstanceDto) {
    const find = (await this.fetchInstance(instance.instanceName))[0];
    if (find) {
      throw new BadRequestException('Instance already exists');
    }

    try {
      const instanceName = instance?.instanceName || ulid(Date.now());

      const create = this.repository.instance.create({
        data: {
          name: instanceName,
          description: instance.description,
          externalAttributes: instance?.externalAttributes,
          Auth: {
            create: {
              token: await this.generateToken(instanceName),
            },
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          Auth: {
            select: {
              id: true,
              token: true,
            },
          },
        },
      });

      return create;
    } catch (error) {
      //
    }
  }

  public async updateInstance(instance: InstanceDto) {
    try {
      const find = (await this.fetchInstance(instance.instanceName))[0];
      if (!find) {
        throw new BadRequestException('Instance not found');
      }

      const updated = await this.repository.instance.update({
        where: { name: instance.instanceName },
        data: {
          description: instance?.description,
          name: instance?.instanceName,
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          Auth: {
            select: {
              id: true,
              token: true,
            },
          },
        },
      });

      if (instance?.instanceName) {
        const i = this.waMonitor.waInstances[instance.instanceName];
        delete this.waMonitor.waInstances[instance.instanceName];
        this.waMonitor.waInstances[updated.name] = i;
      }

      return updated;
    } catch (error) {
      //
    }
  }

  public async fetchInstance(instanceName?: string) {
    const instances = await this.repository.instance.findMany({
      where: { name: instanceName },
      select: {
        id: true,
        name: true,
        description: true,
        connectionStatus: true,
        ownerJid: true,
        profilePicUrl: true,
        createdAt: true,
        updatedAt: true,
        Auth: {
          select: {
            id: true,
            token: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        Webhook: {
          select: {
            id: true,
            enabled: true,
            url: true,
            events: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return instances;
  }

  public async deleteInstance(instance: InstanceDto, force = false) {
    try {
      const c1 = await this.repository.webhook.count({
        where: { Instance: { name: instance.instanceName } },
      });
      const c2 = await this.repository.message.count({
        where: { Instance: { name: instance.instanceName } },
      });
      const c3 = await this.repository.chat.count({
        where: { Instance: { name: instance.instanceName } },
      });
      const c4 = await this.repository.contact.count({
        where: { Instance: { name: instance.instanceName } },
      });
      const c5 = await this.repository.activityLogs.count({
        where: { Instance: { name: instance.instanceName } },
      });

      if (!force && (c1 || c2 || c3 || c4 || c5)) {
        throw [
          new Error('This instance has dependencies and cannot be deleted'),
          new Error('"force" parameter to delete all dependencies'),
        ];
      }

      this.waMonitor.waInstances.delete(instance.instanceName);

      return await this.repository.instance.delete({
        where: { name: instance.instanceName },
      });
    } catch (error) {
      if (isArray(error)) {
        throw new BadRequestException(...error.map((e) => e.message));
      }

      throw new BadRequestException(error?.message);
    }
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

      const instance = await this.repository.instance.findUnique({
        where: { name: decode.instanceName },
        select: {
          id: true,
          ownerJid: true,
          Auth: { select: { token: true, id: true } },
          Webhook: { select: { enabled: true, url: true, events: true } },
        },
      });

      const decodeTokenStore = verify(instance.Auth.token, jwtOpts.SECRET, {
        ignoreExpiration: true,
      }) as Pick<JwtPayload, 'apiName' | 'instanceName' | 'tokenId'>;

      if (decode.tokenId !== decodeTokenStore.tokenId) {
        throw new BadRequestException('Invalid "oldToken"');
      }

      const auth = await this.generateToken(decode.instanceName);

      try {
        const events = instance.Webhook.events as WebhookEvents;
        if (instance.Webhook?.enabled && events?.refreshToken) {
          await axios.post(
            instance.Webhook.url,
            {
              event: 'new.jwt',
              auth,
            },
            { headers: { 'Resource-owner': instance.ownerJid } },
          );
        }
      } catch (error) {
        this.logger.error(error);
      }

      const newAuth = this.repository.auth.update({
        where: { id: instance.Auth.id },
        data: { token: auth, updatedAt: new Date() },
      });

      return newAuth;
    } catch (error) {
      this.logger.error({
        localError: InstanceService.name + '.refreshToken',
        error,
      });
      throw new BadRequestException('Invalid "oldToken"');
    }
  }
}
