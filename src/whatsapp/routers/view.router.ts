import { RequestHandler, Router } from 'express';
import { ConfigService, Production } from '../../config/env.config';
import { RouterBroker } from '../abstract/abstract.router';
import { viewsController } from '../whatsapp.module';

export class ViewsRouter extends RouterBroker {
  constructor(configService: ConfigService, ...guards: RequestHandler[]) {
    super();
    if (!configService.get<Production>('PRODUCTION')) {
      this.router.get(this.routerPath('qrcode'), ...guards, (req, res) => {
        return viewsController.qrcode(req, res);
      });
    }
  }

  public readonly router = Router();
}
