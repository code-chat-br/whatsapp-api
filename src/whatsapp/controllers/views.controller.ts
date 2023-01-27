import { Request, Response } from 'express';
import { Auth, ConfigService } from '../../config/env.config';
import { BadRequestException } from '../../exceptions';
import { InstanceDto } from '../dto/instance.dto';
import { RepositoryBroker } from '../repository/repository.manager';
import { HttpStatus } from '../routers/index.router';
import { WAMonitoringService } from '../services/monitor.service';

export class ViewsController {
  constructor(
    private readonly waMonit: WAMonitoringService,
    private readonly configService: ConfigService,
    private readonly repository: RepositoryBroker,
  ) {}

  public async qrcode(request: Request, response: Response) {
    const param = request.params as unknown as InstanceDto;
    const instance = this.waMonit.waInstances[param.instanceName];
    if (instance.connectionStatus.state === 'open') {
      throw new BadRequestException('The instance is already connected');
    }
    const type = this.configService.get<Auth>('AUTHENTICATION').TYPE;
    const data = await this.repository.auth.find(instance.instanceName);

    const hash = type === 'jwt' ? `Bearer ${data[type]}` : data[type];

    const auth = { type, hash };

    return response.status(HttpStatus.OK).render('qrcode', { ...auth, ...param });
  }
}
