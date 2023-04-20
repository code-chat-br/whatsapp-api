import { createClient, RedisClientType } from '@redis/client';
import { Logger } from '../config/logger.config';
import { BufferJSON } from '@codechat/base';

export class RedisCache {
  constructor(uri: string, private instanceName: string) {
    this.client = createClient({ url: uri });

    this.client.connect();
  }

  private readonly logger = new Logger(RedisCache.name);
  private client: RedisClientType;

  public async getKeys() {
    try {
      return await this.client.hKeys(this.instanceName);
    } catch (error) {
      this.logger.error(error);
    }
  }

  public async writeData(field: string, data: any) {
    try {
      const json = JSON.stringify(data, BufferJSON.replacer);
      return await this.client.hSet(this.instanceName, field, json);
    } catch (error) {
      this.logger.error(error);
    }
  }

  public async readData(field: string) {
    try {
      const data = await this.client.hGet(this.instanceName, field);
      if (data) {
        return JSON.parse(data, BufferJSON.reviver);
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  public async removeData(field: string) {
    try {
      return await this.client.hDel(this.instanceName, field);
    } catch (error) {
      this.logger.error(error);
    }
  }

  public async delAll(hash?: string) {
    try {
      return await this.client.del(hash || this.instanceName);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
