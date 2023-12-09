/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename sendMessage.router.ts                                              │
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
 * │ @constructs MessageRouter @extends RouterBroker                              │
 * │ @param {RequestHandler[]} guards                                             │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import {
  audioFileMessageSchema,
  audioMessageSchema,
  contactMessageSchema,
  locationMessageSchema,
  mediaFileMessageSchema,
  mediaMessageSchema,
  reactionMessageSchema,
  textMessageSchema,
} from '../../validate/validate.schema';
import {
  AudioMessageFileDto,
  MediaFileDto,
  SendAudioDto,
  SendContactDto,
  SendLocationDto,
  SendMediaDto,
  SendReactionDto,
  SendTextDto,
} from '../dto/sendMessage.dto';
import multer from 'multer';
import { BadRequestException } from '../../exceptions';
import { isEmpty } from 'class-validator';
import { HttpStatus } from '../../app.module';
import { SendMessageController } from '../controllers/sendMessage.controller';
import { routerPath, dataValidate } from '../../validate/router.validate';

function validateMedia(req: Request, _: Response, next: NextFunction) {
  if (!req?.file || req.file.fieldname !== 'attachment') {
    throw new BadRequestException('Invalid File');
  }

  if (isEmpty(req.body?.presence)) {
    req.body.presence = undefined;
  }

  next();
}

export function MessageRouter(
  sendMessageController: SendMessageController,
  ...guards: RequestHandler[]
) {
  const uploadFile = multer({ preservePath: true });

  const router = Router()
    .post(routerPath('sendText'), ...guards, async (req, res) => {
      const response = await dataValidate<SendTextDto>({
        request: req,
        schema: textMessageSchema,
        execute: (instance, data) => sendMessageController.sendText(instance, data),
      });

      return res.status(HttpStatus.CREATED).json(response);
    })
    .post(routerPath('sendMedia'), ...guards, async (req, res) => {
      const response = await dataValidate<SendMediaDto>({
        request: req,
        schema: mediaMessageSchema,
        execute: (instance, data) => sendMessageController.sendMedia(instance, data),
      });

      return res.status(HttpStatus.CREATED).json(response);
    })
    .post(
      routerPath('sendMediaFile'),
      ...guards,
      uploadFile.single('attachment'),
      validateMedia,
      async (req, res) => {
        const response = await dataValidate<MediaFileDto>({
          request: req,
          schema: mediaFileMessageSchema,
          execute: (instance, data, file) =>
            sendMessageController.sendMediaFile(instance, data, file),
        });
        return res.status(HttpStatus.CREATED).json(response);
      },
    )
    .post(routerPath('sendWhatsAppAudio'), ...guards, async (req, res) => {
      const response = await dataValidate<SendAudioDto>({
        request: req,
        schema: audioMessageSchema,
        execute: (instance, data) =>
          sendMessageController.sendWhatsAppAudio(instance, data),
      });

      return res.status(HttpStatus.CREATED).json(response);
    })
    .post(
      routerPath('sendWhatsAppAudioFile'),
      ...guards,
      uploadFile.single('attachment'),
      validateMedia,
      async (req, res) => {
        const response = await dataValidate<AudioMessageFileDto>({
          request: req,
          schema: audioFileMessageSchema,
          execute: (instance, data, file) =>
            sendMessageController.sendWhatsAppAudioFile(instance, data, file),
        });
        return res.status(HttpStatus.CREATED).json(response);
      },
    )
    .post(routerPath('sendLocation'), ...guards, async (req, res) => {
      const response = await dataValidate<SendLocationDto>({
        request: req,
        schema: locationMessageSchema,
        execute: (instance, data) => sendMessageController.sendLocation(instance, data),
      });

      return res.status(HttpStatus.CREATED).json(response);
    })
    .post(routerPath('sendContact'), ...guards, async (req, res) => {
      const response = await dataValidate<SendContactDto>({
        request: req,
        schema: contactMessageSchema,
        execute: (instance, data) => sendMessageController.sendContact(instance, data),
      });

      return res.status(HttpStatus.CREATED).json(response);
    })
    .post(routerPath('sendReaction'), ...guards, async (req, res) => {
      const response = await dataValidate<SendReactionDto>({
        request: req,
        schema: reactionMessageSchema,
        execute: (instance, data) => sendMessageController.sendReaction(instance, data),
      });

      return res.status(HttpStatus.CREATED).json(response);
    });

  return router;
}
