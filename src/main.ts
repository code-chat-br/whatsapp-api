import compression from 'compression';
import {
  configService,
  Cors,
  Production,
  HttpServer,
  ExpressSession,
  SslConf,
} from './config/env.config';
import cors from 'cors';
import express, {
  Express,
  json,
  NextFunction,
  Request,
  Response,
  urlencoded,
} from 'express';
import { join } from 'path';
import session from 'express-session';
import * as https from 'https';
import * as http from 'http';
import { onUnexpectedError } from './config/error.config';
import { Logger } from './config/logger.config';
import { ROOT_DIR } from './config/path.config';
import { waMonitor } from './whatsapp/whatsapp.module';
import { HttpStatus, router } from './whatsapp/routers/index.router';
import 'express-async-errors';
import { readFileSync } from 'fs';

const serverUp = {
  https(app: Express) {
    const { FULLCHAIN, PRIVKEY } = configService.get<SslConf>('SSL_CONF');
    return https.createServer(
      {
        cert: readFileSync(FULLCHAIN),
        key: readFileSync(PRIVKEY),
      },
      app,
    );
  },

  http(app: Express) {
    return http.createServer(app);
  },
};

function initWA() {
  waMonitor.loadInstance();
}

export function bootstrap() {
  initWA();

  const logger = new Logger('SERVER');
  const app = express();

  app.use(
    cors({
      origin(requestOrigin, callback) {
        const { ORIGIN } = configService.get<Cors>('CORS');
        !requestOrigin ? (requestOrigin = '*') : undefined;
        if (ORIGIN.indexOf(requestOrigin) !== -1) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      methods: [...configService.get<Cors>('CORS').METHODS],
      credentials: configService.get<Cors>('CORS').CREDENTIALS,
    }),
    urlencoded({ extended: true, limit: '50mb' }),
    json({ limit: '50mb' }),
    compression(),
  );

  if (!configService.get<Production>('PRODUCTION')) {
    app.set('view engine', 'hbs');
    app.set('views', join(ROOT_DIR, 'views'));
    app.use(express.static(join(ROOT_DIR, 'public')));
  }

  app.use('/', router);

  app.use(
    (err: Error, req: Request, res: Response, next: NextFunction) => {
      if (err) {
        return res.status(err['status'] || 500).json(err);
      }
    },
    (req: Request, res: Response, next: NextFunction) => {
      const { method, url } = req;

      res.status(HttpStatus.NOT_FOUND).json({
        status: HttpStatus.NOT_FOUND,
        message: `Cannot ${method.toUpperCase()} ${url}`,
        error: 'Not Found',
      });

      next();
    },
  );

  const httpServer = configService.get<HttpServer>('SERVER');

  const server = serverUp[httpServer.TYPE](app);

  server.listen(httpServer.PORT, () =>
    logger.log(httpServer.TYPE.toUpperCase() + ' - ON: ' + httpServer.PORT),
  );

  onUnexpectedError();
}
