import { WAVersion } from '@whiskeysockets/baileys';
import axios from 'axios';

const v = {
  version: [] as unknown as WAVersion,
  isLatest: false,
};

const extract = async () => {
  const resp = await axios.get<string>('https://web.whatsapp.com/sw.js');
  if (resp) {
    const re = /JSON\.parse\(\s*(?:\/\*[^]*?\*\/\s*)?("(?:(?:\\.|[^"\\])*)")\s*\)/;
    const m = re.exec(resp.data);
    if (m) {
      const escaped = m[1];
      const jsonText = JSON.parse(escaped);
      const obj = JSON.parse(jsonText);
      const v = obj?.dynamic_data?.dynamic_modules?.SiteData?.client_revision as number;

      if (v) {
        return +v;
      }

      const resp = await axios.get<string>(
        'https://raw.githubusercontent.com/code-chat-br/whatsapp-api/main/_v/version',
      );

      return +resp.data;
    }
  }
};

(async () => {
  const version = await extract();
  v.isLatest = true;
  v.version = [2, 3000, version];

  setInterval(
    async () => {
      const version = await extract();

      v.isLatest = true;
      v.version = [2, 3000, version];
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
