import { Request, Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Auth, ConfigService } from '../../config/env.config';
import { AUTH_DIR } from '../../config/path.config';
import { BadRequestException } from '../../exceptions';
import { InstanceDto } from '../dto/instance.dto';
import { HttpStatus } from '../routers/index.router';
import { JwtPayload } from '../services/auth.service';
import { WAMonitoringService } from '../services/monitor.service';

export class ViewsController {
  constructor(
    private readonly waMonit: WAMonitoringService,
    private readonly configService: ConfigService,
  ) {}

  public qrcode(request: Request, response: Response) {
    const param = request.params as unknown as InstanceDto;
    const instance = this.waMonit.waInstances[param.instanceName];
    if (instance.connectionStatus.state === 'open') {
      throw new BadRequestException('The instance is already connected');
    }
    const type = this.configService.get<Auth>('AUTHENTICATION').TYPE;
    const data: JwtPayload = JSON.parse(
      readFileSync(join(AUTH_DIR, type, param.instanceName + '.json'), {
        encoding: 'utf-8',
      }),
    );

    const hash = type === 'jwt' ? `Bearer ${data[type]}` : data[type];

    const auth = { type, hash };

    return response.status(HttpStatus.OK).render('qrcode', { ...auth, ...param });
  }
}
