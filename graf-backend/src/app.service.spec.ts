import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { Connection } from 'typeorm';

jest.mock('./utils/firebase-admin.config', () => ({
  __esModule: true,
  default: {
    auth: jest.fn(),
  },
}));

import admin from './utils/firebase-admin.config';

describe('AppService', () => {
  let service: AppService;
  let connection: jest.Mocked<Connection>;

  beforeEach(async () => {
    const mockConnection = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: Connection,
          useValue: mockConnection,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    connection = module.get<Connection, jest.Mocked<Connection>>(Connection);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      const result = service.getHello();
      expect(result).toBe('Hello World!');
    });
  });

  describe('getStatus', () => {
    it('should return status with both services connected', async () => {
      connection.query.mockResolvedValue([{ result: 1 }]);
      (admin.auth as jest.Mock).mockReturnValue({});

      const result = await service.getStatus();

      expect(result).toEqual({
        database: 'Connected',
        firebase: 'Connected',
      });
    });

    it('should return status with database disconnected', async () => {
      connection.query.mockRejectedValue(new Error('Database error'));
      (admin.auth as jest.Mock).mockReturnValue({});

      const result = await service.getStatus();

      expect(result).toEqual({
        database: 'Disconnected',
        firebase: 'Connected',
      });
    });

    it('should return status with firebase disconnected', async () => {
      connection.query.mockResolvedValue([{ result: 1 }]);
      (admin.auth as jest.Mock).mockImplementation(() => {
        throw new Error('Firebase error');
      });

      const result = await service.getStatus();

      expect(result).toEqual({
        database: 'Connected',
        firebase: 'Disconnected',
      });
    });

    it('should return status with both services disconnected', async () => {
      connection.query.mockRejectedValue(new Error('Database error'));
      (admin.auth as jest.Mock).mockImplementation(() => {
        throw new Error('Firebase error');
      });

      const result = await service.getStatus();

      expect(result).toEqual({
        database: 'Disconnected',
        firebase: 'Disconnected',
      });
    });
  });
});
