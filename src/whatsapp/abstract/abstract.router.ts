import { InstanceDto } from '../dto/instance.dto';
import { JSONSchema7 } from 'json-schema';
import { Request } from 'express';
import { validate } from 'jsonschema';
import { BadRequestException } from '../../exceptions';
import 'express-async-errors';
import { Logger } from '../../config/logger.config';
import { GroupJid } from '../dto/group.dto';

type DataValidate<T> = {
  request: Request;
  schema: JSONSchema7;
  ClassRef: any;
  execute: (instance: InstanceDto, data: T) => Promise<any>;
};

const logger = new Logger('Validate');

export abstract class RouterBroker {
  constructor() {}
  public routerPath(path: string) {
    return '/' + path + '/:instanceName';
  }

  public async dataValidate<T>(args: DataValidate<T>) {
    const { request, schema, ClassRef, execute } = args;

    const ref = new ClassRef();
    const body = request.body;
    const instance = request.params as unknown as InstanceDto;

    if (Object.keys(instance).length === 0) {
      Object.assign(instance, body);
      Object.assign(ref, instance);
    } else {
      Object.assign(ref, body);
    }

    const v = validate(ref, schema);

    logger.error(!v.valid ? v.errors : [null]);

    if (!v.valid) {
      const message: any[] = v.errors.map(({ property, stack, schema }) => {
        let message: string;
        if (schema['description']) {
          message = schema['description'];
        } else {
          message = stack.replace('instance.', '');
        }
        return {
          property: property.replace('instance.', ''),
          message,
        };
      });
      throw new BadRequestException(...message);
    }

    return await execute(instance, ref);
  }

  public async groupValidate<T>(args: DataValidate<T>) {
    const { request, ClassRef, schema, execute } = args;

    const instance = request.params as unknown as InstanceDto;
    const groupJid = request.query as unknown as GroupJid;
    const body = request.body;

    const ref = new ClassRef();

    Object.assign(body, groupJid);
    Object.assign(ref, body);

    const v = validate(ref, schema);

    logger.error(!v.valid ? v.errors : [null]);

    if (!v.valid) {
      const message: any[] = v.errors.map(({ property, stack, schema }) => {
        let message: string;
        if (schema['description']) {
          message = schema['description'];
        } else {
          message = stack.replace('instance.', '');
        }
        return {
          property: property.replace('instance.', ''),
          message,
        };
      });
      throw new BadRequestException(...message);
    }

    return await execute(instance, ref);
  }
}
