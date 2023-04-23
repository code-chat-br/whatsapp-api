import { proto, WAPresence } from '@codechat/base';

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
  media: string;
}
export class SendMediaDto extends Metadata {
  mediaMessage: MediaMessage;
}

class Audio {
  audio: string;
}
export class SendAudioDto extends Metadata {
  audioMessage: Audio;
}

class Button {
  buttonText: string;
  buttonId: string;
}
class ButtonMessage {
  title: string;
  description: string;
  footerText?: string;
  buttons: Button[];
  mediaMessage?: MediaMessage;
}
export class SendButtonDto extends Metadata {
  buttonMessage: ButtonMessage;
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

class Row {
  title: string;
  description: string;
  rowId: string;
}
class Section {
  title: string;
  rows: Row[];
}
class ListMessage {
  title: string;
  description: string;
  footerText?: string;
  buttonText: string;
  sections: Section[];
}
export class SendListDto extends Metadata {
  listMessage: ListMessage;
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
