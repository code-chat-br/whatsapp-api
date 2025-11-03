/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename scala.config                                                       │
 * │ Developed by: Cleber Wilson                                                  │
 * │ Creation date: Aug 13, 2023                                                  │
 * │ Contact: contato@codechat.dev                                                │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @copyright © Cleber Wilson 2022. All rights reserved.                        │
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
 * │                                                                              │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { Router } from 'express';
import { join } from 'path';
import YAML from 'yamljs';
import { readFileSync } from 'fs';
import { serve, setup } from 'swagger-ui-express';
import pkg from '../../package.json';

const router = Router();

const yamlFile = readFileSync(join(process.cwd(), 'docs', 'swagger.yaml'), {
  encoding: 'utf8',
});

const json = YAML.parse(yamlFile);

if (process.env?.API_BACKEND) {
  json.servers[0].variables.prod_host.default = process.env?.API_BACKEND;
}

const queryParams = new URLSearchParams({
  isDocker: process.env?.DOCKER_ENV || 'false',
  env: process.env?.NODE_ENV || 'dev',
  version: pkg.version,
});

export const docsRouter = router.use(
  '/docs',
  serve,
  setup(json, {
    customSiteTitle: 'CodeChat Api V1',
    customCssUrl: '/css/dark-theme-swagger.css',
    customfavIcon: '/images/logo.png',
    customJs: `/js/pixel.js?${queryParams}`,
  }),
);
