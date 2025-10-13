import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { ProxyAgent as UndiciProxyAgent } from 'undici';

export interface ProxyAgents {
  wsAgent?: any;
  fetchAgent?: any;
}

export function createProxyAgents(
  wsProxyUrl?: string,
  fetchProxyUrl?: string,
): ProxyAgents {
  const agents: ProxyAgents = {};

  const detectProtocol = (url: string) => url.split(':')[0].toLowerCase();

  // WS
  if (wsProxyUrl) {
    const proto = detectProtocol(wsProxyUrl);
    switch (proto) {
      case 'http':
      case 'https':
        agents.wsAgent = new HttpsProxyAgent(wsProxyUrl);
        break;
      case 'socks':
      case 'socks4':
      case 'socks5':
        agents.wsAgent = new SocksProxyAgent(wsProxyUrl);
        break;
      default:
        console.warn(`[Proxy] Protocolo desconhecido para WS: ${proto}`);
        break;
    }
  }

  // FETCH
  if (fetchProxyUrl) {
    const proto = detectProtocol(fetchProxyUrl);
    switch (proto) {
      case 'http':
      case 'https':
      case 'socks':
      case 'socks4':
      case 'socks5':
        agents.fetchAgent = new UndiciProxyAgent(fetchProxyUrl);
        break;
      default:
        console.warn(`[Proxy] Protocolo desconhecido para Fetch: ${proto}`);
        break;
    }
  }

  return agents;
}
