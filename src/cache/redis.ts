import { RedisClientType, createClient } from 'redis';
import { ConfigService, Redis } from '../config/env.config';
import { Logger } from '../config/logger.config';

export class RedisCache {
  constructor(private readonly configService: ConfigService) {}

  private readonly logger = new Logger(this.configService, RedisCache.name);

  private _client: RedisClientType;

  public get client() {
    return this._client;
  }

  public get isConnected() {
    return this.client?.isOpen;
  }

  private readonly config = Object.freeze(this.configService.get<Redis>('REDIS'));

  public async onModuleInit() {
    if (this.config.ENABLED) {
      this._client = createClient({
        url: this.config.URI,
        name: 'codechat_v1',
      });
      await this.client.connect();
      this.logger.info('Redis:Connected - ON');
    }
  }

  public async onModuleDestroy() {
    await this.client?.disconnect();
    this.logger.warn('Cache:Redis - OFF');
  }

  public keys(pattern: string) {
    return new Promise<string[]>((resolve, reject) => {
      resolve(this.client.keys(pattern));
      reject(new Error('Error on get keys'));
    });
  }

  public async del(key: string) {
    try {
      return await this.client.del(`${this.config.PREFIX_KEY}:${key}`);
    } catch (error) {
      this.logger.error({ localError: 'dell', error });
    }
  }
}
