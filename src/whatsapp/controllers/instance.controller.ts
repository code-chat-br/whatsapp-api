import { delay } from '@adiwajshing/baileys';
import EventEmitter2 from 'eventemitter2';
import { ConfigService } from '../../config/env.config';
import { InternalServerErrorException } from '../../exceptions';
import { InstanceDto } from '../dto/instance.dto';
import { RepositoryBroker } from '../repository/index.repository';
import { AuthService, OldToken } from '../services/auth.service';
import { WAMonitoringService } from '../services/monitor.service';
import { WAStartupService } from '../services/whatsapp.service';

export class InstanceController {
  constructor(
    private readonly waMonitor: WAMonitoringService,
    private readonly configService: ConfigService,
    private readonly repository: RepositoryBroker,
    private readonly eventEmitter: EventEmitter2,
    private readonly authService: AuthService,
  ) {}

  public async createInstance({ instanceName }: InstanceDto) {
    const instance = new WAStartupService(
      this.configService,
      this.eventEmitter,
      this.repository,
    );
    instance.instanceName = instanceName;
    this.waMonitor.waInstances[instance.instanceName] = instance;

    const hash = this.authService.generateHash({ instanceName: instance.instanceName });

    return {
      instance: {
        instanceName: instance.instanceName,
        status: 'created',
      },
      hash,
    };
  }

  public async connectToWhatsapp({ instanceName }: InstanceDto) {
    const instance = this.waMonitor.waInstances[instanceName];
    const state = instance.connectionStatus?.state;

    switch (state) {
      case 'close':
        await instance.connectToWhatsapp();
        await delay(1200);
        return instance.qrCode;
      case 'connecting':
        return instance.qrCode;
      default:
        return {};
    }
  }

  public async connectionState({ instanceName }: InstanceDto) {
    return this.waMonitor.waInstances[instanceName].connectionStatus;
  }

  public async logout({ instanceName }: InstanceDto) {
    try {
      this.eventEmitter.emit('remove.instance', instanceName);
      return { error: false, message: 'Instance logged out' };
    } catch (error) {
      throw new InternalServerErrorException(error.toString());
    }
  }

  public async refreshToken(_: InstanceDto, oldToken: OldToken) {
    return this.authService.refreshToken(oldToken);
  }
}
