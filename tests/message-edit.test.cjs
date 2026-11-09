const assert = require('node:assert/strict');
const { createCipheriv, createHmac } = require('node:crypto');
const { test } = require('node:test');
const { decryptMessageNode, proto } = require('@whiskeysockets/baileys');

const versionModule = require.resolve('../dist/src/utils/wa-version.js');
require.cache[versionModule] = { exports: { fetchLatestBaileysVersionV2: () => ({}) } };
const loggerModule = require.resolve('../dist/src/config/logger.config.js');
require.cache[loggerModule] = {
  exports: {
    Logger: class {
      trace() {}
      warn() {}
    },
  },
};
const { WAStartupService } = require('../dist/src/whatsapp/services/whatsapp.service.js');

const originalId = 'synthetic-original';
const ownPn = '15550000001@s.whatsapp.net';
const ownLid = '111111111111@lid';
const peerPn = '15550000002@s.whatsapp.net';
const peerLid = '222222222222@lid';
const groupJid = '12345@g.us';
const secret = Buffer.alloc(32, 42);
const seconds = 1794234000;
const mapping = {
  getLIDForPN: async (jid) => (jid === peerPn ? peerLid : null),
  getPNForLID: async (jid) => (jid === peerLid ? peerPn : null),
};

function editEnvelope(
  key,
  {
    sender = peerPn,
    editor = peerLid,
    timestamp = seconds * 1000 + 432,
    embeddedId = originalId,
    type = proto.Message.ProtocolMessage.Type.MESSAGE_EDIT,
    fromMe = true,
    corrupt = false,
  } = {},
) {
  const plain = proto.Message.encode({
    protocolMessage: {
      key: { id: embeddedId },
      type,
      editedMessage: { conversation: 'Edited text' },
      timestampMs: timestamp,
    },
  }).finish();
  // Construct the wire fixture using the two independent HKDF HMAC steps.
  const prk = createHmac('sha256', Buffer.alloc(32)).update(secret).digest();
  const encryptionKey = createHmac('sha256', prk)
    .update(originalId + sender + editor + 'Message Edit')
    .update(Buffer.of(1))
    .digest();
  const encIv = Buffer.alloc(12, 29);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey, encIv);
  const encPayload = Buffer.concat([
    cipher.update(plain),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  if (corrupt) {
    encPayload[0] ^= 1;
  }

  return {
    key: { id: 'synthetic-envelope', ...key },
    messageTimestamp: seconds + 5,
    message: {
      ephemeralMessage: {
        message: {
          secretEncryptedMessage: {
            secretEncType:
              proto.Message.SecretEncryptedMessage.SecretEncType.MESSAGE_EDIT,
            targetMessageKey: {
              id: originalId,
              fromMe,
              remoteJid: ownPn,
              participant: peerPn,
            },
            encIv,
            encPayload,
          },
        },
      },
    },
  };
}

function serviceFixture({ storedSecret = secret, existingEdit = false } = {}) {
  const reads = [];
  const writes = [];
  const webhooks = [];
  const socketEvents = [];
  let savedTimestamp;
  const repository = {
    message: {
      findFirst: async (query) => {
        reads.push(query);
        return {
          id: 7,
          messageSecret: storedSecret,
          messageEditedAt: existingEdit ? new Date() : null,
        };
      },
      updateMany: async (query) => {
        writes.push(query);
        const timestamp = query.data.messageEditedAt.getTime();
        if (savedTimestamp >= timestamp) {
          return { count: 0 };
        }
        savedTimestamp = timestamp;
        return { count: 1 };
      },
      create: async () => assert.fail('Edit or replay must not create a new row'),
    },
  };
  const config = {
    get: (key) =>
      ({
        LOG: { LEVEL: 'silent' },
        DATABASE: { DB_OPTIONS: { NEW_MESSAGE: true } },
      })[key],
  };
  const service = new WAStartupService(config, null, repository, null, {
    send: (...args) => socketEvents.push(args),
  });
  Object.assign(service.instance, { id: 3, name: 'test' });
  service.authState = { state: { creds: { me: { id: ownPn, lid: ownLid } } } };
  service.client = {
    signalRepository: { lidMapping: mapping },
    sendPresenceUpdate: async () => {},
  };
  service.sendDataWebhook = async (...args) => webhooks.push(args);
  const receive = (message, type = 'notify') =>
    service.messageHandle['messages.upsert']({ messages: [message], type });
  return { receive, reads, writes, webhooks, socketEvents };
}

test('Baileys preserves the outer secret and the recipient alias in a device-sent message', async () => {
  const wrapped = proto.Message.encode({
    messageContextInfo: { messageSecret: secret },
    deviceSentMessage: {
      destinationJid: peerPn,
      message: { conversation: 'Original text' },
    },
  }).finish();
  const node = decryptMessageNode(
    {
      tag: 'message',
      attrs: {
        id: originalId,
        from: ownPn,
        sender_lid: ownLid,
        recipient: peerPn,
        recipient_lid: peerLid,
        t: String(seconds),
      },
      content: [{ tag: 'plaintext', attrs: {}, content: wrapped }],
    },
    ownPn,
    ownLid,
    { lidMapping: mapping },
    {},
  );
  await node.decrypt();
  assert.equal(node.fullMessage.message.conversation, 'Original text');
  assert.deepEqual(
    Buffer.from(node.fullMessage.message.messageContextInfo.messageSecret),
    secret,
  );
  assert.equal(node.fullMessage.key.remoteJidAlt, peerLid);
});

test('an authenticated direct edit updates the original before notifying webhook and WebSocket', async () => {
  const fixture = serviceFixture();
  await fixture.receive(editEnvelope({ remoteJid: peerLid, fromMe: false }));
  const scope = fixture.reads[0].where;
  assert.equal(scope.instanceId, 3);
  assert.equal(scope.keyId, originalId);
  assert.equal(scope.keyFromMe, false);
  assert.deepEqual(scope.OR[0].keyRemoteJid.in, [peerLid, peerPn]);
  const [{ data, where }] = fixture.writes;
  assert.deepEqual(data.content, { text: 'Edited text' });
  assert.equal(data.messageEditedAt.getTime(), seconds * 1000 + 432);
  assert.deepEqual(where.AND[2].OR[1].messageEditedAt, { lt: data.messageEditedAt });
  const [[eventName, event]] = fixture.webhooks;
  assert.equal(eventName, 'messagesUpdated');
  assert.equal(event.id, originalId);
  assert.equal(event.type, 'MESSAGE_EDIT');
  assert.equal(event.messageTimestamp, seconds);
  assert.deepEqual(event.content, data.content);
  assert.equal(event.messageSecret, undefined);
  assert.deepEqual(fixture.socketEvents[0], ['test', 'messages.update', event]);
});

test('group edits match the group participant and edits from the paired phone use local identities', async () => {
  const group = serviceFixture();
  await group.receive(
    editEnvelope(
      { remoteJid: groupJid, participant: peerLid, fromMe: false },
      { fromMe: false },
    ),
  );
  assert.deepEqual(group.reads[0].where.AND.OR[0].keyParticipant.in, [peerLid, peerPn]);
  assert.equal(group.writes.length, 1);

  const own = serviceFixture();
  await own.receive(
    editEnvelope({ remoteJid: peerPn, fromMe: true }, { sender: ownPn, editor: ownLid }),
  );
  assert.equal(own.reads[0].where.keyFromMe, true);
  assert.equal(own.writes.length, 1);
});

test('missing secrets, tampered data, mismatched targets and other protocol types only notify metadata', async () => {
  const key = { remoteJid: peerPn, fromMe: false };
  for (const [storedSecret, options] of [
    [null, {}],
    [secret, { corrupt: true }],
    [secret, { embeddedId: 'other-message' }],
    [secret, { type: proto.Message.ProtocolMessage.Type.REVOKE }],
  ]) {
    const fixture = serviceFixture({ storedSecret });
    await fixture.receive(editEnvelope(key, options));
    assert.equal(fixture.writes.length, 0);
    assert.equal(fixture.webhooks.length, 1);
    assert.equal(fixture.webhooks[0][1].content, undefined);
  }
});

test('an older or duplicate edit cannot replace a newer edit, even within the same second', async () => {
  const fixture = serviceFixture();
  const key = { remoteJid: peerPn, fromMe: false };
  await fixture.receive(editEnvelope(key, { timestamp: seconds * 1000 + 900 }));
  await fixture.receive(editEnvelope(key, { timestamp: seconds * 1000 + 900 }));
  await fixture.receive(editEnvelope(key, { timestamp: seconds * 1000 + 100 }));
  assert.equal(fixture.webhooks.length, 1);
});

test('replaying the original message does not reinsert its old content', async () => {
  const fixture = serviceFixture({ existingEdit: true });
  await fixture.receive(
    {
      key: { id: originalId, remoteJid: peerPn, fromMe: false },
      messageTimestamp: seconds - 10,
      message: {
        conversation: 'Original text',
        messageContextInfo: { messageSecret: secret },
      },
    },
    'append',
  );
  assert.equal(fixture.webhooks.length, 0);
});
