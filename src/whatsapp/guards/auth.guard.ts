/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename auth.guard.ts                                                      │
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
 * │ @function jwtGuard                                                           │
 * │ @property {Request} req @property {Response} _ @property {NextFunction} next │
 * │ @returns {Promise<void>}                                                     │
 * │                                                                              │
 * │ @function apikey                                                             │
 * │ @property {Request} req @property {Response} _ @property {NextFunction} next │
 * │ @returns {Promise<void>}                                                     │
 * │                                                                              │
 * │ @constant authGuard                                                          │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { isJWT } from 'class-validator';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Auth, configService } from '../../config/env.config';
import { Logger } from '../../config/logger.config';
import { name } from '../../../package.json';
import { InstanceDto } from '../dto/instance.dto';
import { JwtPayload } from '../services/auth.service';
import { ForbiddenException, UnauthorizedException } from '../../exceptions';
import { repository } from '../whatsapp.module';

const logger = new Logger('GUARD');

async function jwtGuard(req: Request, _: Response, next: NextFunction) {
  const key = req.get('apikey');

  if (configService.get<Auth>('AUTHENTICATION').API_KEY === key) {
    return next();
  }

  if (
    (req.originalUrl.includes('/instance/create') ||
      req.originalUrl.includes('/instance/fetchInstances')) &&
    !key
  ) {
    throw new ForbiddenException(
      'Missing global api key',
      'The global api key must be set',
    );
  }

  const jwtOpts = configService.get<Auth>('AUTHENTICATION').JWT;
  try {
    const [bearer, token] = req.get('authorization').split(' ');

    if (bearer.toLowerCase() !== 'bearer') {
      throw new UnauthorizedException();
    }

    if (!isJWT(token)) {
      throw new UnauthorizedException();
    }

    const param = req.params as unknown as InstanceDto;
    const decode = jwt.verify(token, jwtOpts.SECRET, {
      ignoreExpiration: jwtOpts.EXPIRIN_IN === 0,
    }) as JwtPayload;

    if (param.instanceName !== decode.instanceName || name !== decode.apiName) {
      throw new UnauthorizedException();
    }

    return next();
  } catch (error) {
    logger.error(error);
    throw new UnauthorizedException();
  }
}

/**
 * @deprecated
 */
async function apikey(req: Request, _: Response, next: NextFunction) {
  const API_KEY = configService.get<Auth>('AUTHENTICATION').API_KEY;
  const key = req.get('apikey');

  if (API_KEY === key) {
    return next();
  }

  if (
    (req.originalUrl.includes('/instance/create') ||
      req.originalUrl.includes('/instance/fetchInstances')) &&
    !key
  ) {
    throw new ForbiddenException(
      'Missing global api key',
      'The global api key must be set',
    );
  }

  try {
    const param = req.params as unknown as InstanceDto;
    const instanceKey = await repository.auth.find(param.instanceName);
    if (instanceKey.apikey === key) {
      return next();
    }
  } catch (error) {}

  throw new UnauthorizedException();
}

export const authGuard = { jwt: jwtGuard, apikey };
