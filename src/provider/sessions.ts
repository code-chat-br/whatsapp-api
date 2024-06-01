import axios, { Axios } from 'axios';
import { ConfigService, ProviderSession } from '../config/env.config';
import { Logger } from '../config/logger.config';
import { execSync } from 'child_process';

type ResponseSuccess = { status: number; data?: any };
type ResponseProvider = Promise<[ResponseSuccess?, Error?]>;

export class ProviderFiles {
  constructor(private readonly configService: ConfigService) {}

  private readonly logger = new Logger(this.configService, ProviderFiles.name);

  private _client: Axios;

  public get client() {
    return this._client;
  }

  private readonly config = Object.freeze(
    this.configService.get<ProviderSession>('PROVIDER'),
  );

  get isEnabled() {
    return !!this.config?.ENABLED;
  }

  public async onModuleInit() {
    if (this.config.ENABLED) {
      this._client = axios.create({
        baseURL: `http://${this.config.HOST}:${this.config.PORT}/session/${this.config.PREFIX}`,
      });
      try {
        const response = await this._client.options('/ping');
        if (!response?.data?.pong) {
          throw new Error('Offline file provider.');
        }
      } catch (error) {
        this.logger.error([
          'Failed to connect to the file server',
          error?.message,
          error?.stack,
        ]);
        const pid = process.pid;
        execSync(`kill -9 ${pid}`);
      }
    }
  }

  public async onModuleDestroy() {
    //
  }

  public async create(instance: string): ResponseProvider {
    try {
      const response = await this._client.post(`/`, { instance });
      return [{ status: response.status, data: response?.data }];
    } catch (error) {
      return [, error];
    }
  }

  public async write(instance: string, key: string, data: any): ResponseProvider {
    try {
      const response = await this._client.post(`/${instance}/${key}`, data);
      return [{ status: response.status, data: response?.data }];
    } catch (error) {
      return [, error];
    }
  }

  public async read(instance: string, key: string): ResponseProvider {
    try {
      const response = await this._client.get(`/${instance}/${key}`);
      return [{ status: response.status, data: response?.data }];
    } catch (error) {
      return [, error];
    }
  }

  public async delete(instance: string, key: string): ResponseProvider {
    try {
      const response = await this._client.delete(`/${instance}/${key}`);
      return [{ status: response.status, data: response?.data }];
    } catch (error) {
      return [, error];
    }
  }

  public async allInstances(): ResponseProvider {
    try {
      const response = await this._client.get(`/list-instances`);
      return [{ status: response.status, data: response?.data as string[] }];
    } catch (error) {
      return [, error];
    }
  }

  public async removeSession(instance: string): ResponseProvider {
    try {
      const response = await this._client.delete(`/${instance}`);
      return [{ status: response.status, data: response?.data }];
    } catch (error) {
      return [, error];
    }
  }
}
