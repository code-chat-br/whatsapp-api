/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename proxy.ts                                                           │
 * │ Developed by: Cleber Wilson                                                  │
 * │ Creation date: Out 13, 2025                                                  │
 * │ Contact: contato@codechat.dev                                                │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @copyright © Cleber Wilson 2023. All rights reserved.                        │
 * │ Licensed under the Apache License, Version 2.0                               │
 * │                                                                              │
 * │  @license "https://github.com/code-chat-br/whatsapp-api/blob/main/LICENSE"   │
 * │                                                                              │
 * │ You may not use this file except in compliance with the License.             │
 * │ You may obtain a copy of the License at                                      │
 * │                                                                              │
 * │    http://www.apache.org/licenses/LICENSE-2.0                                │
 * │                                                                              │
 * │ Unless required by applicable law or agreed to in writing, software          │
 * │ distributed under the License is distributed on an "AS IS" BASIS,            │
 * │ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     │
 * │                                                                              │
 * │ See the License for the specific language governing permissions and          │
 * │ limitations under the License.                                               │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

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
