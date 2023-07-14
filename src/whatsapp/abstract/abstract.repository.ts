/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename abstract.repository.ts                                             │
 * │ Developed by: Cleber Wilson                                                  │
 * │ Creation date: Jul 17, 2022                                                  │
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
 * │ @interface IRepository                                                       │
 * │ @type {WriteStore} @type {IInsert}                                           │
 * │                                                                              │
 * │ @abstract @class                                                             │
 * │ @constructs Repository                                                       │
 * │ @param {ConfigService} configService                                         │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ConfigService, Database } from '../../config/env.config';
import { ROOT_DIR } from '../../config/path.config';

export type IInsert = { insertCount: number };

export interface IRepository {
  insert(data: any, saveDb?: boolean): Promise<IInsert>;
  find(query: any): Promise<any>;
  delete(query: any, force?: boolean): Promise<any>;

  dbSettings: Database;
  readonly storePath: string;
}

type WriteStore<U> = {
  path: string;
  fileName: string;
  data: U;
};

export abstract class Repository implements IRepository {
  constructor(configService: ConfigService) {
    this.dbSettings = configService.get<Database>('DATABASE');
  }

  dbSettings: Database;
  readonly storePath = join(ROOT_DIR, 'store');

  public writeStore = <T = any>(create: WriteStore<T>) => {
    if (!existsSync(create.path)) {
      mkdirSync(create.path, { recursive: true });
    }
    try {
      writeFileSync(
        join(create.path, create.fileName + '.json'),
        JSON.stringify({ ...create.data }),
        { encoding: 'utf-8' },
      );

      return { message: 'create - success' };
    } finally {
      create.data = undefined;
    }
  };

  public insert(data: any, saveDb = false): Promise<IInsert> {
    throw new Error('Method not implemented.');
  }
  public find(query: any): Promise<any> {
    throw new Error('Method not implemented.');
  }

  delete(query: any, force?: boolean): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
