import { NextFunction, Request, Response } from 'express';
import { HttpStatus } from '../app.module';

export class ErrorMiddle {
  public static pageNotFound(req: Request, res: Response, next: NextFunction) {
    const { method, url } = req;

    res.status(HttpStatus.NOT_FOUND).json({
      status: HttpStatus.NOT_FOUND,
      message: `Cannot ${method.toUpperCase()} ${url}`,
      error: 'Not Found',
    });

    next();
  }

  public static appError(err: Error, _: Request, res: Response, __: NextFunction) {
    if (err) {
      return res.status(err['status'] || 500).json(err);
    }
  }
}
