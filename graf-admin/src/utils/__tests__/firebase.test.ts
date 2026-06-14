import { beforeEach, describe, expect, it, vi } from 'vitest';

const firebaseMocks = vi.hoisted(() => ({
  apps: [] as unknown[],
  initializeApp: vi.fn(),
  app: vi.fn(),
  auth: vi.fn(() => ({ name: 'auth' })),
  firestore: vi.fn(() => ({ name: 'firestore' })),
  storage: vi.fn(() => ({ name: 'storage' })),
}));

vi.mock('firebase/compat/app', () => ({
  default: firebaseMocks,
}));

vi.mock('firebase/compat/auth', () => ({}));
vi.mock('firebase/compat/firestore', () => ({}));
vi.mock('firebase/compat/storage', () => ({}));

const loadFirebaseModule = async () => {
  vi.resetModules();
  return import('../firebase');
};

beforeEach(() => {
  firebaseMocks.apps.length = 0;
  firebaseMocks.initializeApp.mockClear();
  firebaseMocks.app.mockClear();
  firebaseMocks.auth.mockClear();
  firebaseMocks.firestore.mockClear();
  firebaseMocks.storage.mockClear();

  process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'api-key';
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'auth-domain';
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'project-id';
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'storage-bucket';
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'sender-id';
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'app-id';
});

describe('firebase utils', () => {
  it('initializes firebase when no apps exist', async () => {
    const mod = await loadFirebaseModule();

    expect(firebaseMocks.initializeApp).toHaveBeenCalledWith({
      apiKey: 'api-key',
      authDomain: 'auth-domain',
      projectId: 'project-id',
      storageBucket: 'storage-bucket',
      messagingSenderId: 'sender-id',
      appId: 'app-id',
    });
    expect(firebaseMocks.app).not.toHaveBeenCalled();
    expect(mod.auth).toEqual({ name: 'auth' });
    expect(mod.firestore).toEqual({ name: 'firestore' });
    expect(mod.storage).toEqual({ name: 'storage' });
  });

  it('reuses existing firebase app when already initialized', async () => {
    firebaseMocks.apps = [{}];

    await loadFirebaseModule();

    expect(firebaseMocks.initializeApp).not.toHaveBeenCalled();
    expect(firebaseMocks.app).toHaveBeenCalledTimes(1);
  });
});
