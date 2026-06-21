process.env.NODE_ENV = 'test';
process.env.DB_HOST = process.env.TEST_DB_HOST || 'localhost';
process.env.DB_PORT = process.env.TEST_DB_PORT || '5433';
process.env.DB_USERNAME = process.env.TEST_DB_USERNAME || 'test_user';
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'test_password';
process.env.DB_NAME = process.env.TEST_DB_NAME || 'hermes_test_e2e';
process.env.DB_SYNCHRONIZE = 'true';

process.env.FIREBASE_PROJECT_ID = 'hermes-test-project';
process.env.FIREBASE_CLIENT_EMAIL =
  'test@hermes-test-project.iam.gserviceaccount.com';
process.env.FIREBASE_PRIVATE_KEY =
  '-----BEGIN PRIVATE KEY-----\nTEST_KEY\n-----END PRIVATE KEY-----\n';
process.env.WOMPI_PRIVATE_KEY = 'test-wompi-private-key';
process.env.WOMPI_PUBLIC_KEY = 'test-wompi-public-key';
process.env.WOMPI_EVENTS_SECRET = 'test-wompi-events-secret';
process.env.ENCRYPTION_KEY = '12345678901234567890123456789012'; // Exactly 32 chars
process.env.WOMPI_STORE_SKU = 'TEST_STORE_SKU';
process.env.FRONT_URL = 'http://localhost:3000';

jest.setTimeout(60000);

if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: console.warn,
    error: console.error,
  };
}
