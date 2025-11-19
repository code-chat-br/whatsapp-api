/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename instance.guard.ts                                                  │
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
 * │ @function getInstance @property {String} instanceName                        │
 * │ @returns {Promise<Boolean>}                                                  │
 * │                                                                              │
 * │ @function instanceExistsGuard                                                │
 * │ @property {Request} req @property {Response} _ @property {NextFunction} next │
 * │ @returns {Promise<void>}                                                     │
 * │                                                                              │
 * │ @function instanceLoggedGuard                                                │
 * │ @property {Request} req @property {Response} _ @property {NextFunction} next │
 * │ @returns {Promise<void>}                                                     │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { NextFunction, Request, Response } from 'express';
import { existsSync } from 'fs';
import { join } from 'path';
import { INSTANCE_DIR } from '../config/path.config';
import { BadRequestException, ForbiddenException } from '../exceptions';
import { InstanceDto } from '../whatsapp/dto/instance.dto';
import { WAMonitoringService } from '../whatsapp/services/monitor.service';
import { ProviderFiles } from '../provider/sessions';

async function fetchInstanceFromCache(
  instanceName: string,
  waMonitor: WAMonitoringService,
  providerFiles: ProviderFiles,
) {
  try {
    const exists = !!waMonitor.waInstances.get(instanceName);
    if (exists) {
      return exists;
    }
    if (providerFiles.isEnabled) {
      const [keyExists] = await providerFiles.allInstances();
      return keyExists?.data.includes(instanceName);
    }

    return existsSync(join(INSTANCE_DIR, instanceName));
  } catch (error) {
    console.log('Error fetching instance from cache', error);
    return false;
  }
}

export class InstanceGuard {
  constructor(
    private readonly waMonitor: WAMonitoringService,
    private readonly providerFiles: ProviderFiles,
  ) {}
  async canActivate(req: Request, _: Response, next: NextFunction) {
    if (req.originalUrl.includes('/instance/create')) {
      const instance = req?.body as InstanceDto;
      if (
        await fetchInstanceFromCache(
          instance.instanceName,
          this.waMonitor,
          this.providerFiles,
        )
      ) {
        throw new ForbiddenException(
          `This name "${instance.instanceName}" is already in use.`,
        );
      }

      if (this.waMonitor.waInstances.get(instance.instanceName)) {
        this.waMonitor.waInstances.delete(instance.instanceName);
      }
    }

    if (
      req.originalUrl.includes('/instance/create') ||
      req.originalUrl.includes('/instance/fetchInstances') ||
      req.originalUrl.includes('/instance/qrcode') ||
      req.originalUrl.includes('/instance/connect') ||
      req.originalUrl.includes('/instance/delete') ||
      req.originalUrl.includes('/webhook') ||
      req.originalUrl.includes('/typebot') ||
      req.originalUrl.includes('/s3')
    ) {
      return next();
    }

    const param = req.params as unknown as InstanceDto;
    if (!param?.instanceName) {
      throw new BadRequestException('"instanceName" not provided.');
    }
    const fetch = await fetchInstanceFromCache(
      param.instanceName,
      this.waMonitor,
      this.providerFiles,
    );

    if (!fetch) {
      throw new BadRequestException(
        `The "${param.instanceName}" instance does not exist or is not connected`,
      );
    }

    return next();
  }
}
