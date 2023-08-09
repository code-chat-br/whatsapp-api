/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename sendMessage.dto.ts                                                 │
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
 * │ @class Options @class OptionsMessage @class Metadata @class TestMessage      │
 * │ @class SendTextDto @type {MediaType} @class MediaMessage @class Audio        │
 * │ @class SendAudioDto @class Button @class ButtonMessage @class SendButtonDto  │
 * │ @class LocationMessage @class SendLocationDto @class Row @class Section      │
 * │ @class ListMessage @class SendListDto @class ContactMessage                  │
 * │ @class SendListDto @class ContactMessage @class SendContactDto               │
 * │ @class ReactionMessage @class SendReactionDto                                │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { proto, WAPresence } from '@whiskeysockets/baileys';

export class Options {
  delay?: number;
  presence?: WAPresence;
}
class OptionsMessage {
  options: Options;
}

export class Metadata extends OptionsMessage {
  number: string;
}

class TextMessage {
  text: string;
}
export class SendTextDto extends Metadata {
  textMessage: TextMessage;
}

export type MediaType = 'image' | 'document' | 'video' | 'audio';
export class MediaMessage {
  mediatype: MediaType;
  caption?: string;
  // for document
  fileName?: string;
  // url or base64
  media: string | Buffer;
}
export class SendMediaDto extends Metadata {
  mediaMessage: MediaMessage;
}

export class MediaFileDto extends Metadata {
  caption?: string;
  mediatype: MediaType;
  presence?: WAPresence;
  delay: number;
}

class Audio {
  audio: string;
}
export class SendAudioDto extends Metadata {
  audioMessage: Audio;
}

export class AudioMessageFileDto extends Metadata {
  delay: number;
  audio: Buffer;
}

class Button {
  buttonText: string;
  buttonId: string;
}

class LocationMessage {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}
export class SendLocationDto extends Metadata {
  locationMessage: LocationMessage;
}

export class ContactMessage {
  fullName: string;
  wuid: string;
  phoneNumber: string;
}
export class SendContactDto extends Metadata {
  contactMessage: ContactMessage[];
}

class ReactionMessage {
  key: proto.IMessageKey;
  reaction: string;
}
export class SendReactionDto {
  reactionMessage: ReactionMessage;
}
