import { WAVersion } from '@whiskeysockets/baileys';
import axios from 'axios';

const REFRESH_INTERVAL = 60 * 60 * 1000 * 27 * 3;

/**
 * Parses WA_VERSION (e.g. "[ 2, 3000, 1025257277 ]") into a WAVersion tuple.
 * This is the fallback whenever the live lookup below fails — without it
 * Baileys would connect with an empty version array.
 */
const envVersion = (): WAVersion | undefined => {
  try {
    const parsed = JSON.parse(process.env.WA_VERSION ?? '[]');
    if (Array.isArray(parsed) && parsed.length === 3 && parsed.every(Number.isInteger)) {
      return parsed as WAVersion;
    }
  } catch {
    //
  }

  return undefined;
};

const v = {
  version: envVersion() as WAVersion,
  isLatest: false,
};

const extract = async () => {
  const resp = await axios.get<string>('https://web.whatsapp.com/sw.js');
  if (!resp) {
    return undefined;
  }

  const re = /JSON\.parse\(\s*(?:\/\*[^]*?\*\/\s*)?("(?:(?:\\.|[^"\\])*)")\s*\)/;
  const m = re.exec(resp.data);
  if (!m) {
    return undefined;
  }

  const jsonText = JSON.parse(m[1]);
  const obj = JSON.parse(jsonText);
  const revision = obj?.dynamic_data?.dynamic_modules?.SiteData?.client_revision as number;

  return revision ? +revision : undefined;
};

const refresh = async () => {
  try {
    const revision = await extract();
    if (revision) {
      v.version = [2, 3000, revision];
      v.isLatest = true;
    }
  } catch {
    // Keep whatever version we already have (live value or WA_VERSION).
  }
};

(async () => {
  await refresh();
  setInterval(refresh, REFRESH_INTERVAL);
})();

export const fetchLatestBaileysVersionV2 = () => v;
