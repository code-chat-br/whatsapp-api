/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename instance.router.ts                                                 │
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
 * │ @constructs InstanceRouter @extends RouterBroker                             │
 * │ @param {RequestHandler[]} guards                                             │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { RequestHandler, Router } from 'express';
import { instanceNameSchema, oldTokenSchema } from '../../validate/validate.schema';
import { InstanceDto } from '../dto/instance.dto';
import { OldToken } from '../services/instance.service';
import { HttpStatus } from '../../app.module';
import { InstanceController } from '../controllers/instance.controller';
import { dataValidate, routerPath } from '../../validate/router.validate';

export function InstanceRouter(
  instanceController: InstanceController,
  ...guards: RequestHandler[]
) {
  const router = Router()
    .post('/create', ...guards, async (req, res) => {
      const response = await dataValidate<InstanceDto>({
        request: req,
        schema: instanceNameSchema,
        execute: (instance) => instanceController.createInstance(instance, req),
      });

      res.status(HttpStatus.CREATED).json(response);
    })
    .get(routerPath('connect'), ...guards, async (req, res) => {
      const response = await dataValidate<InstanceDto>({
        request: req,
        schema: instanceNameSchema,
        execute: (instance) => instanceController.connectToWhatsapp(instance),
      });

      res.status(HttpStatus.OK).json(response);
    })
    .get(routerPath('connect') + '/code/:phoneNumber', async (req, res) => {
      await dataValidate<InstanceDto>({
        request: req,
        schema: instanceNameSchema,
        execute: (instance) =>
          instanceController.connectToWhatsappWitchCode(instance, res),
      });
    })
    .get(routerPath('connectionState'), ...guards, async (req, res) => {
      const response = await dataValidate<InstanceDto>({
        request: req,
        schema: instanceNameSchema,
        execute: (instance) => instanceController.connectionState(instance),
      });

      res.status(HttpStatus.OK).json(response);
    })
    .get(routerPath('fetchInstance'), ...guards, async (req, res) => {
      const response = await dataValidate<InstanceDto>({
        request: req,
        schema: null,
        execute: (instance) => instanceController.fetchInstance(instance),
      });

      res.status(HttpStatus.OK).json(response);
    })
    .get(routerPath('fetchInstances', false), ...guards, async (req, res) => {
      const response = await dataValidate<InstanceDto>({
        request: req,
        schema: null,
        execute: (instance) => instanceController.fetchInstances(instance),
      });

      res.status(HttpStatus.OK).json(response);
    })
    .patch(routerPath('reload'), ...guards, async (req, res) => {
      const response = await dataValidate<InstanceDto>({
        request: req,
        schema: instanceNameSchema,
        execute: (instance) => instanceController.reloadConnection(instance),
      });

      res.status(HttpStatus.OK).json(response);
    })
    .patch(routerPath('update'), ...guards, async (req, res) => {
      const response = await dataValidate<InstanceDto>({
        request: req,
        schema: instanceNameSchema,
        execute: (instance) => instanceController.updateInstance(instance),
      });

      res.status(HttpStatus.OK).json(response);
    })
    .delete(routerPath('logout'), ...guards, async (req, res) => {
      const response = await dataValidate<InstanceDto>({
        request: req,
        schema: instanceNameSchema,
        execute: (instance) => instanceController.logout(instance),
      });

      res.status(HttpStatus.OK).json(response);
    })
    .delete(routerPath('delete'), ...guards, async (req, res) => {
      const response = await dataValidate<InstanceDto>({
        request: req,
        schema: instanceNameSchema,
        execute: (instance) =>
          instanceController.deleteInstance(instance, req?.query?.force === 'true'),
      });

      res.status(HttpStatus.OK).json(response);
    })
    .put(routerPath('refreshToken'), async (req, res) => {
      const response = await dataValidate<OldToken>({
        request: req,
        schema: oldTokenSchema,
        execute: (instance, data) => instanceController.refreshToken(instance, data, req),
      });

      res.status(HttpStatus.CREATED).json(response);
    });

  return router;
}
