import { Express } from 'express';
import { readFileSync } from 'fs';
import { configService, SslConf } from '../config/env.config';
import * as https from 'https';
import * as http from 'http';

export class ServerUP {
  static #app: Express;

  static set app(e: Express) {
    this.#app = e;
  }

  static https() {
    const { FULLCHAIN, PRIVKEY } = configService.get<SslConf>('SSL_CONF');
    return https.createServer(
      {
        cert: readFileSync(FULLCHAIN),
        key: readFileSync(PRIVKEY),
      },
      ServerUP.#app,
    );
  }

  static http() {
    return http.createServer(ServerUP.#app);
  }
}
