/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename logger.config.ts                                                   │
 * │ Developed by: Cleber Wilson                                                  │
 * │ Creation date: Nov 27, 2022                                                  │
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
 * │ @function formatDateLog @param {Number} timestamp                            │
 * │ @enum {Color} @enum {Command} @enum {Level} @enum {Type} @enum {Background}  │
 * │                                                                              │
 * │ @class                                                                       │
 * │ @constructs Logger @param {String} context                                   │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { LoggerMiddleware } from '../middle/logger.middle';
import { ConfigService, Log } from './env.config';
import dayjs from 'dayjs';

const formatDateLog = (timestamp: number) =>
  dayjs(timestamp)
    .toDate()
    .toString()
    .replace(/\sGMT.+/, '');

enum Color {
  LOG = '\x1b[32m',
  INFO = '\x1b[34m',
  WARN = '\x1b[33m',
  ERROR = '\x1b[31m',
  DEBUG = '\x1b[36m',
  VERBOSE = '\x1b[37m',
  DARK = '\x1b[30m',
}

enum Command {
  RESET = '\x1b[0m',
  BRIGHT = '\x1b[1m',
  UNDERSCORE = '\x1b[4m',
}

enum Level {
  LOG = Color.LOG + '%s' + Command.RESET,
  DARK = Color.DARK + '%s' + Command.RESET,
  INFO = Color.INFO + '%s' + Command.RESET,
  WARN = Color.WARN + '%s' + Command.RESET,
  ERROR = Color.ERROR + '%s' + Command.RESET,
  DEBUG = Color.DEBUG + '%s' + Command.RESET,
  VERBOSE = Color.VERBOSE + '%s' + Command.RESET,
}

enum Type {
  LOG = 'LOG',
  WARN = 'WARN',
  INFO = 'INFO',
  DARK = 'DARK',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
  VERBOSE = 'VERBOSE',
}

enum Background {
  LOG = '\x1b[42m',
  INFO = '\x1b[44m',
  WARN = '\x1b[43m',
  DARK = '\x1b[40m',
  ERROR = '\x1b[41m',
  DEBUG = '\x1b[46m',
  VERBOSE = '\x1b[47m',
}

export class Logger {
  constructor(
    private readonly configService: ConfigService,
    private context = 'Logger',
  ) {}

  private subCtx: string;

  public setContext(value: string) {
    this.context = value;
  }

  public subContext(value?: string) {
    if (!value) return (this.subCtx = undefined);
    this.subCtx = value;
  }

  private console(value: any, type: Type) {
    const types: Type[] = [];

    this.configService.get<Log>('LOG').LEVEL.forEach((level) => types.push(Type[level]));

    const typeValue = typeof value;
    const isObject = typeValue === 'object';

    if (types.includes(type)) {
      if (this.configService.get<Log>('LOG').COLOR) {
        console.log(
          /*Command.UNDERSCORE +*/ Command.BRIGHT + Level[type],
          '[CodeChat]',
          Command.BRIGHT + Color[type],
          process.pid.toString(),
          Command.RESET,
          Command.BRIGHT + Color[type],
          '-',
          Command.BRIGHT + Color.VERBOSE,
          `${formatDateLog(Date.now())}  `,
          Command.RESET,
          Color[type] + Background[type] + Command.BRIGHT,
          `${type} ` + Command.RESET,
          Color.WARN + Command.BRIGHT,
          `[${this.context}]` + Command.RESET,
          Color[type] + Command.BRIGHT,
          `[${this.subCtx || typeValue}]` + Command.RESET,
          Color[type],
          !isObject ? value : '',
          Command.RESET,
        );
        if (isObject) {
          console.log(value, '\n');
        }
      } else {
        console.log(
          '[CodeChat]',
          process.pid.toString(),
          '-',
          `${formatDateLog(Date.now())}  `,
          `${type} `,
          `[${this.context}]`,
          `[${typeValue}]`,
          value,
        );
      }
    }

    return value;
  }

  public log<T>(value: T): T {
    return this.console(value, Type.LOG);
  }

  public info<T>(value: T): T {
    return this.console(value, Type.INFO);
  }

  public warn<T>(value: T): T {
    return this.console(value, Type.WARN);
  }

  public error<T>(value: T): T {
    return this.console(value, Type.ERROR);
  }

  public verbose<T>(value: T): T {
    return this.console(value, Type.VERBOSE);
  }

  public debug<T>(value: T): T {
    return this.console(value, Type.DEBUG);
  }

  public dark<T>(value: T): T {
    return this.console(value, Type.DARK);
  }
}
