/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename message.model.ts                                                   │
 * │ Developed by: Cleber Wilson                                                  │
 * │ Creation date: Dez 02, 2023                                                  │
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
 * │ @class Repository                                                            │
 * │ @type {ITypebotModel}                                                        │
 * │ @type {CreateLogs}                                                           │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

export class Query<T> {
  where?: T;
  sort?: 'asc' | 'desc';
  page?: number;
  offset?: number;
}

import { Prisma, PrismaClient, Webhook } from '@prisma/client';
import { WebhookEvents } from '../whatsapp/dto/webhook.dto';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '../exceptions';
import { Logger } from '../config/logger.config';
import { ConfigService, Database } from '../config/env.config';
import { PrismaPg } from '@prisma/adapter-pg';

type CreateLogs = {
  context: string;
  description?: string;
  type: 'error' | 'info' | 'warning' | 'log';
  content: any;
};

export class Repository extends PrismaClient {
  constructor(private readonly configService: ConfigService) {
    super({
      adapter: new PrismaPg(
        { connectionString: process.env.DATABASE_URL },
        {
          onConnectionError(err) {
            throw new InternalServerErrorException(err);
          },
        },
      ),
    });
  }

  private readonly logger = new Logger(this.configService, Repository.name);

  public async onModuleInit() {
    await this.$connect();
    this.logger.info('Repository:Connected - ON');
  }

  public async onModuleDestroy() {
    await this.$disconnect();
    this.logger.warn('Repository:Prisma - OFF');
  }

  public async updateWebhook(
    webhookId: number,
    data: Partial<Webhook> & { events?: WebhookEvents },
  ) {
    const find = await this.webhook.findUnique({
      where: {
        id: webhookId,
      },
    });
    if (!find) {
      throw new NotFoundException(['Webhook not found', `Webhook id: ${webhookId}`]);
    }
    try {
      for await (const [key, value] of Object.entries(data?.events)) {
        if (value === undefined) {
          continue;
        }

        if (!find?.events) {
          break;
        }

        const k = `ARRAY['${key}']`;
        const v = `to_jsonb(${value as string}::boolean)`;

        await this.$queryRaw(
          Prisma.sql`UPDATE "Webhook" SET events = jsonb_set(events, ${Prisma.raw(
            k,
          )}, ${Prisma.raw(v)}) WHERE id = ${webhookId}`,
        );
      }

      const updated = await this.webhook.update({
        where: {
          id: webhookId,
        },
        data: {
          url: data?.url,
          enabled: data?.enabled,
          events: !find?.events ? data?.events : undefined,
        },
        select: {
          id: true,
          url: true,
          enabled: true,
          events: true,
          instanceId: true,
        },
      });

      return updated;
    } catch (error) {
      throw new BadRequestException([error?.message, error?.stack]);
    }
  }

  public async createLogs(instance: string, logs: CreateLogs) {
    if (!this.configService.get<Database>('DATABASE').DB_OPTIONS?.LOGS) {
      return;
    }
    return await this.activityLogs.create({
      data: {
        ...logs,
        Instance: {
          connect: {
            name: instance,
          },
        },
      },
    });
  }
}
