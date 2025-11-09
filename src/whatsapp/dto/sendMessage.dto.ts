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
import { ulid } from 'ulid';

export class Options {
  delay?: number;
  presence?: WAPresence;
  quotedMessageId?: number;
  quotedMessage?: any;
  messageId?: string;
  externalAttributes?: any;
  convertAudio?: boolean;
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
  media: string | Buffer;
  extension?: string;
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
  convertAudio: boolean | string;
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

const toString = (value: any) => JSON.stringify(value);

type TypeButton = 'reply' | 'copy' | 'url' | 'call';

export class Button {
  type: TypeButton;
  displayText: string;
  id?: string;
  url?: string;
  copyCode?: string;
  phoneNumber?: string;

  constructor(props: Partial<Button>) {
    Object.assign(this, props);
    if (this.type === 'reply' && !this.id) {
      this.id = ulid();
    }
  }

  private readonly mapType = new Map<TypeButton, string>([
    ['reply', 'quick_reply'],
    ['copy', 'cta_copy'],
    ['url', 'cta_url'],
    ['call', 'cta_call'],
  ]);

  get typeButton(): string {
    return this.mapType.get(this.type);
  }

  toJSONString(): string {
    const toString = (obj: any) => JSON.stringify(obj);

    const json = {
      call: () =>
        toString({ display_text: this.displayText, phone_number: this.phoneNumber }),
      reply: () =>
        toString({ display_text: this.displayText, id: this.id, disabled: false }),
      copy: () => toString({ display_text: this.displayText, copy_code: this.copyCode }),
      url: () =>
        toString({
          display_text: this.displayText,
          url: this.url,
          merchant_url: this.url,
        }),
    };

    return json[this.type]?.() || '';
  }

  validate(): Error | null {
    const errors = {
      reply: () => (this.id ? null : new Error('ID is required for reply buttons')),
      call: () =>
        this.phoneNumber ? null : new Error('Phone number is required for call buttons'),
      copy: () =>
        this.copyCode ? null : new Error('Copy code is required for copy buttons'),
      url: () => (this.url ? null : new Error('URL is required for URL buttons')),
    };

    return errors[this.type]?.();
  }
}

class ButtonsMessage {
  thumbnailUrl?: string;
  title: string;
  description?: string;
  footer?: string;
  buttons: Button[];

  constructor(props: ButtonsMessage) {
    Object.assign(this, props);
    this.buttons = props.buttons.map((button) => new Button(button));
  }
}

export class SendButtonsDto extends Metadata {
  buttonsMessage: ButtonsMessage;

  constructor(props: Partial<SendButtonsDto>) {
    super();
    Object.assign(this, props);

    this.buttonsMessage = new ButtonsMessage(props.buttonsMessage);
  }
}

class Row {
  header?: string;
  title: string;
  description?: string;
  id?: string;

  constructor(props: Row) {
    Object.assign(this, props);
    if (!this.id) {
      this.id = ulid(Date.now());
    }
  }
}

class ListSection {
  title: string;
  rows: Row[];

  constructor(props: ListSection) {
    Object.assign(this, props);
    this.rows = props.rows.map((row) => new Row(row));
  }
}

class Section {
  buttonText: string;
  list: ListSection[];

  constructor(props: Section) {
    Object.assign(this, props);
    this.list = props.list.map((item) => new ListSection(item));
  }

  toSectionsString(): string {
    return toString({
      title: this.buttonText,
      sections: this.list,
    });
  }
}

class ListMessage {
  thumbnailUrl?: string;
  title: string;
  description?: string;
  footer?: string;
  sections: Section[];

  constructor(props: ListMessage) {
    Object.assign(this, props);
    this.sections = props.sections.map((section) => new Section(section));
  }
}

export class SendListDto extends Metadata {
  listMessage: ListMessage;

  constructor(props: SendListDto) {
    super();
    Object.assign(this, props);
    this.listMessage = new ListMessage(props.listMessage);
  }
}

class RowLegacy {
  title: string;
  description?: string;
  rowId?: string;

  constructor(props: Row) {
    Object.assign(this, props);
    if (!this?.rowId) {
      this.rowId = ulid(Date.now());
    }
  }
}

class SectionLegacy {
  title: string;
  rows: RowLegacy[];

  constructor(props: SectionLegacy) {
    Object.assign(this, props);
    this.rows = props.rows.map((row) => new RowLegacy(row));
  }
}

class ListLegacy {
  title: string;
  description?: string;
  buttonText: string;
  footer?: string;
  sections: SectionLegacy[];

  constructor(props: ListLegacy) {
    Object.assign(this, props);
    this.sections = props.sections.map((section) => new SectionLegacy(section));
  }
}

export class SendListLegacyDto extends Metadata {
  listMessage: ListLegacy;

  constructor(props: SendListLegacyDto) {
    super();
    Object.assign(this, props);
    this.listMessage = new ListLegacy(props.listMessage);
  }
}

export class LinkMessage {
  link: string;
  thumbnailUrl?: string;
  text?: string;
  title?: string;
  description?: string;
}

export class SendLinkDto extends Metadata {
  linkMessage: LinkMessage;
}
