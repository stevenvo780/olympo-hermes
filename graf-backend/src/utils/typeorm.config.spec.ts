const originalEnvTypeorm = process.env;

const loadConfig = () => {
  jest.resetModules();
  return require('./typeorm.config').typeOrmConfig;
};

describe('typeOrmConfig', () => {
  beforeEach(() => {
    process.env = { ...originalEnvTypeorm };
  });

  afterEach(() => {
    process.env = originalEnvTypeorm;
    jest.resetModules();
  });

  it('uses default values when env vars are missing', () => {
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_USERNAME;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_NAME;
    delete process.env.DB_SYNCHRONIZE;

    const config = loadConfig();

    expect(config.host).toBe('localhost');
    expect(config.port).toBe(5432);
    expect(config.username).toBe('prizma');
    expect(config.password).toBe('prizma');
    expect(config.database).toBe('prizma-hermes-prod');
    expect(config.synchronize).toBe(false);
    expect(config.ssl).toBe(false);
  });

  it('uses env vars and enables ssl for non-local hosts', () => {
    process.env.DB_HOST = 'db.remote';
    process.env.DB_PORT = '5439';
    process.env.DB_USERNAME = 'custom-user';
    process.env.DB_PASSWORD = 'custom-pass';
    process.env.DB_NAME = 'custom-db';
    process.env.DB_SYNCHRONIZE = 'true';

    const config = loadConfig();

    expect(config.host).toBe('db.remote');
    expect(config.port).toBe(5439);
    expect(config.username).toBe('custom-user');
    expect(config.password).toBe('custom-pass');
    expect(config.database).toBe('custom-db');
    expect(config.synchronize).toBe(true);
    expect(config.ssl).toEqual({ rejectUnauthorized: false });
  });
});
