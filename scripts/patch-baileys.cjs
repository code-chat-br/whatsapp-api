const { readFileSync, writeFileSync } = require('node:fs');
const { dirname, join } = require('node:path');

// Baileys rc14 drops the outer message secret when unwrapping deviceSentMessage.
// Remove this backport when upgrading to a release that retains it (Baileys #2743).
const decoder = join(
  dirname(require.resolve('@whiskeysockets/baileys')),
  'Utils/decode-wa-message.js',
);
const unwrap = `const inner = msg.deviceSentMessage?.message;
                        if (inner) {
                            const outerContext = msg.messageContextInfo;
                            msg = inner;
                            if (outerContext) {
                                msg.messageContextInfo = { ...outerContext, ...inner.messageContextInfo };
                            }
                        }`;

const changes = [
  ['msg = msg.deviceSentMessage?.message || msg;', unwrap],
  // For messages sent by our phone, the chat belongs to the recipient, not the sender.
  [
    'remoteJidAlt: !isJidGroup(chatId) ? addressingContext.senderAlt : undefined,',
    'remoteJidAlt: !isJidGroup(chatId) ? (fromMe && recipient ? addressingContext.recipientAlt : addressingContext.senderAlt) : undefined,',
  ],
];
const source = readFileSync(decoder, 'utf8');
let patched = source;
for (const [original, replacement] of changes) {
  if (patched.includes(replacement)) {
    continue;
  }
  if (!patched.includes(original)) {
    throw new Error('Baileys message decoder changed. Review the message-edit backport.');
  }
  patched = patched.replace(original, replacement);
}
if (patched !== source) {
  writeFileSync(decoder, patched);
}
