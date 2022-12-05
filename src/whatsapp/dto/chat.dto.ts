export class OnWhatsAppDto {
  constructor(public readonly jid: string, public readonly exists: boolean) {}
}

export class WhatsAppNumberDto {
  numbers: string[];
}

export class NumberDto {
  number: string;
}

class Key {
  id: string;
  fromMe: boolean;
  remoteJid: string;
}
export class ReadMessageDto {
  readMessages: Key[];
}

class LastMessage {
  key: Key;
  messageTimestamp?: number;
}

export class ArchiveChatDto {
  lastMessage: LastMessage;
  archive: boolean;
}
