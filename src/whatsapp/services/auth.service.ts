import { Auth, ConfigService } from '../../config/env.config';
import { InstanceDto } from '../dto/instance.dto';
import { name as apiName } from '../../../package.json';
import { verify, sign } from 'jsonwebtoken';
import { readFileSync, writeFile } from 'fs';
import { join } from 'path';
import { AUTH_DIR } from '../../config/path.config';
import { Logger } from '../../config/logger.config';
import { v4 } from 'uuid';
import { isJWT } from 'class-validator';
import { BadRequestException } from '../../exceptions';

export type JwtPayload = {
  instanceName: string;
  apiName: string;
  jwt?: string;
  apikey?: string;
  tokenId: string;
};

export class OldToken {
  oldToken: string;
}

export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  private readonly logger = new Logger(AuthService.name);

  private jwt(instance: InstanceDto) {
    const jwtOpts = this.configService.get<Auth>('AUTHENTICATION').JWT;
    const token = sign(
      {
        instanceName: instance.instanceName,
        apiName,
        tokenId: v4(),
      },
      jwtOpts.SECRET,
      { expiresIn: jwtOpts.EXPIRIN_IN, encoding: 'utf8', subject: 'g-t' },
    );

    writeFile(
      join(AUTH_DIR, 'jwt', instance.instanceName + '.json'),
      JSON.stringify({ instance: instance.instanceName, jwt: token }),
      (error) => {
        if (error) {
          this.logger.error({
            localError: AuthService.name + '.jwt',
            error,
          });
        }
      },
    );

    return { jwt: token };
  }

  private apikey(instance: InstanceDto) {
    const apikey = v4().toUpperCase();

    writeFile(
      join(AUTH_DIR, 'apikey', instance.instanceName + '.json'),
      JSON.stringify({ instance: instance.instanceName, apikey }),
      (error) => {
        if (error) {
          this.logger.error({
            localError: AuthService.name + '.jwt',
            error,
          });
        }
      },
    );

    return { apikey };
  }

  public generateHash(instance: InstanceDto) {
    const options = this.configService.get<Auth>('AUTHENTICATION');
    return this[options.TYPE](instance) as { jwt: string } | { apikey: string };
  }

  public refreshToken({ oldToken }: OldToken) {
    if (!isJWT(oldToken)) {
      throw new BadRequestException('Invalid "oldToken"');
    }

    try {
      const jwtOpts = this.configService.get<Auth>('AUTHENTICATION').JWT;
      const decode = verify(oldToken, jwtOpts.SECRET, {
        ignoreExpiration: true,
      }) as Pick<JwtPayload, 'apiName' | 'instanceName' | 'tokenId'>;

      const tokenStore = JSON.parse(
        readFileSync(join(AUTH_DIR, 'jwt', decode.instanceName + '.json'), {
          encoding: 'utf-8',
        }),
      ) as Pick<JwtPayload, 'instanceName' | 'jwt'>;

      const decodeTokenStore = verify(tokenStore.jwt, jwtOpts.SECRET, {
        ignoreExpiration: true,
      }) as Pick<JwtPayload, 'apiName' | 'instanceName' | 'tokenId'>;

      if (decode.tokenId !== decodeTokenStore.tokenId) {
        throw new BadRequestException('Invalid "oldToken"');
      }

      const token = {
        jwt: this.jwt({ instanceName: decode.instanceName }).jwt,
        instanceName: decode.instanceName,
      };

      return token;
    } catch (error) {
      this.logger.error({
        localError: AuthService.name + '.refreshToken',
        error,
      });
      throw new BadRequestException('Invalid "oldToken"');
    }
  }
}
