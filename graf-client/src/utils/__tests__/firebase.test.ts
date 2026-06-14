/* @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';

// We need to mock firebase before importing it
const mockInitializeApp = vi.fn();
const mockApp = vi.fn();
const mockAuth = vi.fn();
const mockFirestore = vi.fn();
const mockStorage = vi.fn();

vi.mock('firebase/compat/app', () => ({
  default: {
    apps: [], // Empty array initially
    initializeApp: (...args: unknown[]) => mockInitializeApp(...args),
    app: () => mockApp(),
    auth: () => mockAuth(),
    firestore: () => mockFirestore(),
    storage: () => mockStorage()
  }
}));

vi.mock('firebase/compat/auth', () => ({}));
vi.mock('firebase/compat/firestore', () => ({}));
vi.mock('firebase/compat/storage', () => ({}));

describe('firebase setup', () => {
  it('initializes app if no apps exist', async () => {
    // Reset modules to trigger execution
    vi.resetModules();
    await import('../firebase');

    expect(mockInitializeApp).toHaveBeenCalled();
    expect(mockApp).not.toHaveBeenCalled();
  });

  it('uses existing app if apps exist', async () => {
    vi.resetModules();
    vi.doMock('firebase/compat/app', () => ({
      default: {
        apps: ['existing-app'],
        initializeApp: mockInitializeApp,
        app: mockApp,
        auth: mockAuth,
        firestore: mockFirestore,
        storage: mockStorage
      }
    }));

    await import('../firebase');

    // In this case initializeApp should NOT be called, but app() might be called? 
    // Code:
    // if (!firebase.apps.length) initializeApp else app()
    expect(mockApp).toHaveBeenCalled();
    // mockInitializeApp is from previous mock definition? No, I defined new mock.
    // Wait, mockInitializeApp variable is same reference.
    // But in doMock I passed it.
  });
});
