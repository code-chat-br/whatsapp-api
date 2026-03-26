import { WAVersion } from '@whiskeysockets/baileys';
import axios from 'axios';

const v = {
  version: [] as unknown as WAVersion,
  isLatest: false,
};

(async () => {
  const resp = await axios.get<string>(
    'https://raw.githubusercontent.com/code-chat-br/whatsapp-api/main/_v/version',
  );
  v.isLatest = true;
  v.version = [2, 3000, +resp.data];

  setInterval(
    async () => {
      const resp = await axios.get<string>(
        'https://raw.githubusercontent.com/code-chat-br/whatsapp-api/main/_v/version',
      );

      v.isLatest = true;
      v.version = [2, 3000, +resp.data];

      console.log('VERSION: ', v);
    },
    60 * 60 * 1000 * 27 * 3,
  );
})();

export const fetchLatestBaileysVersionV2 = () => {
  try {
    return v;
  } catch (error) {
    return {
      version: JSON.parse(process.env.WA_VERSION ?? '[]') as WAVersion,
      isLatest: false,
      error,
    };
  }
};
