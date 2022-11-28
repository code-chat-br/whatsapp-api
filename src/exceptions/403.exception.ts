import { HttpStatus } from '../whatsapp/routers/index.router';

export class ForbidenException {
  constructor(...objectError: any[]) {
    throw {
      status: HttpStatus.FORBIDDEN,
      error: 'Forbiden',
      message: objectError.length > 0 ? objectError : undefined,
    };
  }
}
