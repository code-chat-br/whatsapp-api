/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename /workers/session/index.js                                          │
 * │ Developed by: Cleber Wilson                                                  │
 * │ Creation date: Mai 28, 2024                                                  │
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
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';
import express, { json, urlencoded } from 'express';
import { execSync } from 'child_process';

const HostPort = process.env.PORT;

const app = express();

const logger = (...value) =>
  console.log(`Pid: ${process.pid} -`, `Date ${new Date().toISOString()} -`, ...value);

app.listen(5656, logger(`Server ON: Port - 5656 `));
app.use(urlencoded({ extended: true }), json());

const INSTANCE_PATH = 'instances';

if (!existsSync(INSTANCE_PATH)) {
  mkdirSync(INSTANCE_PATH, { recursive: true });
}

app.options('/session/ping', function (req, res) {
  logger('Http - Path: ', req.path);
  res.status(200).json({ pong: true });
});

app.post('/session', function (req, res) {
  const body = req.body;

  const path = join(INSTANCE_PATH, body.instance);

  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }

  res.status(202).send();
});

app.post(`/session/:instance/:key`, function (req, res) {
  const { instance, key } = req.params;
  const body = req.body;

  const path = join(INSTANCE_PATH, instance, key + '.json');

  writeFileSync(path, body.data || {}, { encoding: 'utf8' });

  res.status(202).send();
});

app.get('/session/:instance/:key', function (req, res) {
  const { instance, key } = req.params;

  const path = join(INSTANCE_PATH, instance, key + '.json');

  if (existsSync(path)) {
    const data = readFileSync(path, { encoding: 'utf8' });
    res.status(200).send(data);
  }

  res.status(200).send();
});

app.delete('/session/:instance/:key', function (req, res) {
  const { instance, key } = req.params;

  const path = join(INSTANCE_PATH, instance, key + '.json');

  rmSync(path, { recursive: true });

  res.status(200).send();
});

app.delete(`/session/:instance`, function (req, res) {
  const { instance } = req.params;

  const path = join(INSTANCE_PATH, instance);

  execSync(`rm -rf ${path}`);

  res.status(200).send();
});

app.get('/session/list-instances', function (req, res) {
  const files = readdirSync(INSTANCE_PATH);

  res.status(200).json(files);
});
