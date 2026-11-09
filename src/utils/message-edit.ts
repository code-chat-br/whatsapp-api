import { hkdfSync } from 'node:crypto';
import {
  aesDecryptGCM,
  jidNormalizedUser,
  normalizeMessageContent,
  proto,
  WASocket,
} from '@whiskeysockets/baileys';

type LidMapping = WASocket['signalRepository']['lidMapping'];

export function getEncryptedMessageEdit(message: proto.IMessage) {
  const edit = normalizeMessageContent(message)?.secretEncryptedMessage;
  if (
    edit?.secretEncType ===
    proto.Message.SecretEncryptedMessage.SecretEncType.MESSAGE_EDIT
  ) {
    return edit;
  }
}

export async function userJidAliases(
  jids: (string | null | undefined)[],
  mapping?: LidMapping,
) {
  const aliases = new Set(
    jids
      .map(jidNormalizedUser)
      .filter((jid) => /@(s\.whatsapp\.net|lid|hosted(\.lid)?)$/.test(jid)),
  );
  await Promise.all(
    [...aliases].map(async (jid) => {
      const canonical = jid
        .replace(/@hosted\.lid$/, '@lid')
        .replace(/@hosted$/, '@s.whatsapp.net');
      aliases.add(canonical);
      if (mapping) {
        const alternate = await (
          canonical.endsWith('@lid')
            ? mapping.getPNForLID(canonical)
            : mapping.getLIDForPN(canonical)
        ).catch(() => null);
        if (alternate) {
          aliases.add(jidNormalizedUser(alternate));
        }
      }
    }),
  );
  return [...aliases];
}

export function decryptMessageEdit(
  edit: proto.Message.ISecretEncryptedMessage,
  secret: Uint8Array,
  originalSenders: string[],
  editors: string[],
) {
  const id = edit.targetMessageKey?.id;
  const { encIv, encPayload } = edit;
  if (
    !id ||
    secret?.length !== 32 ||
    encIv?.length !== 12 ||
    !(encPayload?.length > 16)
  ) {
    return;
  }

  // The edit is bound to the original message and both account identities (Baileys #2743).
  for (const sender of originalSenders) {
    for (const editor of editors) {
      try {
        const info = Buffer.from(id + sender + editor + 'Message Edit');
        const key = Buffer.from(hkdfSync('sha256', secret, Buffer.alloc(0), info, 32));
        const plain = aesDecryptGCM(encPayload, key, encIv, Buffer.alloc(0));
        const { protocolMessage } = proto.Message.decode(plain);
        if (
          protocolMessage?.type === proto.Message.ProtocolMessage.Type.MESSAGE_EDIT &&
          protocolMessage.editedMessage &&
          (!protocolMessage.key?.id || protocolMessage.key.id === id)
        ) {
          return protocolMessage;
        }
        return;
      } catch {
        // An account can be addressed by PN or LID. Try the next trusted alias.
      }
    }
  }
}
