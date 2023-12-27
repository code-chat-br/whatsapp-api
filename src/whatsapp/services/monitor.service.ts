/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename monitor.service.ts                                                 │
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
 * │ @class                                                                       │
 * │ @constructs WAMonitoringService                                              │
 * │ @param {EventEmitter2} eventEmitter                                          │
 * │ @param {ConfigService} configService                                         │
 * │ @param {RepositoryBroker} repository                                         │
 * │ @param {RedisCache} cache                                                    │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { opendirSync, readdirSync, rmSync } from 'fs';
import { WAStartupService } from './whatsapp.service';
import { INSTANCE_DIR } from '../../config/path.config';
import EventEmitter2 from 'eventemitter2';
import { join } from 'path';
import { Logger } from '../../config/logger.config';
import {
  ConfigService,
  Database,
  InstanceExpirationTime,
  Redis,
} from '../../config/env.config';
import { Repository } from '../../repository/repository.service';
import { RedisCache } from '../../cache/redis';
import { Instance } from '@prisma/client';

export class WAMonitoringService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    private readonly repository: Repository,
    private readonly redisCache: RedisCache,
  ) {
    this.removeInstance();
    this.noConnection();

    Object.assign(this.db, configService.get<Database>('DATABASE'));
    Object.assign(this.redis, configService.get<Redis>('REDIS'));
  }

  private readonly db: Partial<Database> = {};
  private readonly redis: Partial<Redis> = {};

  private readonly logger = new Logger(this.configService, WAMonitoringService.name);
  public readonly waInstances = new Map<string, WAStartupService>();

  public delInstanceTime(instance: string) {
    const time = this.configService.get<InstanceExpirationTime>(
      'INSTANCE_EXPIRATION_TIME',
    );
    if (typeof time === 'number' && time > 0) {
      setTimeout(
        () => {
          const ref = this.waInstances.get(instance);
          if (ref?.connectionStatus?.state !== 'open') {
            this.waInstances.delete(instance);
          }
        },
        1000 * 60 * time,
      );
    }
  }

  private async cleaningUp({ name, id }: Instance) {
    this.waInstances.get(name)?.client?.ev.removeAllListeners('connection.update');
    this.waInstances.get(name)?.client?.ev.flush();
    this.waInstances.delete(name);
    if (this.redis?.ENABLED) {
      await this.redisCache.del(`${id}:${name}`);
    } else {
      rmSync(join(INSTANCE_DIR, name), { recursive: true, force: true });
    }

    await this.repository.instance.update({
      where: { name },
      data: {
        connectionStatus: 'OFFLINE',
      },
    });
  }

  public async loadInstance() {
    const set = async (name: string) => {
      const instance = await this.repository.instance.findUnique({
        where: { name },
      });
      if (!instance) {
        return this.eventEmitter.emit('remove.instance', instance);
      }
      const init = new WAStartupService(
        this.configService,
        this.eventEmitter,
        this.repository,
        this.redisCache,
      );
      await init.setInstanceName(name);
      await init.connectToWhatsapp();
      this.waInstances.set(name, init);
    };

    try {
      if (this.redis.ENABLED) {
        const keys = await this.redisCache.keys('*');
        if (keys?.length > 0) {
          keys.forEach(async (key) => {
            const [prefix, id, name] = key.split(':');
            await set(name);
          });
        }
        return;
      }

      const dir = opendirSync(INSTANCE_DIR, { encoding: 'utf-8' });
      for await (const dirent of dir) {
        if (dirent.isDirectory()) {
          const files = readdirSync(join(INSTANCE_DIR, dirent.name), {
            encoding: 'utf-8',
          });
          if (files.length === 0) {
            rmSync(join(INSTANCE_DIR, dirent.name), { recursive: true, force: true });
            break;
          }

          await set(dirent.name);
        }
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  private removeInstance() {
    this.eventEmitter.on('remove.instance', async (instance: Instance) => {
      try {
        await this.waInstances.get(instance.name)?.client?.logout();
        this.waInstances
          .get(instance.name)
          ?.client?.ev.removeAllListeners('connection.update');
        this.waInstances.get(instance.name)?.client?.ev.flush();
        this.waInstances.delete(instance.name);
      } catch (error) {
        this.logger.subContext('removeInstance');
        this.logger.error(error);
        this.logger.subContext();
      }

      try {
        await this.cleaningUp(instance);
      } finally {
        this.logger.warn(`Instance "${instance?.name}" - REMOVED`);
      }
    });
  }

  private noConnection() {
    this.eventEmitter.on('no.connection', async (instance: Instance) => {
      const del = this.configService.get<InstanceExpirationTime>(
        'INSTANCE_EXPIRATION_TIME',
      );
      if (del) {
        try {
          this.cleaningUp(instance);
        } catch (error) {
          this.logger.error({
            localError: 'noConnection',
            warn: 'Error deleting instance from memory.',
            error,
          });
        } finally {
          this.logger.warn(`Instance "${instance.name}" - NOT CONNECTION`);
        }
      }
    });
  }
}
