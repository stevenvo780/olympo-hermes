process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USERNAME = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_NAME = 'test_db';
process.env.DB_SYNCHRONIZE = 'true';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test.com';
process.env.FIREBASE_PRIVATE_KEY = 'test-key';
process.env.WOMPI_PRIVATE_KEY = 'test-wompi-key';
process.env.WOMPI_PUBLIC_KEY = 'test-wompi-public-key';
process.env.WOMPI_EVENTS_SECRET = 'test-events-secret';
process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';
process.env.WOMPI_STORE_SKU = 'TEST_STORE_SKU';

jest.setTimeout(30000);

const mockFirebaseAuth = {
  verifyIdToken: jest.fn().mockResolvedValue({
    uid: 'firebase-uid',
    email: 'test@example.com',
    name: 'Test User',
  }),
  createUser: jest.fn().mockResolvedValue({
    uid: 'firebase-uid',
    email: 'test@example.com',
  }),
  updateUser: jest.fn().mockResolvedValue({
    uid: 'firebase-uid',
    email: 'test@example.com',
  }),
  getUser: jest.fn().mockResolvedValue({
    uid: 'firebase-uid',
    email: 'test@example.com',
  }),
  deleteUser: jest.fn().mockResolvedValue(undefined),
};

jest.mock('../utils/firebase-admin.config', () => ({
  default: {
    auth: jest.fn().mockReturnValue(mockFirebaseAuth),
    apps: [],
    credential: {
      cert: jest.fn(),
    },
    initializeApp: jest.fn(),
  },
}));

jest.mock('@/utils/firebase-admin.config', () => ({
  default: {
    auth: jest.fn().mockReturnValue(mockFirebaseAuth),
    apps: [],
    credential: {
      cert: jest.fn(),
    },
    initializeApp: jest.fn(),
  },
}));

type MockFirebaseAuth = typeof mockFirebaseAuth;

(global as unknown as { mockFirebaseAuth: MockFirebaseAuth }).mockFirebaseAuth =
  mockFirebaseAuth;

global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

jest.mock('../utils/axiosWompiInstance', () => ({
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));
