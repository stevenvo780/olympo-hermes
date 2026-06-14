import { Test, TestingModule } from '@nestjs/testing';
import { FirebaseController } from './firebase.controller';
import admin from '../utils/firebase-admin.config';

jest.mock('../utils/firebase-admin.config', () => ({
  __esModule: true,
  default: {
    app: jest.fn(),
  },
}));

describe('FirebaseController', () => {
  let controller: FirebaseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FirebaseController],
    }).compile();

    controller = module.get<FirebaseController>(FirebaseController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkFirebaseConfig', () => {
    it('should return ok status when firebase is configured correctly', async () => {
      const mockApp = {
        options: {
          projectId: 'test-project',
          credential: { some: 'credential' },
        },
      };

      (admin.app as jest.Mock).mockReturnValue(mockApp);

      const result = await controller.checkFirebaseConfig();

      expect(result).toMatchObject({
        status: 'ok',
        projectId: 'test-project',
        hasCredential: true,
      });
      expect(result.timestamp).toBeDefined();
      expect(admin.app).toHaveBeenCalledTimes(1);
    });

    it('should return ok status with false credential when no credential is provided', async () => {
      const mockApp = {
        options: {
          projectId: 'test-project',
          credential: null,
        },
      };

      (admin.app as jest.Mock).mockReturnValue(mockApp);

      const result = await controller.checkFirebaseConfig();

      expect(result).toMatchObject({
        status: 'ok',
        projectId: 'test-project',
        hasCredential: false,
      });
      expect(result.timestamp).toBeDefined();
    });

    it('should return error status when firebase config fails', async () => {
      (admin.app as jest.Mock).mockImplementation(() => {
        throw new Error('Firebase configuration error');
      });

      const result = await controller.checkFirebaseConfig();

      expect(result).toMatchObject({
        status: 'error',
        error: 'Firebase configuration error',
      });
      expect(result.timestamp).toBeDefined();
    });

    it('should handle undefined options gracefully', async () => {
      (admin.app as jest.Mock).mockImplementation(() => {
        throw new Error('Cannot read properties of undefined');
      });

      const result = await controller.checkFirebaseConfig();

      expect(result).toMatchObject({
        status: 'error',
        error: 'Cannot read properties of undefined',
      });
      expect(result.timestamp).toBeDefined();
    });
  });
});
