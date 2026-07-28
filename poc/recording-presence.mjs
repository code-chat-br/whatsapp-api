/**
 * PoC: show the "recording audio…" presence before a message is delivered.
 *
 * The API fires sendPresenceUpdate(presence) -> waits `delay` ms -> sends.
 * (see src/whatsapp/services/whatsapp.service.ts: sendMessageWithTyping)
 *
 *   presence: 'composing'  -> recipient sees "typing…"
 *   presence: 'recording'  -> recipient sees "recording audio…"
 *
 * The /message/sendWhatsAppAudio endpoint hard-codes presence:'recording',
 * but ANY message type accepts options.presence, so we can demo it with a
 * plain text message and a long delay so the indicator is clearly visible.
 *
 * Usage:
 *   node poc/recording-presence.mjs <number> [instance]
 *
 * Env (with sensible defaults read from .env):
 *   BASE_URL   default http://localhost:8084
 *   API_TOKEN  default = AUTHENTICATION_GLOBAL_AUTH_TOKEN
 *   INSTANCE   instance name (or pass as 2nd arg)
 *   NUMBER     destination (or pass as 1st arg), e.g. 5531999999999
 *   DELAY      ms the indicator stays visible (default 6000)
 */

const BASE_URL = (process.env.BASE_URL || 'http://localhost:8084').replace(/\/$/, '');
const TOKEN = process.env.API_TOKEN || 'zYzP7ocstxh3Sscefew4FZTCu4ehnM8v4hu';
const NUMBER = process.argv[2] || process.env.NUMBER;
const INSTANCE = process.argv[3] || process.env.INSTANCE;
const DELAY = Number(process.env.DELAY || 6000);

if (!NUMBER || !INSTANCE) {
  console.error('Usage: node poc/recording-presence.mjs <number> <instance>');
  console.error('   or set NUMBER and INSTANCE env vars.');
  process.exit(1);
}

async function send(path, body, label) {
  const url = `${BASE_URL}/message/${path}/${INSTANCE}`;
  console.log(`\n→ ${label}`);
  console.log(`  POST ${url}`);
  console.log(`  body: ${JSON.stringify(body)}`);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // global token via apikey header; if you use a per-instance JWT instead,
      // set: Authorization: `Bearer ${TOKEN}`
      apikey: TOKEN,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  console.log(`  ← ${res.status} ${res.statusText}: ${text.slice(0, 300)}`);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
}

(async () => {
  // 1) "typing…" for comparison
  await send(
    'sendText',
    { number: NUMBER, options: { delay: DELAY, presence: 'composing' },
      textMessage: { text: 'This was preceded by a "typing…" indicator.' } },
    `composing → watch "${NUMBER}" show "typing…" for ${DELAY}ms`,
  );

  // 2) "recording audio…" on a text message
  await send(
    'sendText',
    { number: NUMBER, options: { delay: DELAY, presence: 'recording' },
      textMessage: { text: 'This was preceded by a "recording audio…" indicator.' } },
    `recording → watch "${NUMBER}" show "recording audio…" for ${DELAY}ms`,
  );

  // 3) Real voice note — sendWhatsAppAudio forces presence:'recording' itself.
  //    Uncomment and point `audio` at a URL or base64 to try it.
  await send(
    'sendWhatsAppAudio',
    { number: NUMBER, options: { delay: DELAY },
      audioMessage: { audio: 'https://www.kozco.com/tech/piano2.wav' } },
    'real audio (recording forced by the endpoint)',
  );

  console.log('\n✓ Done. Watch the chat header on the recipient device for the indicators.');
})().catch((e) => {
  console.error('\n✗', e.message);
  process.exit(1);
});
