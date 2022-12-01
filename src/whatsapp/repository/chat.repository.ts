import { join } from 'path';
import { ConfigService } from '../../config/env.config';
import { ChatRaw, IChatModel } from '../models/chat.model';
import { IInsert, Repository } from '../abstract/abstract.repository';

export class ChatRepository extends Repository {
  constructor(
    private readonly chatModel: IChatModel,
    private readonly configService: ConfigService,
  ) {
    super(configService);
  }

  public async insert(data: ChatRaw[], saveDb = false): Promise<IInsert> {
    try {
      if (this.dbSettings.ENABLED) {
        const insert = await this.chatModel.insertMany([...data]);
        return { insertCount: insert.length };
      }

      data.forEach((chat) => {
        this.writeStore<ChatRaw>({
          path: join(this.storePath, 'chats', chat.owner),
          fileName: chat.id,
          data: chat,
        });
      });

      return { insertCount: data.length };
    } catch (error) {
      return error;
    } finally {
      data = undefined;
    }
  }
}
