import { NextFunction, Request, Response } from 'express';
import { existsSync } from 'fs';
import { join } from 'path';
import { INSTANCE_DIR } from '../../config/path.config';
import {
  BadRequestException,
  ForbidenException,
  NotFoundException,
} from '../../exceptions';
import { InstanceDto } from '../dto/instance.dto';
import { waMonitor } from '../whatsapp.module';

export function instanceExistsGuard(req: Request, res: Response, next: NextFunction) {
  if (
    req.originalUrl.includes('/instance/create') ||
    req.originalUrl.includes('/instance/instanceInfo')
  ) {
    return next();
  }

  const param = req.params as unknown as InstanceDto;
  if (!param?.instanceName) {
    throw new BadRequestException('"instanceName" not provided.');
  }

  const instance = waMonitor.waInstances[param.instanceName];

  if (!instance) {
    throw new NotFoundException(`The "${param.instanceName}" instance does not exist`);
  }

  next();
}

export function instanceLoggedGuard(req: Request, res: Response, next: NextFunction) {
  if (req.originalUrl.includes('/instance/create')) {
    const instance = req.body as InstanceDto;
    if (existsSync(join(INSTANCE_DIR, instance.instanceName))) {
      throw new ForbidenException(
        `This name "${instance.instanceName}" is already in use.`,
      );
    }

    if (waMonitor.waInstances[instance.instanceName]) {
      delete waMonitor.waInstances[instance.instanceName];
    }
  }

  next();
}
