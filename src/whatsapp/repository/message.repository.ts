import { ConfigService } from '../../config/env.config';
import { join } from 'path';
import { IMessageModel, MessageRaw } from '../models/message.model';
import { IInsert, Repository } from '../abstract/abstract.repository';
import { opendirSync, readFileSync } from 'fs';

export class MessageQuery {
  where: MessageRaw;
}

export class MessageRepository extends Repository {
  constructor(
    private readonly messageModel: IMessageModel,
    private readonly configService: ConfigService,
  ) {
    super(configService);
  }

  public async insert(data: MessageRaw[], saveDb = false): Promise<IInsert> {
    try {
      if (this.dbSettings.ENABLED && saveDb) {
        const insert = await this.messageModel.insertMany([...data]);
        return { insertCount: insert.length };
      }

      data.forEach((msg) =>
        this.writeStore<MessageRaw>({
          path: join(this.storePath, 'messages'),
          fileName: msg.key.id,
          data: msg,
        }),
      );

      return { insertCount: data.length };
    } catch (error) {
      console.log('ERROR: ', error);
      return error;
    } finally {
      data = undefined;
    }
  }

  public async find(query: MessageQuery): Promise<MessageRaw[]> {
    try {
      if (this.dbSettings.ENABLED) {
        return await this.messageModel.find({ ...query.where });
      }

      const messages: MessageRaw[] = [];
      if (query?.where?.key?.id) {
        messages.push(
          JSON.parse(
            readFileSync(join(this.storePath, 'messages', query.where.key.id + '.json'), {
              encoding: 'utf-8',
            }),
          ),
        );
      } else {
        const openDir = opendirSync(join(this.storePath, 'messages'), {
          encoding: 'utf-8',
        });

        for await (const dirent of openDir) {
          if (dirent.isFile()) {
            messages.push(
              JSON.parse(
                readFileSync(join(this.storePath, 'messages', dirent.name), {
                  encoding: 'utf-8',
                }),
              ),
            );
          }
        }
      }

      return messages;
    } catch (error) {
      return [];
    }
  }
}
