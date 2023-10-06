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
  messageUpSchema,
  messageValidateSchema,
  profilePictureSchema,
  readMessageSchema,
  whatsappNumberSchema,
} from '../../validate/validate.schema';
import {
  ArchiveChatDto,
  DeleteMessage,
  NumberDto,
  ReadMessageDto,
  WhatsAppNumberDto,
} from '../dto/chat.dto';
import { ContactQuery } from '../repository/contact.repository';
import { MessageQuery } from '../repository/message.repository';
import { chatController } from '../whatsapp.module';
import { RouterBroker } from '../abstract/abstract.router';
import { HttpStatus } from './index.router';
import { MessageUpQuery } from '../repository/messageUp.repository';
import { proto } from '@whiskeysockets/baileys';
import { InstanceDto } from '../dto/instance.dto';
import { Readable } from 'stream';

export class ChatRouter extends RouterBroker {
  constructor(...guards: RequestHandler[]) {
    super();
    this.router
      .post(this.routerPath('whatsappNumbers'), ...guards, async (req, res) => {
        const response = await this.dataValidate<WhatsAppNumberDto>({
          request: req,
          schema: whatsappNumberSchema,
          ClassRef: WhatsAppNumberDto,
          execute: (instance, data) => chatController.whatsappNumber(instance, data),
        });

        return res.status(HttpStatus.CREATED).json(response);
      })
      .put(this.routerPath('markMessageAsRead'), ...guards, async (req, res) => {
        const response = await this.dataValidate<ReadMessageDto>({
          request: req,
          schema: readMessageSchema,
          ClassRef: ReadMessageDto,
          execute: (instance, data) => chatController.readMessage(instance, data),
        });

        return res.status(HttpStatus.CREATED).json(response);
      })
      .put(this.routerPath('archiveChat'), ...guards, async (req, res) => {
        const response = await this.dataValidate<ArchiveChatDto>({
          request: req,
          schema: archiveChatSchema,
          ClassRef: ArchiveChatDto,
          execute: (instance, data) => chatController.archiveChat(instance, data),
        });

        return res.status(HttpStatus.CREATED).json(response);
      })
      .delete(
        this.routerPath('deleteMessageForEveryone'),
        ...guards,
        async (req, res) => {
          const response = await this.dataValidate<DeleteMessage>({
            request: req,
            schema: deleteMessageSchema,
            ClassRef: DeleteMessage,
            execute: (instance, data) => chatController.deleteMessage(instance, data),
          });

          return res.status(HttpStatus.CREATED).json(response);
        },
      )
      .post(this.routerPath('fetchProfilePictureUrl'), ...guards, async (req, res) => {
        const response = await this.dataValidate<NumberDto>({
          request: req,
          schema: profilePictureSchema,
          ClassRef: NumberDto,
          execute: (instance, data) => chatController.fetchProfilePicture(instance, data),
        });

        return res.status(HttpStatus.OK).json(response);
      })
      .post(this.routerPath('findContacts'), ...guards, async (req, res) => {
        const response = await this.dataValidate<ContactQuery>({
          request: req,
          schema: contactValidateSchema,
          ClassRef: ContactQuery,
          execute: (instance, data) => chatController.fetchContacts(instance, data),
        });

        return res.status(HttpStatus.OK).json(response);
      })
      .post(this.routerPath('getBase64FromMediaMessage'), ...guards, async (req, res) => {
        const response = await this.dataValidate<proto.IWebMessageInfo>({
          request: req,
          schema: null,
          ClassRef: Object,
          execute: (instance, data) =>
            chatController.getBase64FromMediaMessage(instance, data),
        });

        return res.status(HttpStatus.CREATED).json(response);
      })
      .post(this.routerPath('retrieverMediaMessage'), ...guards, async (req, res) => {
        const response = await this.dataValidate<proto.IWebMessageInfo>({
          request: req,
          schema: null,
          ClassRef: Object,
          execute: (instance, data) =>
            chatController.getBinaryMediaFromMessage(instance, data),
        });

        res
          .setHeader('Content-type', response.mimetype)
          .setHeader(
            'Content-Disposition',
            'inline; filename="' + response.fileName + '"',
          );

        const readableStream = new Readable();
        readableStream.push(response.media);
        readableStream.push(null);

        return readableStream.pipe(res);
      })
      .post(this.routerPath('findMessages'), ...guards, async (req, res) => {
        const response = await this.dataValidate<MessageQuery>({
          request: req,
          schema: messageValidateSchema,
          ClassRef: MessageQuery,
          execute: (instance, data) => chatController.fetchMessages(instance, data),
        });

        return res.status(HttpStatus.OK).json(response);
      })
      .post(this.routerPath('findStatusMessage'), ...guards, async (req, res) => {
        const response = await this.dataValidate<MessageUpQuery>({
          request: req,
          schema: messageUpSchema,
          ClassRef: MessageUpQuery,
          execute: (instance, data) => chatController.fetchStatusMessage(instance, data),
        });

        return res.status(HttpStatus.OK).json(response);
      })
      .get(this.routerPath('findChats'), ...guards, async (req, res) => {
        const response = await this.dataValidate<InstanceDto>({
          request: req,
          schema: null,
          ClassRef: InstanceDto,
          execute: (instance) => chatController.fetchChats(instance),
        });

        return res.status(HttpStatus.OK).json(response);
      });
  }

  public readonly router = Router();
}
