import { opendirSync, readdirSync, rmSync } from 'fs';
import { WAStartupService } from './whatsapp.service';
import { INSTANCE_DIR } from '../../config/path.config';
import EventEmitter2 from 'eventemitter2';
import { join } from 'path';
import { Logger } from '../../config/logger.config';
import { ConfigService, Database, DelInstance } from '../../config/env.config';
import { RepositoryBroker } from '../repository/repository.manager';
import { NotFoundException } from '../../exceptions';

export class WAMonitoringService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    private readonly repository: RepositoryBroker,
  ) {
    this.removeInstance();
    this.noConnection();
    this.delInstanceFiles();

    this.dbInstance = this.db.ENABLED
      ? this.repository.dbServer.db(this.db.CONNECTION.DB_PREFIX_NAME + '-instances')
      : null;

    Object.assign(this.db, configService.get<Database>('DATABASE'));
  }

  private readonly db: Partial<Database> = {};
  private dbInstance: any;

  private readonly logger = new Logger(WAMonitoringService.name);
  public readonly waInstances: Record<string, WAStartupService> = {};

  public delInstanceTime(instance: string) {
    const time = this.configService.get<DelInstance>('DEL_INSTANCE');
    if (typeof time === 'number' && time > 0) {
      setTimeout(() => {
        if (this.waInstances[instance]?.connectionStatus?.state !== 'open') {
          delete this.waInstances[instance];
        }
      }, 1000 * 60 * time);
    }
  }

  public async instanceInfo(instanceName?: string) {
    if (instanceName && !this.waInstances[instanceName]) {
      throw new NotFoundException(`Instance "${instanceName}" not found`);
    }

    const instances: any[] = [];

    for await (const [key, value] of Object.entries(this.waInstances)) {
      if (value && value.connectionStatus.state === 'open') {
        instances.push({
          instance: {
            instanceName: key,
            owner: value.wuid,
            profileName: (await value.getProfileName()) || 'not loaded',
            profilePictureUrl: value.profilePictureUrl,
          },
        });
      }
    }

    return instances.find((i) => i.instance.instanceName === instanceName) ?? instances;
  }

  private delInstanceFiles() {
    setInterval(async () => {
      if (this.db.ENABLED && this.db.SAVE_DATA.INSTANCE) {
        const collections = await this.dbInstance.collections();
        collections.forEach(async (collection) => {
          const name = collection.namespace.replace(/^[\w-]+./, '');
          await this.dbInstance.collection(name).deleteMany({
            $or: [
              { _id: { $regex: /^app.state.*/ } },
              { _id: { $regex: /^session-.*/ } },
            ],
          });
        });
      } else {
        const dir = opendirSync(INSTANCE_DIR, { encoding: 'utf-8' });
        for await (const dirent of dir) {
          if (dirent.isDirectory()) {
            const files = readdirSync(join(INSTANCE_DIR, dirent.name), {
              encoding: 'utf-8',
            });
            files.forEach(async (file) => {
              if (file.match(/^app.state.*/) || file.match(/^session-.*/)) {
                rmSync(join(INSTANCE_DIR, dirent.name, file), {
                  recursive: true,
                  force: true,
                });
              }
            });
          }
        }
      }
    }, 3600 * 1000 * 2);
  }

  public async loadInstance() {
    const set = async (name: string) => {
      const instance = new WAStartupService(
        this.configService,
        this.eventEmitter,
        this.repository,
      );
      instance.instanceName = name;
      await instance.connectToWhatsapp();
      this.waInstances[name] = instance;
    };

    try {
      if (this.db.ENABLED && this.db.SAVE_DATA.INSTANCE) {
        await this.repository.dbServer.connect();
        const collections = await this.dbInstance.collections();
        if (collections.length > 0) {
          collections.forEach(
            async (coll) => await set(coll.namespace.replace(/^[\w-]+\./, '')),
          );
        }
        return;
      }
      const dir = opendirSync(INSTANCE_DIR, { encoding: 'utf-8' });
      for await (const dirent of dir) {
        if (dirent.isDirectory()) {
          const files = readdirSync(join(INSTANCE_DIR, dirent.name), {
            encoding: 'utf-8',
          });
          if (files.length === 0) {
            rmSync(join(INSTANCE_DIR, dirent.name), { recursive: true, force: true });
            break;
          }

          await set(dirent.name);
        }
      }
    } catch {}
  }

  private removeInstance() {
    this.eventEmitter.on('remove.instance', async (instanceName: string) => {
      try {
        await this.waInstances[instanceName]?.client?.logout();
      } catch {}

      try {
        delete this.waInstances[instanceName];
      } catch {}

      try {
        if (this.db.ENABLED && this.db.SAVE_DATA.INSTANCE) {
          await this.repository.dbServer.connect();
          return await this.dbInstance.dropCollection(instanceName);
        }
        rmSync(join(INSTANCE_DIR, instanceName), { recursive: true, force: true });
      } finally {
        this.logger.warn(`Instance "${instanceName}" - REMOVED`);
      }
    });
  }

  private noConnection() {
    this.eventEmitter.once('no.connection', async (instanceName) => {
      try {
        delete this.waInstances[instanceName];

        if (this.db.ENABLED && this.db.SAVE_DATA.INSTANCE) {
          await this.repository.dbServer.connect();
          return await this.dbInstance.dropCollection(instanceName);
        }

        rmSync(join(INSTANCE_DIR, instanceName), { recursive: true, force: true });
      } catch (error) {
        this.logger.error({
          localError: 'noConnection',
          warn: 'Error deleting instance from memory.',
          error,
        });
      } finally {
        this.logger.warn(`Instance "${instanceName}" - REMOVED`);
      }
    });
  }
}
