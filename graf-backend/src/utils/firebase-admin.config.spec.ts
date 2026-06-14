jest.unmock('./firebase-admin.config');
import admin from 'firebase-admin';
import { initializeFirebase } from './firebase-admin.config';

const originalEnvFirebase = process.env;

// Define mocks inline to avoid hoisting issues
jest.mock('firebase-admin', () => {
  return {
    apps: [],
    // We mock these as jest.fn() so we can track calls
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn((config) => ({ config })),
    },
  };
});

jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

describe('firebase-admin.config', () => {
  beforeEach(() => {
    process.env = { ...originalEnvFirebase };
    // Reset calls and state
    (admin.apps as any[]) = [];
    (admin.initializeApp as jest.Mock).mockClear();
    (admin.credential.cert as jest.Mock).mockClear();
  });

  afterEach(() => {
    process.env = originalEnvFirebase;
  });

  it('does not initialize when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test';
    process.env.FIREBASE_PROJECT_ID = 'project';
    process.env.FIREBASE_CLIENT_EMAIL = 'client@example.com';
    process.env.FIREBASE_PRIVATE_KEY = 'line1\\nline2';

    initializeFirebase();

    expect(admin.initializeApp).not.toHaveBeenCalled();
  });

  it('initializes when env vars are present and not in test', () => {
    process.env.NODE_ENV = 'development';
    process.env.FIREBASE_PROJECT_ID = 'project';
    process.env.FIREBASE_CLIENT_EMAIL = 'client@example.com';
    process.env.FIREBASE_PRIVATE_KEY = 'line1\\nline2';
    process.env.FIREBASE_DATABASE_URL = 'https://db.example.com';

    initializeFirebase();

    expect(admin.credential.cert).toHaveBeenCalledWith({
      projectId: 'project',
      clientEmail: 'client@example.com',
      privateKey: 'line1\nline2',
    });
    expect(admin.initializeApp).toHaveBeenCalledWith({
      credential: { config: expect.any(Object) },
      databaseURL: 'https://db.example.com',
    });
  });

  it('skips initialize when an app already exists', () => {
    process.env.NODE_ENV = 'development';
    process.env.FIREBASE_PROJECT_ID = 'project';
    process.env.FIREBASE_CLIENT_EMAIL = 'client@example.com';
    process.env.FIREBASE_PRIVATE_KEY = 'line1\\nline2';
    (admin.apps as any[]) = [{}];

    initializeFirebase();

    expect(admin.initializeApp).not.toHaveBeenCalled();
  });

  it('passes undefined privateKey when env key is missing after initial check', () => {
    process.env.NODE_ENV = 'development';
    process.env.FIREBASE_PROJECT_ID = 'project';
    process.env.FIREBASE_CLIENT_EMAIL = 'client@example.com';
    process.env.FIREBASE_DATABASE_URL = 'https://db.example.com';

    let accessCount = 0;
    Object.defineProperty(process.env, 'FIREBASE_PRIVATE_KEY', {
      configurable: true,
      get: () => {
        accessCount += 1;
        return accessCount === 1 ? 'line1\\nline2' : undefined;
      },
    });

    initializeFirebase();

    expect(admin.credential.cert).toHaveBeenCalledWith({
      projectId: 'project',
      clientEmail: 'client@example.com',
      privateKey: undefined,
    });
  });
});
