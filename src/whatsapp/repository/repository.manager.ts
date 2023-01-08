import { MessageRepository } from './message.repository';
import { ChatRepository } from './chat.repository';
import { ContactRepository } from './contact.repository';
import { MessageUpRepository } from './messageUp.repository';
import { MongoClient } from 'mongodb';

export class RepositoryBroker {
  constructor(
    public readonly message: MessageRepository,
    public readonly chat: ChatRepository,
    public readonly contact: ContactRepository,
    public readonly messageUpdate: MessageUpRepository,
    dbServer?: MongoClient,
  ) {
    RepositoryBroker.dbClient = dbServer;
  }

  private static dbClient?: MongoClient;

  public static get dbServer() {
    return RepositoryBroker.dbClient;
  }
}
