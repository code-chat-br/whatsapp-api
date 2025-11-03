/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename message.model.ts                                                   │
 * │ Developed by: Cleber Wilson                                                  │
 * │ Creation date: Dez 05, 2023                                                  │
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
import { MediaDto } from '../../whatsapp/dto/media.dto';
import { s3MediaSchema, s3MediaUrlSchema } from '../../validate/validate.schema';
import { HttpStatus } from '../../app.module';
import { routerPath, dataValidate } from '../../validate/router.validate';
import { S3Service } from './s3.service';

export function S3Router(s3Service: S3Service, ...guards: RequestHandler[]) {
  const router = Router()
    .post(routerPath('findMedia'), ...guards, async (req, res) => {
      const response = dataValidate<MediaDto>({
        request: req,
        schema: s3MediaSchema,
        execute: (_, data) => s3Service.getMedia(data),
      });

      res.status(HttpStatus.OK).json(response);
    })
    .get(routerPath('media/url/:id'), ...guards, async (req, res) => {
      req.body = req.params;
      const response = await dataValidate<MediaDto>({
        request: req,
        schema: s3MediaUrlSchema,
        execute: (_, data) => s3Service.getMediaUrl(data.id as string, data.expiry),
      });

      res.status(HttpStatus.OK).json(response);
    });

  return router;
}
