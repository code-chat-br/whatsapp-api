import { Model } from 'mongoose';
import { ConfigService } from '../../config/env.config';
import { IMessageUpModel, MessageUpdateRaw } from '../models/message.model';
import { IInsert, Repository } from '../abstract/abstract.repository';
import { join } from 'path';
import { opendirSync, readFileSync } from 'fs';

export class MessageUpQuery {
  where: MessageUpdateRaw;
}

export class MessageUpRepository extends Repository {
  constructor(
    private readonly messageUpModel: Model<IMessageUpModel>,
    private readonly configService: ConfigService,
  ) {
    super(configService);
  }

  public async insert(data: MessageUpdateRaw[], saveDb?: boolean): Promise<IInsert> {
    try {
      if (this.dbSettings.ENABLED && saveDb) {
        const insert = await this.messageUpModel.insertMany([...data]);
        return { insertCount: insert.length };
      }

      data.forEach((update) => {
        this.writeStore<MessageUpdateRaw>({
          path: join(this.storePath, 'message-up'),
          fileName: update.id,
          data: update,
        });
      });
    } catch (error) {
      return error;
    }
  }

  public async find(query: MessageUpQuery): Promise<MessageUpdateRaw[]> {
    try {
      if (this.dbSettings.ENABLED) {
        return await this.messageUpModel.find({ ...query.where });
      }

      const messageUpdate: MessageUpdateRaw[] = [];
      if (query?.where?.id) {
        messageUpdate.push(
          JSON.parse(
            readFileSync(join(this.storePath, 'message-up', query.where.id + '.json'), {
              encoding: 'utf-8',
            }),
          ),
        );
      } else {
        const openDir = opendirSync(join(this.storePath, 'message-up'), {
          encoding: 'utf-8',
        });

        for await (const dirent of openDir) {
          if (dirent.isFile()) {
            messageUpdate.push(
              JSON.parse(
                readFileSync(join(this.storePath, 'message-up', dirent.name), {
                  encoding: 'utf-8',
                }),
              ),
            );
          }
        }

        return messageUpdate;
      }
    } catch (error) {
      return [];
    }
  }
}
