"use strict";
// One-shot script: synchronize schema then run migrations (to mark them applied)
const { DataSource } = require('typeorm');
const path = require('path');
const fs = require('fs');

const host = process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.DB_PORT || '5432');
const username = process.env.DB_USERNAME || 'prizma';
const password = process.env.DB_PASSWORD || 'prizma';
const database = process.env.DB_NAME || 'hermes';
const sslEnabled = process.env.DB_SSL !== 'false' && host !== 'localhost' && host !== 'postgres';

console.log(`Connecting to ${host}:${port}/${database} as ${username} (ssl=${sslEnabled})`);

// Collect all compiled entity files from dist
function findEntities(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(findEntities(full));
    } else if (item.endsWith('.entity.js')) {
      results.push(full);
    }
  }
  return results;
}

const distDir = path.join(__dirname, 'dist');
const entityFiles = findEntities(distDir);
console.log(`Found ${entityFiles.length} entity files`);

// Load entity classes
const entities = [];
for (const file of entityFiles) {
  try {
    const mod = require(file);
    for (const key of Object.keys(mod)) {
      if (typeof mod[key] === 'function') {
        entities.push(mod[key]);
      }
    }
  } catch (e) {
    console.warn(`  Warning: could not load ${file}: ${e.message}`);
  }
}
console.log(`Loaded ${entities.length} entity classes`);

// Load migration files from dist/migrations
function findMigrations(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const items = fs.readdirSync(dir).sort();
  for (const item of items) {
    if (item.endsWith('.js')) {
      results.push(path.join(dir, item));
    }
  }
  return results;
}

const migrationFiles = findMigrations(path.join(distDir, 'migrations'));
console.log(`Found ${migrationFiles.length} compiled migration files`);

const migrationClasses = [];
for (const file of migrationFiles) {
  try {
    const mod = require(file);
    for (const key of Object.keys(mod)) {
      if (typeof mod[key] === 'function') {
        migrationClasses.push(mod[key]);
      }
    }
  } catch (e) {
    console.warn(`  Warning: could not load migration ${file}: ${e.message}`);
  }
}

async function main() {
  // Step 1: Synchronize schema (create all tables)
  const syncDs = new DataSource({
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    entities,
    synchronize: true,
    migrationsRun: false,
    migrations: [],
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    logging: false,
  });

  console.log('\n--- Step 1: Synchronize schema ---');
  await syncDs.initialize();
  console.log('Schema synchronized successfully');
  await syncDs.destroy();

  // Step 2: Mark all existing dist migrations as applied (so migration:run won't re-run them)
  // and run the new source migrations (from migrations/*.ts compiled inline)
  const migrateDs = new DataSource({
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    entities,
    synchronize: false,
    migrations: migrationClasses,
    migrationsTableName: 'typeorm_migrations',
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    logging: false,
  });

  console.log('\n--- Step 2: Initialize migrations table ---');
  await migrateDs.initialize();

  // Run migrations (the dist ones include the safe no-op InitialMigration and others)
  // Since schema is fresh, most migrations that alter existing structures will fail
  // We just want to mark the base dist ones as applied
  try {
    const applied = await migrateDs.runMigrations({ transaction: 'each' });
    console.log(`Applied ${applied.length} migration(s)`);
    applied.forEach(m => console.log(`  + ${m.name}`));
  } catch (err) {
    console.warn('Migration run warning (expected for alter-on-fresh-schema):', err.message);
  }
  await migrateDs.destroy();

  // Step 3: Count tables
  const checkDs = new DataSource({
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    entities: [],
    synchronize: false,
    migrations: [],
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    logging: false,
  });
  await checkDs.initialize();
  const result = await checkDs.query(
    "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'"
  );
  const tableCount = parseInt(result[0].count);
  console.log(`\n--- Result: ${tableCount} tables in public schema ---`);
  await checkDs.destroy();

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
