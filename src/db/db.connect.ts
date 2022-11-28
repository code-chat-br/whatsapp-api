import mongoose from 'mongoose';
import { configService, Database } from '../config/env.config';
import { Logger } from '../config/logger.config';

const logger = new Logger('Db Connection');

const db = configService.get<Database>('DATABASE');

export const dbserver = db.ENABLED
  ? mongoose.createConnection(
      `mongodb://${db.CONNECTION.HOST}:${db.CONNECTION.PORT}?authSource=admin&directConnection=true`,
      {
        user: db.CONNECTION.USER,
        pass: db.CONNECTION.PASSWORD,
        dbName: db.CONNECTION.DB_PREFIX_NAME + '-whatsapp-api',
      },
    )
  : null;

export const mongoClient = dbserver?.getClient();

db.ENABLED ? logger.info('ON - dbName: ' + dbserver['$dbName']) : null;
