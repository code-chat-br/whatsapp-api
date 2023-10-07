/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename message.model.ts                                                   │
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
 * │ @class Key                                                                   │
 * │ @class MessageRaw                                                            │
 * │ @constant messageSchema                                                      │
 * │ @constant MessageModel                                                       │
 * │ @type {IMessageModel}                                                        │
 * │                                                                              │
 * │ @class MessageUpdateRaw                                                      │
 * │ @constant messageUpdateSchema                                                │
 * │ @constant MessageUpModel                                                     │
 * │ @type {IMessageUpModel}                                                      │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { Schema } from 'mongoose';
import { dbserver } from '../../db/db.connect';
import { wa } from '../types/wa.types';

class Key {
  id?: string;
  remoteJid?: string;
  fromMe?: boolean;
  participant?: string;
}

export class MessageRaw {
  constructor(props?: MessageRaw) {
    Object.assign(this, props);
  }
  _id?: string;
  key?: Key;
  pushName?: string;
  participant?: string;
  message?: object;
  messageTimestamp?: number | Long.Long;
  owner: string;
  source?: 'android' | 'web' | 'ios';
}

const messageSchema = new Schema<MessageRaw>({
  _id: { type: String, _id: true },
  key: {
    id: { type: String, required: true, minlength: 1 },
    remoteJid: { type: String, required: true, minlength: 1 },
    fromMe: { type: Boolean, required: true },
    participant: { type: String, minlength: 1 },
  },
  pushName: { type: String },
  participant: { type: String },
  message: { type: Object },
  source: { type: String, minlength: 3, enum: ['android', 'web', 'ios'] },
  messageTimestamp: { type: Number, required: true },
  owner: { type: String, required: true, minlength: 1 },
});

export const MessageModel = dbserver?.model(MessageRaw.name, messageSchema, 'messages');
export type IMessageModel = typeof MessageModel;

export class MessageUpdateRaw {
  _id?: string;
  remoteJid?: string;
  id?: string;
  fromMe?: boolean;
  participant?: string;
  datetime?: number;
  status?: wa.StatusMessage;
  owner: string;
}

const messageUpdateSchema = new Schema<MessageUpdateRaw>({
  _id: { type: String, _id: true },
  remoteJid: { type: String, required: true, min: 1 },
  id: { type: String, required: true, min: 1 },
  fromMe: { type: Boolean, required: true },
  participant: { type: String, min: 1 },
  datetime: { type: Number, required: true, min: 1 },
  status: { type: String, required: true },
  owner: { type: String, required: true, min: 1 },
});

export const MessageUpModel = dbserver?.model(
  MessageUpdateRaw.name,
  messageUpdateSchema,
  'messageUpdate',
);
export type IMessageUpModel = typeof MessageUpModel;
