import { Test, TestingModule } from '@nestjs/testing';
import { WompiController } from './wompi.controller';
import { WompiService } from './wompi.service';
import { StoreService } from '@/store/store.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentLinkMapping } from './entities/payment-link.entity';
import { GiftCoupon } from '@/gift-coupon/entities/gift-coupon.entity';
import { BadRequestException, RequestTimeoutException } from '@nestjs/common';
import { createMockRepository, createTestUser } from '../test/test-utils';

import { User } from '../user/entities/user.entity';

describe('WompiController', () => {
  let controller: WompiController;
  let wompiService: any;
  let storeService: any;
  let giftCouponRepository: any;

  beforeEach(async () => {
    const mockWompiService = {
      createUniquePaymentLink: jest.fn(),
      processSubscription: jest.fn(),
      cancelSubscription: jest.fn(),
      renewSubscriptions: jest.fn(),
      handleWebhookEvent: jest.fn(),
    };

    const mockStoreService = {
      createStoreFromPayment: jest.fn(),
    };

    const mockGiftCouponRepository = createMockRepository();
    const mockPaymentLinkRepository = createMockRepository();
    const mockUserRepository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WompiController],
      providers: [
        { provide: WompiService, useValue: mockWompiService },
        { provide: StoreService, useValue: mockStoreService },
        {
          provide: getRepositoryToken(PaymentLinkMapping),
          useValue: mockPaymentLinkRepository,
        },
        {
          provide: getRepositoryToken(GiftCoupon),
          useValue: mockGiftCouponRepository,
        },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
      ],
    }).compile();

    controller = module.get<WompiController>(WompiController);
    wompiService = module.get<WompiService>(WompiService);
    storeService = module.get<StoreService>(StoreService);
    giftCouponRepository = module.get(getRepositoryToken(GiftCoupon));
  });

  describe('createStorePaymentLink', () => {
    it('should create a payment link successfully', async () => {
      const user = createTestUser();
      const req = { user } as any;
      const body = { storeId: 'store-1' };
      const expectedLink = 'https://checkout.wompi.co/l/link-1';

      wompiService.createUniquePaymentLink.mockResolvedValue(expectedLink);

      const result = await controller.createStorePaymentLink(req, body);

      expect(result).toBe(expectedLink);
      expect(wompiService.createUniquePaymentLink).toHaveBeenCalledWith(
        expect.objectContaining({
          storeId: 'store-1',
          userId: user.id,
        }),
      );
    });

    it('should redeem coupon if provided', async () => {
      const user = createTestUser();
      const req = { user } as any;
      const body = { storeId: 'store-1', couponCode: 'DISCOUNT100' };
      const coupon = { id: 1, code: 'DISCOUNT100', used: false };

      giftCouponRepository.findOne.mockResolvedValue(coupon);
      giftCouponRepository.save.mockResolvedValue({ ...coupon, used: true });

      const result = await controller.createStorePaymentLink(req, body);

      expect(storeService.createStoreFromPayment).toHaveBeenCalledWith(
        'store-1',
        user,
      );
      expect(giftCouponRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ used: true }),
      );
      expect(result).toEqual({
        message: 'Tienda creada con cupón',
        storeId: 'store-1',
      });
    });

    it('should throw BadRequestException if coupon is invalid', async () => {
      const user = createTestUser();
      const req = { user } as any;
      const body = { storeId: 'store-1', couponCode: 'INVALID' };

      giftCouponRepository.findOne.mockResolvedValue(null);

      await expect(
        controller.createStorePaymentLink(req, body),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if storeId is missing', async () => {
      const user = createTestUser();
      const req = { user } as any;
      const body = { storeId: '' };

      await expect(
        controller.createStorePaymentLink(req, body as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should wrap unexpected errors when creating payment link', async () => {
      const user = createTestUser();
      const req = { user } as any;
      const body = { storeId: 'store-1' };

      wompiService.createUniquePaymentLink.mockRejectedValue(new Error('fail'));

      await expect(
        controller.createStorePaymentLink(req, body),
      ).rejects.toThrow(BadRequestException);
    });

    it('should rethrow BadRequestException from service', async () => {
      const user = createTestUser();
      const req = { user } as any;
      const body = { storeId: 'store-1' };

      wompiService.createUniquePaymentLink.mockRejectedValue(
        new BadRequestException('bad'),
      );

      await expect(
        controller.createStorePaymentLink(req, body),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use default store SKU when env var is missing', async () => {
      const user = createTestUser();
      const req = { user } as any;
      const body = { storeId: 'store-1' };
      const expectedLink = 'https://checkout.wompi.co/l/link-2';

      const previousSku = process.env.WOMPI_STORE_SKU;
      delete process.env.WOMPI_STORE_SKU;

      wompiService.createUniquePaymentLink.mockResolvedValue(expectedLink);

      await controller.createStorePaymentLink(req, body);

      expect(wompiService.createUniquePaymentLink).toHaveBeenCalledWith(
        expect.objectContaining({
          sku: 'DEFAULT_STORE_SKU',
        }),
      );

      process.env.WOMPI_STORE_SKU = previousSku;
    });
  });

  describe('subscribe', () => {
    it('should process subscription', async () => {
      const user = createTestUser();
      const req = { user } as any;
      const body = { tokenId: 'tok_test', email: 'test@test.com' } as any;
      const resultSub = { id: 'sub_1' };

      wompiService.processSubscription.mockResolvedValue(resultSub);

      const result = await controller.subscribe(req, body);

      expect(result).toEqual({
        success: true,
        subscription: resultSub,
        message: 'Suscripción confirmada correctamente',
      });
    });

    it('should rethrow BadRequestException from service', async () => {
      const user = createTestUser();
      const req = { user } as any;
      const body = { tokenId: 'tok_test', email: 'test@test.com' } as any;

      wompiService.processSubscription.mockRejectedValue(
        new BadRequestException('invalid'),
      );

      await expect(controller.subscribe(req, body)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should wrap unexpected errors from service', async () => {
      const user = createTestUser();
      const req = { user } as any;
      const body = { tokenId: 'tok_test', email: 'test@test.com' } as any;

      wompiService.processSubscription.mockRejectedValue(new Error('fail'));

      await expect(controller.subscribe(req, body)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should rethrow RequestTimeoutException from service', async () => {
      const user = createTestUser();
      const req = { user } as any;
      const body = { tokenId: 'tok_test', email: 'test@test.com' } as any;

      wompiService.processSubscription.mockRejectedValue(
        new RequestTimeoutException('timeout'),
      );

      await expect(controller.subscribe(req, body)).rejects.toThrow(
        RequestTimeoutException,
      );
    });

    it('should use fallback details when error has no message', async () => {
      const user = createTestUser();
      const req = { user } as any;
      const body = { tokenId: 'tok_test', email: 'test@test.com' } as any;

      wompiService.processSubscription.mockRejectedValue({ message: '' });

      try {
        await controller.subscribe(req, body);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse() as any;
        expect(response.details).toBe('Error desconocido');
      }
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription', async () => {
      const user = createTestUser();
      const req = { user } as any;

      wompiService.cancelSubscription.mockResolvedValue({ ok: true });

      const result = await controller.cancelSubscription(req);

      expect(result).toEqual({ ok: true });
      expect(wompiService.cancelSubscription).toHaveBeenCalledWith(user.id);
    });
  });

  describe('renewSubscriptions', () => {
    it('should reject invalid access key', async () => {
      await expect(controller.renewSubscriptions('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should wrap errors from renewSubscriptions', async () => {
      process.env.RENEWAL_ACCESS_KEY = 'secret';
      wompiService.renewSubscriptions.mockRejectedValue(new Error('fail'));

      await expect(controller.renewSubscriptions('secret')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('handleWebhook', () => {
    it('should process webhook event', async () => {
      const payload = { event: 'test' };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const summary = { storePurchases: 1 };

      wompiService.handleWebhookEvent.mockResolvedValue(summary);

      await controller.handleWebhook({ body: payload } as any, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          summary,
        }),
      );
    });

    it('should handle webhook errors', async () => {
      const payload = { event: 'test' };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      wompiService.handleWebhookEvent.mockRejectedValue(new Error('fail'));

      await controller.handleWebhook({ body: payload } as any, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error procesando webhook',
        }),
      );
    });
  });
});
