import { WAVersion } from '@whiskeysockets/baileys';
import axios from 'axios';

export const fetchLatestBaileysVersionV2 = async () => {
  try {
    const resp = await axios.get<string>('https://web.whatsapp.com/sw.js');
    const re = /JSON\.parse\(\s*(?:\/\*[^]*?\*\/\s*)?("(?:(?:\\.|[^"\\])*)")\s*\)/;
    const m = re.exec(resp.data);
    if (!m) {
      return {
        version: [2, 3000, 1030436551.257521] as WAVersion,
        isLatest: false,
        error: new Error('regexp-filed'),
      };
    }

    const escaped = m[1];
    const jsonText = JSON.parse(escaped) as string;
    const obj = JSON.parse(jsonText) as Record<string, unknown>;

    const v = obj?.dynamic_data?.['dynamic_modules']?.SiteData?.client_revision as number;
    if (v) {
      return {
        version: [2, 3000, v] as WAVersion,
        isLatest: true,
        error: null as unknown,
      };
    } else {
      return {
        version: [2, 3000, 1030436551.257521] as WAVersion,
        isLatest: false,
        error: new Error('version not-found'),
      };
    }
  } catch (error) {
    const waVersion = JSON.parse(process.env?.WA_VERSION || '[]') as number[];
    return {
      version: [2, 3000, waVersion?.[2] ?? 1029707447] as WAVersion,
      isLatest: false,
      error: error as unknown,
    };
  }
};
