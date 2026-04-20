import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

const dbUrl = process.env.DATABASE_URL || '';
const isLocal = dbUrl.includes('localhost') || dbUrl.includes('db:5432') || dbUrl.includes('127.0.0.1');

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: dbUrl,
  entities: [join(__dirname, '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
  ssl: isLocal ? false : {
    rejectUnauthorized: false,
  },
});
