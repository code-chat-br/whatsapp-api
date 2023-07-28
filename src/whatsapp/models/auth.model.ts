/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename auth.model.ts                                                      │
 * │ Developed by: Cleber Wilson                                                  │
 * │ Creation date: Jan 10, 2023                                                  │
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
 * │ @class AuthRaw                                                               │
 * │ @constant authSchema                                                         │
 * │ @constant AuthModel                                                          │
 * │ @type {IAuthModel}                                                           │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { Schema } from 'mongoose';
import { dbserver } from '../../db/db.connect';

export class AuthRaw {
  _id?: string;
  jwt?: string;
  apikey?: string;
}

const authSchema = new Schema<AuthRaw>({
  _id: { type: String, _id: true },
  jwt: { type: String, minlength: 1 },
  apikey: { type: String, minlength: 1 },
});

export const AuthModel = dbserver?.model(AuthRaw.name, authSchema, 'authentication');
export type IAuthModel = typeof AuthModel;
