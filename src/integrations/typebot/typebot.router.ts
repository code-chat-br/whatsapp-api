/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename message.model.ts                                                   │
 * │ Developed by: Cleber Wilson                                                  │
 * │ Creation date: Dez 07, 2023                                                  │
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
 * │ @class S3Router                                                              │                                                          │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { RequestHandler, Router } from 'express';
import { TypebotDto, TypebotUpdateSessionDto } from './dto/typebot.dto';
import {
  typebotFindSessionSchema,
  typebotSchema,
  typebotUpdateSchema,
  typebotUpdateSessionSchema,
} from '../../validate/validate.schema';
import { HttpStatus } from '../../app.module';
import { TypebotService } from './typebot.service';
import { dataValidate, routerPath } from '../../validate/router.validate';

export function TypebotRouter(
  typebotService: TypebotService,
  ...guards: RequestHandler[]
) {
  const router = Router()
    .post(routerPath('create'), ...guards, async (req, res) => {
      const response = await dataValidate<TypebotDto>({
        request: req,
        schema: typebotSchema,
        execute: (instance, data) =>
          typebotService.createBotInstance(instance.instanceName, data),
      });

      return res.status(HttpStatus.CREATED).json(response);
    })
    .put(routerPath('update'), ...guards, async (req, res) => {
      const response = await dataValidate<TypebotDto>({
        request: req,
        schema: typebotUpdateSchema,
        execute: (instance, data) =>
          typebotService.updateBotInstance(instance.instanceName, data),
      });

      return res.status(HttpStatus.OK).json(response);
    })
    .get(routerPath('find'), ...guards, async (req, res) => {
      const response = await dataValidate({
        request: req,
        schema: null,
        execute: (instance) => typebotService.getBotInstance(instance.instanceName),
      });

      return res.status(HttpStatus.OK).json(response?.['Typebot']);
    })
    .delete(routerPath('delete'), ...guards, async (req, res) => {
      const response = await dataValidate({
        request: req,
        schema: null,
        execute: (instance) => typebotService.deleteBotInstance(instance.instanceName),
      });

      return res.status(HttpStatus.OK).json(response?.['Typebot']);
    })
    .post(routerPath('sessions/find'), ...guards, async (req, res) => {
      const response = await dataValidate<TypebotUpdateSessionDto>({
        request: req,
        schema: typebotFindSessionSchema,
        execute: (instance, data) =>
          typebotService.findSessionsRegistered(instance.instanceName, data),
      });

      return res.status(HttpStatus.OK).json(response);
    })
    .patch(routerPath('sessions/update'), ...guards, async (req, res) => {
      const response = await dataValidate<TypebotUpdateSessionDto>({
        request: req,
        schema: typebotUpdateSessionSchema,
        execute: (instance, data) =>
          typebotService.updateSessionRegistered(instance.instanceName, data),
      });

      return res.status(HttpStatus.OK).json(response);
    });

  return router;
}
