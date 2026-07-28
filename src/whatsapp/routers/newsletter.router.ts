/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @filename newsletter.router.ts                                               │
 * │ Creation date: Jul 28, 2026                                                  │
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
 * │ @constructs NewsletterRouter                                                 │
 * │ @param {RequestHandler[]} guards                                             │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { RequestHandler, Router } from 'express';
import {
  createNewsletterSchema,
  fetchNewsletterMessagesSchema,
  newsletterJidSchema,
  updateNewsletterSchema,
} from '../../validate/validate.schema';
import {
  CreateNewsletterDto,
  FetchNewsletterMessagesDto,
  NewsletterJid,
  UpdateNewsletterDto,
} from '../dto/newsletter.dto';
import { HttpStatus } from '../../app.module';
import { NewsletterController } from '../controllers/newsletter.controller';
import { routerPath, dataValidate } from '../../validate/router.validate';

/**
 * Newsletters are WhatsApp Channels: one-way broadcast to followers.
 *
 * There is intentionally no send route here — createJid() passes a
 * "<id>@newsletter" jid through untouched, so /message/sendText and
 * /message/sendMediaFile already publish to a channel.
 *
 * dataValidate() merges the query string into the body for GET requests, so
 * the read routes below take `?newsletterJid=...`.
 */
export function NewsletterRouter(
  newsletterController: NewsletterController,
  ...guards: RequestHandler[]
) {
  const router = Router()
    .post(routerPath('create'), ...guards, async (req, res) => {
      const response = await dataValidate<CreateNewsletterDto>({
        request: req,
        schema: createNewsletterSchema,
        execute: (instance, data) =>
          newsletterController.createNewsletter(instance, data),
      });

      res.status(HttpStatus.CREATED).json(response);
    })
    .get(routerPath('findAll'), ...guards, async (req, res) => {
      const params = req.params;
      const response = await newsletterController.allNewsletters({
        instanceName: params?.instanceName as unknown as string,
      });

      res.status(HttpStatus.OK).json(response);
    })
    .get(routerPath('metadata'), ...guards, async (req, res) => {
      const response = await dataValidate<NewsletterJid>({
        request: req,
        schema: newsletterJidSchema,
        execute: (instance, data) => newsletterController.findNewsletter(instance, data),
      });

      res.status(HttpStatus.OK).json(response);
    })
    .get(routerPath('subscribers'), ...guards, async (req, res) => {
      const response = await dataValidate<NewsletterJid>({
        request: req,
        schema: newsletterJidSchema,
        execute: (instance, data) => newsletterController.subscribers(instance, data),
      });

      res.status(HttpStatus.OK).json(response);
    })
    .get(routerPath('messages'), ...guards, async (req, res) => {
      const response = await dataValidate<FetchNewsletterMessagesDto>({
        request: req,
        schema: fetchNewsletterMessagesSchema,
        execute: (instance, data) => newsletterController.fetchMessages(instance, data),
      });

      res.status(HttpStatus.OK).json(response);
    })
    .put(routerPath('update'), ...guards, async (req, res) => {
      const response = await dataValidate<UpdateNewsletterDto>({
        request: req,
        schema: updateNewsletterSchema,
        execute: (instance, data) =>
          newsletterController.updateNewsletter(instance, data),
      });

      res.status(HttpStatus.OK).json(response);
    });

  return router;
}
