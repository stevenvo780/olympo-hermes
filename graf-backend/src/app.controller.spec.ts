import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppProvider } from './app.provider';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

describe('AppController', () => {
  let controller: AppController;
  let appService: jest.Mocked<AppService>;
  let appProvider: jest.Mocked<AppProvider>;

  const mockAppService = {
    getHello: jest.fn(),
    getStatus: jest.fn(),
  };

  const mockAppProvider = {
    getApp: jest.fn(),
  };

  const mockDataSource = {
    query: jest.fn(),
    manager: {
      query: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
        {
          provide: AppProvider,
          useValue: mockAppProvider,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    appService = module.get(AppService);
    appProvider = module.get(AppProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHello', () => {
    it('should return a greeting message', () => {
      const expectedMessage = 'Hello World!';
      mockAppService.getHello.mockReturnValue(expectedMessage);

      const result = controller.getHello();

      expect(result).toBe(expectedMessage);
      expect(appService.getHello).toHaveBeenCalledTimes(1);
    });
  });

  describe('getStatus', () => {
    it('should return application status', async () => {
      const expectedStatus = {
        database: 'Connected',
        firebase: 'Connected',
      };
      mockAppService.getStatus.mockResolvedValue(expectedStatus);

      const result = await controller.getStatus();

      expect(result).toEqual(expectedStatus);
      expect(appService.getStatus).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockAppService.getStatus.mockRejectedValue(error);

      await expect(controller.getStatus()).rejects.toThrow('Service error');
      expect(appService.getStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRoutes', () => {
    it('should return routes when server has routes', () => {
      const mockRouter = {
        stack: [
          {
            route: {
              path: '/test',
              methods: { get: true },
            },
          },
          {
            route: {
              path: '/users',
              methods: { post: true },
            },
          },
        ],
      };

      const mockServer = {
        _events: {
          request: {
            _router: mockRouter,
          },
        },
      };

      const mockApp = {
        getHttpServer: jest.fn().mockReturnValue(mockServer),
      } as unknown as INestApplication;

      mockAppProvider.getApp.mockReturnValue(mockApp);

      const result = controller.getRoutes();

      expect(result).toEqual([
        { method: 'GET', path: '/test' },
        { method: 'POST', path: '/users' },
      ]);
      expect(appProvider.getApp).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no routes exist', () => {
      const mockRouter = {
        stack: [{}],
      };

      const mockServer = {
        _events: {
          request: {
            _router: mockRouter,
          },
        },
      };

      const mockApp = {
        getHttpServer: jest.fn().mockReturnValue(mockServer),
      } as unknown as INestApplication;

      mockAppProvider.getApp.mockReturnValue(mockApp);

      const result = controller.getRoutes();

      expect(result).toEqual([]);
      expect(appProvider.getApp).toHaveBeenCalledTimes(1);
    });
  });

  describe('getHealth', () => {
    it('should return health check response', () => {
      const result = controller.getHealth();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.timestamp).toBe('string');
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('getOrderTableStructure', () => {
    it('should return the table structure query result', async () => {
      const rows = [{ column_name: 'id' }];
      mockDataSource.query.mockResolvedValue(rows);

      const result = await controller.getOrderTableStructure();

      expect(result).toBe(rows);
      expect(mockDataSource.query).toHaveBeenCalled();
    });

    it('should return error details when query fails', async () => {
      mockDataSource.query.mockRejectedValue(new Error('query failed'));

      const result = await controller.getOrderTableStructure();

      expect(result).toEqual({ error: 'query failed' });
    });
  });
});
