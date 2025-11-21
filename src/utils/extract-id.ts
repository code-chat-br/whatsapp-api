import { WAMessageKey } from '@whiskeysockets/baileys';

const isJid = (v: string) => {
  const regexp = new RegExp(/^\w+@(s.whatsapp.net|g.us|broadcast|newsletter)$/i);
  return regexp.test(v);
};

const isLid = (v: string) => v.endsWith('@lid');

const extractUser = (...values: (string | undefined)[]) => {
  let jid: string | undefined;
  let lid: string | undefined;

  for (const v of values) {
    if (!v) continue;

    if (!lid && isLid(v)) {
      lid = v;
    }

    if (!jid && isJid(v)) {
      jid = v;
    }
  }

  return { jid, lid };
};

export const getJidUser = (key: WAMessageKey) => {
  return extractUser(key?.remoteJid, key?.remoteJid, key?.remoteJidAlt);
};

export const getUserGroup = (key: WAMessageKey, participant?: string) => {
  return extractUser(key?.participant, key?.participantAlt, participant);
};
