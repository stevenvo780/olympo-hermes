import { Test, TestingModule } from '@nestjs/testing';
import { WompiService } from './wompi.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentSource } from './entities/payment-source.entity';
import { PaymentLinkMapping } from './entities/payment-link.entity';
import { UserService } from '../user/user.service';
import { StoreService } from '../store/store.service';
import { OrderService } from '../order/order.service';
import { createMockRepository } from '../test/test-utils';
import { BadRequestException } from '@nestjs/common';
import axiosWompi from '@/utils/axiosWompiInstance';
import { PlanType } from '../user/entities/subscription.entity';
import * as encryptUtils from '@/utils/encrypt';

jest.mock('@/utils/axiosWompiInstance', () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

describe('WompiService Full', () => {
  let service: WompiService;
  let paymentLinkRepository: any;
  let paymentSourceRepository: any;
  let userService: any;

  const mockEnv = {
    WOMPI_EVENTS_SECRET: 'test_secret',
    WOMPI_STORE_SKU: 'store_creation_sku',
    ENCRYPTION_KEY: 'test_key_32_bytes_long_exact!!!!',
  };

  beforeAll(() => {
    process.env = { ...process.env, ...mockEnv };
  });

  beforeEach(async () => {
    const mockPaymentLinkRepository = createMockRepository();
    const mockPaymentSourceRepository = createMockRepository();

    const mockUserService = {
      findOne: jest.fn(),
      confirmSubscription: jest.fn(),
      cancelUserSubscription: jest.fn(),
    };

    const mockStoreService = {
      createStoreFromPayment: jest.fn(),
    };

    const mockOrderService = {
      updateOrder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WompiService,
        {
          provide: getRepositoryToken(PaymentSource),
          useValue: mockPaymentSourceRepository,
        },
        {
          provide: getRepositoryToken(PaymentLinkMapping),
          useValue: mockPaymentLinkRepository,
        },
        { provide: UserService, useValue: mockUserService },
        { provide: StoreService, useValue: mockStoreService },
        { provide: OrderService, useValue: mockOrderService },
      ],
    }).compile();

    service = module.get<WompiService>(WompiService);
    paymentLinkRepository = module.get(getRepositoryToken(PaymentLinkMapping));
    paymentSourceRepository = module.get(getRepositoryToken(PaymentSource));
    userService = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUniquePaymentLink', () => {
    it('should create link and save mapping', async () => {
      (axiosWompi.post as jest.Mock).mockResolvedValue({
        data: { data: { id: 'link_123' } },
      });
      paymentLinkRepository.save.mockResolvedValue({});

      const result = await service.createUniquePaymentLink({
        name: 'Test',
        description: 'Desc',
        sku: 'SKU1',
        userId: 'user1',
        amountInCents: 1000,
        redirectUrl: 'http://url',
        storeId: 'store1',
      });

      expect(result).toContain('link_123');
      expect(paymentLinkRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequest on API error', async () => {
      (axiosWompi.post as jest.Mock).mockRejectedValue({
        response: {
          data: { error: { type: 'INPUT_VALIDATION', reason: 'Invalid' } },
        },
      });

      await expect(service.createUniquePaymentLink({} as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle API errors without response data', async () => {
      (axiosWompi.post as jest.Mock).mockRejectedValue(new Error('boom'));

      await expect(service.createUniquePaymentLink({} as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancelSubscription', () => {
    it('should deactivate sources and cancel user sub', async () => {
      paymentSourceRepository.find.mockResolvedValue([{ id: 1, active: true }]);
      paymentSourceRepository.save.mockResolvedValue({});
      userService.cancelUserSubscription.mockResolvedValue({});

      await service.cancelSubscription('user1');

      expect(paymentSourceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ active: false }),
      );
      expect(userService.cancelUserSubscription).toHaveBeenCalledWith('user1');
    });
  });

  describe('renewSubscriptions', () => {
    it('should renew expired subscriptions', async () => {
      // Mock encrypt/decrypt manually to ensure stability in test
      jest.spyOn(encryptUtils, 'decrypt').mockReturnValue('123'); // Source ID

      const expiredSource = {
        id: 1,
        sourceId: 'encrypted_123',
        planType: PlanType.BASIC,
        frequency: 'MONTHLY',
        user: { id: 'user1', email: 'test@email.com' },
        active: true,
      };

      paymentSourceRepository.find.mockResolvedValue([expiredSource]);

      (axiosWompi.post as jest.Mock).mockResolvedValue({
        data: { data: { id: 'trans_renew_1' } },
      });

      jest.useFakeTimers();

      const renewPromise = service.renewSubscriptions();

      // Allow async operations (createTransaction) to progress before advancing time
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Fast-forward time to trigger timeout
      jest.advanceTimersByTime(61000);

      await renewPromise;

      expect(axiosWompi.post).toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  describe('processSubscription', () => {
    it('should throw BadRequest if user not found', async () => {
      userService.findOne.mockResolvedValue(null);
      await expect(
        service.processSubscription({ userId: 'u1' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if payment source creation fails', async () => {
      userService.findOne.mockResolvedValue({ id: 'u1' });
      (axiosWompi.post as jest.Mock).mockResolvedValue({
        data: { data: { status: 'ERROR' } },
      });

      await expect(
        service.processSubscription({ userId: 'u1', email: 'e' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should resolve subscription when webhook arrives', async () => {
      userService.findOne.mockResolvedValue({ id: 'u1' });
      (axiosWompi.post as jest.Mock).mockResolvedValue({
        data: { data: { status: 'AVAILABLE', id: 99 } },
      });

      const txId = 'tx-1';
      const createSpy = jest
        .spyOn(service as any, 'createTransaction')
        .mockResolvedValue({
          success: true,
          transaction: { id: txId },
        });

      const promise = service.processSubscription({
        userId: 'u1',
        email: 'u1@test.com',
        planType: PlanType.BASIC,
        frequency: 'ANNUALLY',
        tokenId: 'tok',
        acceptanceToken: 'acc',
        acceptPersonalAuthToken: 'pa',
      } as any);

      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      const pending = (service as any).pendingSubscriptions.get(txId);
      pending.resolve({ id: 'sub-1' });
      clearTimeout(pending.timer);

      await expect(promise).resolves.toEqual({ id: 'sub-1' });
      createSpy.mockRestore();
    });

    it('should reject when webhook timeout expires', async () => {
      jest.useFakeTimers();
      userService.findOne.mockResolvedValue({ id: 'u1' });
      (axiosWompi.post as jest.Mock).mockResolvedValue({
        data: { data: { status: 'AVAILABLE', id: 99 } },
      });
      jest.spyOn(service as any, 'createTransaction').mockResolvedValue({
        success: true,
        transaction: { id: 'tx-timeout' },
      });

      const promise = service.processSubscription({
        userId: 'u1',
        email: 'u1@test.com',
        planType: PlanType.BASIC,
        frequency: 'MONTHLY',
        tokenId: 'tok',
        acceptanceToken: 'acc',
        acceptPersonalAuthToken: 'pa',
      } as any);

      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      jest.advanceTimersByTime((service as any).WEBHOOK_TIMEOUT + 1);

      await expect(promise).rejects.toThrow(BadRequestException);
      expect((service as any).pendingSubscriptions.has('tx-timeout')).toBe(
        false,
      );

      jest.useRealTimers();
    });

    it('should throw when transaction fails', async () => {
      userService.findOne.mockResolvedValue({ id: 'u1' });
      (axiosWompi.post as jest.Mock).mockResolvedValue({
        data: { data: { status: 'AVAILABLE', id: 99 } },
      });
      const createSpy = jest
        .spyOn(service as any, 'createTransaction')
        .mockResolvedValue({
          success: false,
          transaction: null,
          error: { code: 'X', message: 'fail', details: 'd' },
        });

      await expect(
        service.processSubscription({
          userId: 'u1',
          email: 'u1@test.com',
          planType: PlanType.BASIC,
          frequency: 'MONTHLY',
          tokenId: 'tok',
          acceptanceToken: 'acc',
          acceptPersonalAuthToken: 'pa',
        } as any),
      ).rejects.toThrow(BadRequestException);
      createSpy.mockRestore();
    });

    it('should wrap unexpected errors during processing', async () => {
      userService.findOne.mockResolvedValue({ id: 'u1' });
      (axiosWompi.post as jest.Mock).mockResolvedValue({
        data: { data: { status: 'AVAILABLE', id: 99 } },
      });
      const createSpy = jest
        .spyOn(service as any, 'createTransaction')
        .mockRejectedValue(new Error('boom'));

      await expect(
        service.processSubscription({
          userId: 'u1',
          email: 'u1@test.com',
          planType: PlanType.BASIC,
          frequency: 'MONTHLY',
          tokenId: 'tok',
          acceptanceToken: 'acc',
          acceptPersonalAuthToken: 'pa',
        } as any),
      ).rejects.toThrow(BadRequestException);
      createSpy.mockRestore();
    });
  });

  describe('renewSubscriptions', () => {
    it('should skip invalid source ids', async () => {
      const decryptSpy = jest
        .spyOn(encryptUtils, 'decrypt')
        .mockReturnValue('NaN');

      paymentSourceRepository.find.mockResolvedValue([
        {
          id: 1,
          sourceId: 'bad',
          planType: PlanType.BASIC,
          frequency: 'MONTHLY',
          user: { id: 'user1', email: 'a@b.com' },
          active: true,
        },
      ]);

      const result = await service.renewSubscriptions();

      expect(result).toEqual([]);
      decryptSpy.mockRestore();
    });

    it('should skip when plan is missing', async () => {
      const decryptSpy = jest
        .spyOn(encryptUtils, 'decrypt')
        .mockReturnValue('123');

      paymentSourceRepository.find.mockResolvedValue([
        {
          id: 2,
          sourceId: 'encrypted',
          planType: 'UNKNOWN',
          frequency: 'MONTHLY',
          user: { id: 'user2', email: 'a@b.com' },
          active: true,
        },
      ]);

      const result = await service.renewSubscriptions();

      expect(result).toEqual([]);
      decryptSpy.mockRestore();
    });

    it('should push renewal summary on success', async () => {
      const decryptSpy = jest
        .spyOn(encryptUtils, 'decrypt')
        .mockReturnValue('123');

      paymentSourceRepository.find.mockResolvedValue([
        {
          id: 3,
          sourceId: 'encrypted',
          planType: PlanType.BASIC,
          frequency: 'ANNUALLY',
          user: { id: 'user3', email: 'a@b.com' },
          active: true,
        },
      ]);

      jest.spyOn(service as any, 'createTransaction').mockResolvedValue({
        success: true,
        transaction: { id: 'tx-renew' },
      });

      const promise = service.renewSubscriptions();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      const pending = (service as any).pendingSubscriptions.get('tx-renew');
      pending.resolve({});
      clearTimeout(pending.timer);

      const result = await promise;

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(3);
      decryptSpy.mockRestore();
    });
  });

  describe('calculateNextChargeDate', () => {
    it('should advance date annually', () => {
      const date = (service as any).calculateNextChargeDate('ANNUALLY');
      const now = new Date();
      expect(date.getFullYear()).toBe(now.getFullYear() + 1);
    });
  });
});
