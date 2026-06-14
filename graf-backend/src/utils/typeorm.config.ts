import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'totalpedidosv2',
  autoLoadEntities: true,
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  ssl:
    process.env.DB_HOST &&
    process.env.DB_HOST !== 'localhost' &&
    process.env.DB_HOST !== 'postgres' &&
    process.env.DB_HOST !== 'graf-postgres' &&
    process.env.DB_SSL !== 'false'
      ? { rejectUnauthorized: false }
      : false,
  migrations: [],
  migrationsRun: false,
  migrationsTableName: 'typeorm_migrations',
  retryAttempts: 3,
  retryDelay: 3000,
};
