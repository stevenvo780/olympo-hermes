const { createConnection } = require('typeorm');

// Registrar tsconfig-paths para resolver aliases
require('tsconfig-paths/register');

// Registrar ts-node para permitir importar archivos TypeScript
require('ts-node').register({
  project: 'tsconfig.json',
  transpileOnly: true
});

async function runMigration() {
  // Configurar variable de entorno para ejecutar solo migraciones
  process.env.MIGRATIONS_ONLY = 'true';
  const { default: AppDataSource } = require('../data-source.ts');

  try {
    console.log('Conectando a la base de datos...');
    await AppDataSource.initialize();
    console.log('✓ Conexión establecida');

    console.log('Ejecutando migraciones...');
    const migrations = await AppDataSource.runMigrations();

    if (migrations.length === 0) {
      console.log('✓ No hay migraciones pendientes');
    } else {
      console.log(`✓ ${migrations.length} migración(es) ejecutada(s):`);
      migrations.forEach(migration => {
        console.log(`  - ${migration.name}`);
      });
    }

  } catch (error) {
    console.error('✗ Error ejecutando migraciones:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log('Conexión cerrada');
  }
}

async function revertMigration() {
  process.env.MIGRATIONS_ONLY = 'true';
  const { default: AppDataSource } = require('../data-source.ts');

  try {
    console.log('Conectando a la base de datos...');
    await AppDataSource.initialize();
    console.log('✓ Conexión establecida');

    console.log('Revirtiendo última migración...');
    await AppDataSource.undoLastMigration();
    console.log('✓ Migración revertida');

  } catch (error) {
    console.error('✗ Error revirtiendo migración:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log('Conexión cerrada');
  }
}

async function generateMigration() {
  process.env.MIGRATIONS_ONLY = 'true';
  const { default: AppDataSource } = require('../data-source.ts');
  const migrationName = process.argv[3] || `Migration${Date.now()}`;

  try {
    console.log('Conectando a la base de datos...');
    await AppDataSource.initialize();
    console.log('✓ Conexión establecida');

    console.log(`Generando migración: ${migrationName}...`);
    // Usar el CLI de TypeORM para generar migraciones
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);

    const command = `npx typeorm-ts-node-commonjs migration:generate migrations/${migrationName} -d data-source.ts`;
    const { stdout, stderr } = await execPromise(command);

    if (stderr) {
      console.error('Stderr:', stderr);
    }
    console.log(stdout);

  } catch (error) {
    console.error('✗ Error generando migración:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log('Conexión cerrada');
  }
}

async function validateMigrations() {
  process.env.MIGRATIONS_ONLY = 'true';
  const { default: AppDataSource } = require('../data-source.ts');

  try {
    console.log('Conectando a la base de datos...');
    await AppDataSource.initialize();
    console.log('✓ Conexión establecida');

    console.log('Validando migraciones...');
    const pendingMigrations = await AppDataSource.showMigrations();

    if (pendingMigrations) {
      console.log('⚠ Hay migraciones pendientes');
      process.exit(1);
    } else {
      console.log('✓ Todas las migraciones están aplicadas');
    }

  } catch (error) {
    console.error('✗ Error validando migraciones:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log('Conexión cerrada');
  }
}

// Procesar argumentos de línea de comandos
const command = process.argv[2];

switch (command) {
  case 'run':
    runMigration();
    break;
  case 'revert':
    revertMigration();
    break;
  case 'generate':
    generateMigration();
    break;
  case 'validate':
    validateMigrations();
    break;
  default:
    console.log('Comandos disponibles:');
    console.log('  run     - Ejecuta migraciones pendientes');
    console.log('  revert  - Revierte la última migración');
    console.log('  generate <nombre> - Genera una nueva migración');
    console.log('  validate - Valida que todas las migraciones estén aplicadas');
    process.exit(1);
}