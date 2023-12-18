/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename chat.router.ts                                                     │
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
 * │ @constructs ChatRouter @extends RouterBroker                                 │
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
  archiveChatSchema,
  contactValidateSchema,
  deleteMessageSchema,
  messageValidateSchema,
  profilePictureSchema,
  readMessageForIdSchema,
  readMessageSchema,
  updatePresenceSchema,
  whatsappNumberSchema,
} from '../../validate/validate.schema';
import {
  ArchiveChatDto,
  DeleteMessage,
  NumberDto,
  ReadMessageDto,
  ReadMessageIdDto,
  UpdatePresenceDto,
  WhatsAppNumberDto,
} from '../dto/chat.dto';
import { InstanceDto } from '../dto/instance.dto';
import { Transform } from 'stream';
import { Query } from '../../repository/repository.service';
import { Contact, Message } from '@prisma/client';
import { HttpStatus } from '../../app.module';
import { ChatController } from '../controllers/chat.controller';
import { routerPath, dataValidate } from '../../validate/router.validate';

export function ChatRouter(chatController: ChatController, ...guards: RequestHandler[]) {
  const router = Router()
    .post(routerPath('whatsappNumbers'), ...guards, async (req, res) => {
      const response = await dataValidate<WhatsAppNumberDto>({
        request: req,
        schema: whatsappNumberSchema,
        execute: (instance, data) => chatController.whatsappNumber(instance, data),
      });

      return res.status(HttpStatus.OK).json(response);
    })
    .put(routerPath('markMessageAsRead'), ...guards, async (req, res) => {
      const response = await dataValidate<ReadMessageDto>({
        request: req,
        schema: readMessageSchema,
        execute: (instance, data) => chatController.readMessage(instance, data),
      });

      return res.status(HttpStatus.OK).json(response);
    })
    .patch(routerPath('readMessages'), ...guards, async (req, res) => {
      const response = await dataValidate<ReadMessageIdDto>({
        request: req,
        schema: readMessageForIdSchema,
        execute: (instance, data) => chatController.readMessagesForId(instance, data),
      });

      return res.status(HttpStatus.OK).json(response);
    })
    .patch(routerPath('updatePresence'), ...guards, async (req, res) => {
      const response = await dataValidate<UpdatePresenceDto>({
        request: req,
        schema: updatePresenceSchema,
        execute: (instance, data) => chatController.updatePresence(instance, data),
      });

      return res.status(HttpStatus.OK).json(response);
    })
    .put(routerPath('archiveChat'), ...guards, async (req, res) => {
      const response = await dataValidate<ArchiveChatDto>({
        request: req,
        schema: archiveChatSchema,
        execute: (instance, data) => chatController.archiveChat(instance, data),
      });

      return res.status(HttpStatus.OK).json(response);
    })
    .delete(routerPath('deleteMessageForEveryone'), ...guards, async (req, res) => {
      const response = await dataValidate<DeleteMessage>({
        request: req,
        schema: deleteMessageSchema,
        execute: (instance, data) => chatController.deleteMessage(instance, data),
      });

      return res.status(HttpStatus.CREATED).json(response);
    })
    .post(routerPath('fetchProfilePictureUrl'), ...guards, async (req, res) => {
      const response = await dataValidate<NumberDto>({
        request: req,
        schema: profilePictureSchema,
        execute: (instance, data) => chatController.fetchProfilePicture(instance, data),
      });

      return res.status(HttpStatus.OK).json(response);
    })
    .get(routerPath('fetchProfilePictureUrl'), ...guards, async (req, res) => {
      const response = await dataValidate<NumberDto>({
        request: req,
        schema: profilePictureSchema,
        execute: (instance, data) => chatController.fetchProfilePicture(instance, data),
      });

      return res.status(HttpStatus.OK).json(response);
    })
    .post(routerPath('findContacts'), ...guards, async (req, res) => {
      const response = await dataValidate<Query<Contact>>({
        request: req,
        schema: contactValidateSchema,
        execute: (instance, data) => chatController.fetchContacts(instance, data),
      });

      return res.status(HttpStatus.OK).json(response);
    })
    .post(routerPath('retrieverMediaMessage'), ...guards, async (req, res) => {
      const response = await dataValidate<Message>({
        request: req,
        schema: null,
        execute: (instance, data) =>
          chatController.getBinaryMediaFromMessage(instance, data),
      });

      res
        .setHeader('Content-type', response.mimetype)
        .setHeader('Content-Disposition', 'inline; filename="' + response.fileName + '"');

      const transform: Transform = response.stream;

      transform.pipe(res);
      transform.on('error', (err) => {
        console.error(err);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json([err?.message, err?.stack]);
      });
    })
    .post(routerPath('findMessages'), ...guards, async (req, res) => {
      const response = await dataValidate<Query<Message>>({
        request: req,
        schema: messageValidateSchema,
        execute: (instance, data) => chatController.fetchMessages(instance, data),
      });

      return res.status(HttpStatus.OK).json(response);
    })
    .get(routerPath('findChats'), ...guards, async (req, res) => {
      const response = await dataValidate<InstanceDto>({
        request: req,
        schema: null,
        execute: (instance) => chatController.fetchChats(instance),
      });

      return res.status(HttpStatus.OK).json(response);
    });

  return router;
}
