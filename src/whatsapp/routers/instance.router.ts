import { RequestHandler, Router } from 'express';
import { instanceNameSchema, oldTokenSchema } from '../../validate/validate.schema';
import { InstanceDto } from '../dto/instance.dto';
import { instanceController } from '../whatsapp.module';
import { RouterBroker } from '../abstract/abstract.router';
import { HttpStatus } from './index.router';
import { OldToken } from '../services/auth.service';
import { Auth, ConfigService } from '../../config/env.config';

export class InstanceRouter extends RouterBroker {
  constructor(readonly configService: ConfigService, ...guards: RequestHandler[]) {
    super();
    const auth = configService.get<Auth>('AUTHENTICATION');
    this.router
      .post('/create', ...guards, async (req, res) => {
        const response = await this.dataValidate<InstanceDto>({
          request: req,
          schema: instanceNameSchema,
          ClassRef: InstanceDto,
          execute: (instance) => instanceController.createInstance(instance),
        });

        let session: any = {};

        auth.TYPE === 'jwt'
          ? (session = { type: 'jwt', hash: response.hash.jwt })
          : (session = { type: 'apikey', hash: response.hash.apikey });
        req.session[response.instance.instanceName] = session;

        return res.status(HttpStatus.CREATED).json(response);
      })
      .get(this.routerPath('connect'), ...guards, async (req, res) => {
        const response = await this.dataValidate<InstanceDto>({
          request: req,
          schema: instanceNameSchema,
          ClassRef: InstanceDto,
          execute: (instance) => instanceController.connectToWhatsapp(instance),
        });

        return res.status(HttpStatus.OK).json(response);
      })
      .get(this.routerPath('connectionState'), ...guards, async (req, res) => {
        const response = await this.dataValidate<InstanceDto>({
          request: req,
          schema: instanceNameSchema,
          ClassRef: InstanceDto,
          execute: (instance) => instanceController.connectionState(instance),
        });

        return res.status(HttpStatus.OK).json(response);
      })
      .delete(this.routerPath('logout'), ...guards, async (req, res) => {
        const response = await this.dataValidate<InstanceDto>({
          request: req,
          schema: instanceNameSchema,
          ClassRef: InstanceDto,
          execute: (instance) => instanceController.logout(instance),
        });

        return res.status(HttpStatus.OK).json(response);
      });

    if (auth.TYPE === 'jwt') {
      this.router.put('/refreshToken', async (req, res) => {
        const response = await this.dataValidate<OldToken>({
          request: req,
          schema: oldTokenSchema,
          ClassRef: OldToken,
          execute: (_, data) => instanceController.refreshToken(_, data),
        });

        req.session[response.instanceName] = {
          header: 'Authorization',
          hash: response.jwt,
        } as any;

        return res.status(HttpStatus.CREATED).json(response);
      });
    }
  }

  public readonly router = Router();
}
