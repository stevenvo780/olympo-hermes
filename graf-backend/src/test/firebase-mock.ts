import { UserRecord } from 'firebase-admin/auth';

export const mockFirebaseUser: UserRecord = {
  uid: 'firebase-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: true,
  disabled: false,
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
    lastRefreshTime: new Date().toISOString(),
    toJSON: () => ({
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
      lastRefreshTime: new Date().toISOString(),
    }),
  },
  providerData: [],
  customClaims: {},
  passwordHash: undefined,
  passwordSalt: undefined,
  tokensValidAfterTime: undefined,
  tenantId: undefined,
  phoneNumber: undefined,
  multiFactor: undefined,
  toJSON: () => ({
    uid: 'firebase-uid',
    email: 'test@example.com',
    displayName: 'Test User',
  }),
};

export const mockFirebaseAdmin = {
  auth: jest.fn().mockReturnValue({
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: 'firebase-uid',
      email: 'test@example.com',
    }),
    createUser: jest.fn().mockResolvedValue(mockFirebaseUser),
    updateUser: jest.fn().mockResolvedValue(mockFirebaseUser),
    getUser: jest.fn().mockResolvedValue(mockFirebaseUser),
    deleteUser: jest.fn().mockResolvedValue(undefined),
  }),
  firestore: jest.fn(() => ({})),
  storage: jest.fn(() => ({})),
};
