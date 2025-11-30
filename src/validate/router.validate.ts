/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename abstract.router.ts                                                 │
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
 * │ @type {DataValidate}                                                         │
 * │ @constant logger                                                             │
 * │                                                                              │
 * │ @abstract @class RouterBroker                                                │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { InstanceDto } from '../whatsapp/dto/instance.dto';
import { JSONSchema7 } from 'json-schema';
import { Request } from 'express';
import { validate } from 'jsonschema';
import { BadRequestException } from '../exceptions';
import { Logger } from '../config/logger.config';
import { GroupJid } from '../whatsapp/dto/group.dto';
import { ConfigService } from '../config/env.config';

class DataValidate<T> {
  request: Request;
  schema: JSONSchema7;
  execute: (instance: InstanceDto, data: T, file?: Express.Multer.File) => Promise<any>;
}

const logger = new Logger(new ConfigService(), 'Validate');

export function routerPath(path: string, param = true) {
  let route = '/' + path;
  if (param) {
    route += '/:instanceName';
  }

  return route;
}

export async function dataValidate<T>(args: DataValidate<T>) {
  const { request, schema, execute } = args;

  const body = request.body ?? {};
  const instance = request.params as unknown as InstanceDto;

  const isNotEmptyQuery = request?.query && Object.keys(request.query).length > 0;

  if (isNotEmptyQuery) {
    Object.assign(instance, request.query);
  }

  if (request.originalUrl.includes('/instance/create')) {
    Object.assign(instance, body);
  }

  if (
    isNotEmptyQuery &&
    ['get', 'delete', 'patch'].includes(request.method.toLowerCase())
  ) {
    Object.assign(body, request.query);
  }

  const v = schema ? validate(body, schema) : { valid: true, errors: [] };

  if (!v.valid) {
    const message: any[] = v.errors.map(({ property, stack, schema }) => {
      let message: string;
      if (schema['description']) {
        message = schema['description'];
      } else {
        message = stack.replace('instance.', '');
      }
      return {
        property: property.replace('instance.', ''),
        message,
      };
    });
    throw new BadRequestException(...message);
  }

  return await execute(instance, body, request?.file);
}

export async function groupValidate<T>(args: DataValidate<T>) {
  const { request, schema, execute } = args;

  const groupJid = request.query as unknown as GroupJid;

  if (!groupJid?.groupJid) {
    throw new BadRequestException(
      'The group id needs to be informed in the query',
      'ex: "groupJid=120362@g.us"',
    );
  }

  const instance = request.params as unknown as InstanceDto;
  const body = request.body ?? {};

  Object.assign(body, groupJid);

  const v = validate(body, schema);

  if (!v.valid) {
    const message: any[] = v.errors.map(({ property, stack, schema }) => {
      let message: string;
      if (schema['description']) {
        message = schema['description'];
      } else {
        message = stack.replace('instance.', '');
      }
      return {
        property: property.replace('instance.', ''),
        message,
      };
    });
    logger.error([...message]);
    throw new BadRequestException(...message);
  }

  return await execute(instance, body);
}
