import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

// Resolver extensión actual (.ts cuando se ejecuta con ts-node, .js en producción)
const ext = path.extname(__filename) || '.ts';
const srcDir = ext === '.ts' ? 'src' : 'dist';

// Permitir ejecutar sólo migraciones sin cargar entidades (evita resolver aliases en CLI)
const migrationsOnly =
  process.env.MIGRATIONS_ONLY === '1' || process.env.MIGRATIONS_ONLY === 'true';

// En dev (ts-node) leemos TS desde carpeta raíz migrations/; en prod leemos JS desde dist/migrations/
const migrationsGlob =
  ext === '.ts' ? 'migrations/*.ts' : 'dist/migrations/*.js';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'totalpedidosv2',
  ssl:
    process.env.DB_HOST &&
    process.env.DB_HOST !== 'localhost' &&
    process.env.DB_HOST !== 'postgres'
      ? { rejectUnauthorized: false }
      : false,
  entities: migrationsOnly ? [] : [`${srcDir}/**/*.entity${ext}`],
  migrations: [migrationsGlob],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  migrationsRun: false,
  logging: true,
});

export default AppDataSource;
