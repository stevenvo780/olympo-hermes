import { Test, TestingModule } from '@nestjs/testing';
import { WompiService } from './wompi.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentSource } from './entities/payment-source.entity';
import { PaymentLinkMapping } from './entities/payment-link.entity';
import { UserService } from '../user/user.service';
import { StoreService } from '../store/store.service';
import { OrderService } from '../order/order.service';
import { createMockRepository } from '../test/test-utils';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

jest.mock('@/utils/axiosWompiInstance', () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

describe('WompiService', () => {
  let service: WompiService;
  let paymentLinkRepository: any;
  let storeService: any;
  let orderService: any;
  let userService: any;
  let paymentSourceRepository: any;

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
    storeService = module.get(StoreService);
    orderService = module.get(OrderService);
    userService = module.get(UserService);
    paymentSourceRepository = module.get(getRepositoryToken(PaymentSource));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /** Generates a valid signature for webhook payloads. */
  const generateSignature = (data: any, timestamp: number) => {
    const concat = `${data.transaction.id}${data.transaction.status}${data.transaction.amount_in_cents}${timestamp}${mockEnv.WOMPI_EVENTS_SECRET}`;
    return crypto
      .createHash('sha256')
      .update(concat)
      .digest('hex')
      .toUpperCase();
  };

  describe('handleWebhookEvent', () => {
    it('should handle APPROVED transaction for Store Creation', async () => {
      const timestamp = Date.now();
      const transactionData = {
        id: 'trans_123',
        status: 'APPROVED',
        amount_in_cents: 100000,
        payment_link_id: 'link_123',
      };

      const payload: any = {
        event: 'transaction.updated',
        data: { transaction: transactionData },
        timestamp: timestamp,
        signature: {
          properties: [
            'transaction.id',
            'transaction.status',
            'transaction.amount_in_cents',
          ],
          checksum: generateSignature(
            { transaction: transactionData },
            timestamp,
          ),
        },
      };

      const mapping = {
        sku: mockEnv.WOMPI_STORE_SKU,
        storeId: 'store_1',
        user: { id: 'user_1' },
      };

      paymentLinkRepository.findOne.mockResolvedValue(mapping);

      await service.handleWebhookEvent(payload);

      expect(storeService.createStoreFromPayment).toHaveBeenCalledWith(
        'store_1',
        mapping.user,
      );
    });

    it('should handle APPROVED transaction for Order Payment', async () => {
      const timestamp = Date.now();
      const transactionData = {
        id: 'trans_456',
        status: 'APPROVED',
        amount_in_cents: 5000,
        payment_link_id: 'link_456',
      };

      const payload: any = {
        event: 'transaction.updated',
        data: { transaction: transactionData },
        timestamp: timestamp,
        signature: {
          properties: [
            'transaction.id',
            'transaction.status',
            'transaction.amount_in_cents',
          ],
          checksum: generateSignature(
            { transaction: transactionData },
            timestamp,
          ),
        },
      };

      const mapping = {
        sku: 'order_99',
        user: { id: 'user_1' },
      };

      paymentLinkRepository.findOne.mockResolvedValue(mapping);

      await service.handleWebhookEvent(payload);

      expect(orderService.updateOrder).toHaveBeenCalledWith(
        99,
        { status: 'paid' },
        mapping.user,
      );
    });

    it('should swallow errors when updating order fails', async () => {
      const timestamp = Date.now();
      const transactionData = {
        id: 'trans_789',
        status: 'APPROVED',
        amount_in_cents: 5000,
        payment_link_id: 'link_789',
      };

      const payload: any = {
        event: 'transaction.updated',
        data: { transaction: transactionData },
        timestamp,
        signature: {
          properties: [
            'transaction.id',
            'transaction.status',
            'transaction.amount_in_cents',
          ],
          checksum: generateSignature(
            { transaction: transactionData },
            timestamp,
          ),
        },
      };

      const mapping = {
        sku: 'order_1',
        user: { id: 'user_1' },
      };
      paymentLinkRepository.findOne.mockResolvedValue(mapping);
      orderService.updateOrder.mockRejectedValue(new Error('fail'));

      await expect(service.handleWebhookEvent(payload)).resolves.toBeDefined();
    });

    it('should reject pending subscription when transaction is declined', async () => {
      const transactionId = 'trans_declined';
      const rejectMock = jest.fn();
      (service as any).pendingSubscriptions.set(transactionId, {
        resolve: jest.fn(),
        reject: rejectMock,
        timer: setTimeout(() => {}, 1000),
      });

      const timestamp = Date.now();
      const transactionData = {
        id: transactionId,
        status: 'DECLINED',
        amount_in_cents: 1000,
        status_message: 'Declined',
      };

      const payload: any = {
        event: 'transaction.updated',
        data: { transaction: transactionData },
        timestamp,
        signature: {
          properties: [
            'transaction.id',
            'transaction.status',
            'transaction.amount_in_cents',
          ],
          checksum: generateSignature(
            { transaction: transactionData },
            timestamp,
          ),
        },
      };

      await service.handleWebhookEvent(payload);

      expect(rejectMock).toHaveBeenCalledWith(expect.any(BadRequestException));
      expect((service as any).pendingSubscriptions.has(transactionId)).toBe(
        false,
      );
    });

    it('should throw UnauthorizedException if signature is invalid', async () => {
      const payload: any = {
        event: 'transaction.updated',
        data: { transaction: { id: '1' } },
        timestamp: 123456,
        signature: {
          properties: ['transaction.id'],
          checksum: 'INVALID_CHECKSUM',
        },
      };

      await expect(service.handleWebhookEvent(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should process Pending Subscription when APPROVED', async () => {
      const transactionId = 'trans_sub_1';
      const resolveMock = jest.fn();
      (service as any).pendingSubscriptions.set(transactionId, {
        resolve: resolveMock,
        timer: setTimeout(() => {}, 1000),
      });

      const timestamp = Date.now();
      const transactionData = {
        id: transactionId,
        status: 'APPROVED',
        amount_in_cents: 20000,
        payment_method: {
          payment_description: JSON.stringify({
            userId: 'user_1',
            planType: 'PRO',
            frequency: 'MONTHLY',
            sourceId: 555,
          }),
        },
      };

      const payload: any = {
        event: 'transaction.updated',
        data: { transaction: transactionData },
        timestamp: timestamp,
        signature: {
          properties: [
            'transaction.id',
            'transaction.status',
            'transaction.amount_in_cents',
          ],
          checksum: generateSignature(
            { transaction: transactionData },
            timestamp,
          ),
        },
      };

      userService.findOne.mockResolvedValue({ id: 'user_1' });
      paymentSourceRepository.findOne.mockResolvedValue(null); // New source
      paymentSourceRepository.save.mockResolvedValue({});
      userService.confirmSubscription.mockResolvedValue({ id: 'sub_1' });

      await service.handleWebhookEvent(payload);

      expect(resolveMock).toHaveBeenCalledWith({ id: 'sub_1' });
      expect(
        (service as any).pendingSubscriptions.has(transactionId),
      ).toBeFalsy();
    });

    it('should reject Pending Subscription when DECLINED', async () => {
      const transactionId = 'trans_sub_fail';
      const rejectMock = jest.fn();
      (service as any).pendingSubscriptions.set(transactionId, {
        reject: rejectMock,
        timer: setTimeout(() => {}, 1000),
      });

      const timestamp = Date.now();
      const transactionData = {
        id: transactionId,
        status: 'DECLINED',
        amount_in_cents: 20000,
        status_message: 'Insufficient funds',
        payment_method: { payment_description: '{}' },
      };

      const payload: any = {
        event: 'transaction.updated',
        data: { transaction: transactionData },
        timestamp: timestamp,
        signature: {
          properties: [
            'transaction.id',
            'transaction.status',
            'transaction.amount_in_cents',
          ],
          checksum: generateSignature(
            { transaction: transactionData },
            timestamp,
          ),
        },
      };

      await service.handleWebhookEvent(payload);

      expect(rejectMock).toHaveBeenCalledWith(expect.any(BadRequestException));
      expect(
        (service as any).pendingSubscriptions.has(transactionId),
      ).toBeFalsy();
    });

    it.each(['ERROR', 'VOIDED'])(
      'should reject Pending Subscription when status is %s',
      async (status) => {
        const transactionId = `trans_sub_${status.toLowerCase()}`;
        const rejectMock = jest.fn();
        (service as any).pendingSubscriptions.set(transactionId, {
          reject: rejectMock,
          timer: setTimeout(() => {}, 1000),
        });

        const timestamp = Date.now();
        const transactionData = {
          id: transactionId,
          status,
          amount_in_cents: 20000,
          status_message: 'Failure',
        };

        const payload: any = {
          event: 'transaction.updated',
          data: { transaction: transactionData },
          timestamp: timestamp,
          signature: {
            properties: [
              'transaction.id',
              'transaction.status',
              'transaction.amount_in_cents',
            ],
            checksum: generateSignature(
              { transaction: transactionData },
              timestamp,
            ),
          },
        };

        await service.handleWebhookEvent(payload);

        expect(rejectMock).toHaveBeenCalledWith(
          expect.any(BadRequestException),
        );
        expect(
          (service as any).pendingSubscriptions.has(transactionId),
        ).toBeFalsy();
      },
    );

    it('should reject when pending subscription is missing', async () => {
      const timestamp = Date.now();
      const transactionData = {
        id: 'trans_missing',
        status: 'APPROVED',
        amount_in_cents: 1000,
      };

      const payload: any = {
        event: 'transaction.updated',
        data: { transaction: transactionData },
        timestamp,
        signature: {
          properties: [
            'transaction.id',
            'transaction.status',
            'transaction.amount_in_cents',
          ],
          checksum: generateSignature(
            { transaction: transactionData },
            timestamp,
          ),
        },
      };

      await expect(service.handleWebhookEvent(payload)).rejects.toThrow(
        'No se encontró la suscripción pendiente',
      );
    });

    it('should handle approved subscription with existing monthly source', async () => {
      const transactionId = 'trans_sub_monthly';
      const resolveMock = jest.fn();
      (service as any).pendingSubscriptions.set(transactionId, {
        resolve: resolveMock,
        reject: jest.fn(),
        timer: setTimeout(() => {}, 1000),
      });

      const timestamp = Date.now();
      const transactionData = {
        id: transactionId,
        status: 'APPROVED',
        amount_in_cents: 20000,
        payment_method: {
          payment_description: JSON.stringify({
            userId: 'user_1',
            planType: 'PRO',
            frequency: 'MONTHLY',
            sourceId: 'source-1',
          }),
        },
      };

      const payload: any = {
        event: 'transaction.updated',
        data: { transaction: transactionData },
        timestamp,
        signature: {
          properties: [
            'transaction.id',
            'transaction.status',
            'transaction.amount_in_cents',
          ],
          checksum: generateSignature(
            { transaction: transactionData },
            timestamp,
          ),
        },
      };

      userService.findOne.mockResolvedValue({ id: 'user_1' });
      paymentSourceRepository.findOne.mockResolvedValue({
        id: 1,
        frequency: 'MONTHLY',
      });
      paymentSourceRepository.save.mockResolvedValue({});
      userService.confirmSubscription.mockResolvedValue({ id: 'sub_1' });

      await service.handleWebhookEvent(payload);

      expect(resolveMock).toHaveBeenCalledWith({ id: 'sub_1' });
    });

    it('should handle approved subscription with annual source', async () => {
      const transactionId = 'trans_sub_annual';
      const resolveMock = jest.fn();
      (service as any).pendingSubscriptions.set(transactionId, {
        resolve: resolveMock,
        reject: jest.fn(),
        timer: setTimeout(() => {}, 1000),
      });

      const timestamp = Date.now();
      const transactionData = {
        id: transactionId,
        status: 'APPROVED',
        amount_in_cents: 20000,
        payment_method: {
          payment_description: JSON.stringify({
            userId: 'user_1',
            planType: 'PRO',
            frequency: 'ANNUALLY',
            sourceId: 'source-1',
          }),
        },
      };

      const payload: any = {
        event: 'transaction.updated',
        data: { transaction: transactionData },
        timestamp,
        signature: {
          properties: [
            'transaction.id',
            'transaction.status',
            'transaction.amount_in_cents',
          ],
          checksum: generateSignature(
            { transaction: transactionData },
            timestamp,
          ),
        },
      };

      userService.findOne.mockResolvedValue({ id: 'user_1' });
      paymentSourceRepository.findOne.mockResolvedValue({
        id: 2,
        frequency: 'ANNUALLY',
      });
      paymentSourceRepository.save.mockResolvedValue({});
      userService.confirmSubscription.mockResolvedValue({ id: 'sub_2' });

      await service.handleWebhookEvent(payload);

      expect(resolveMock).toHaveBeenCalledWith({ id: 'sub_2' });
    });

    it('should reject when user lookup fails during subscription', async () => {
      const transactionId = 'trans_sub_error';
      const rejectMock = jest.fn();
      (service as any).pendingSubscriptions.set(transactionId, {
        resolve: jest.fn(),
        reject: rejectMock,
        timer: setTimeout(() => {}, 1000),
      });

      const timestamp = Date.now();
      const transactionData = {
        id: transactionId,
        status: 'APPROVED',
        amount_in_cents: 20000,
        payment_method: {
          payment_description: JSON.stringify({
            userId: 'user_1',
            planType: 'PRO',
            frequency: 'MONTHLY',
            sourceId: 'source-1',
          }),
        },
      };

      const payload: any = {
        event: 'transaction.updated',
        data: { transaction: transactionData },
        timestamp,
        signature: {
          properties: [
            'transaction.id',
            'transaction.status',
            'transaction.amount_in_cents',
          ],
          checksum: generateSignature(
            { transaction: transactionData },
            timestamp,
          ),
        },
      };

      userService.findOne.mockResolvedValue(null);

      await service.handleWebhookEvent(payload);

      expect(rejectMock).toHaveBeenCalled();
    });

    it('should use default status message when missing', async () => {
      const transactionId = 'trans_sub_decline';
      const rejectMock = jest.fn();
      (service as any).pendingSubscriptions.set(transactionId, {
        reject: rejectMock,
        timer: setTimeout(() => {}, 1000),
      });

      const timestamp = Date.now();
      const transactionData = {
        id: transactionId,
        status: 'DECLINED',
        amount_in_cents: 20000,
        payment_method: { payment_description: '{}' },
      };

      const payload: any = {
        event: 'transaction.updated',
        data: { transaction: transactionData },
        timestamp,
        signature: {
          properties: [
            'transaction.id',
            'transaction.status',
            'transaction.amount_in_cents',
          ],
          checksum: generateSignature(
            { transaction: transactionData },
            timestamp,
          ),
        },
      };

      await service.handleWebhookEvent(payload);

      expect(rejectMock).toHaveBeenCalledWith(expect.any(BadRequestException));
      const rejection = rejectMock.mock.calls[0][0] as BadRequestException;
      const response = rejection.getResponse() as any;
      expect(response.message).toBe('Pago rechazado');
      expect(response.details).toBe('La transacción fue rechazada');
    });
  });

  describe('validateSignature', () => {
    it('should throw when checksum is missing', () => {
      const payload: any = {
        signature: { properties: ['transaction.id'], checksum: '' },
      };

      expect(() => (service as any).validateSignature(payload)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw when properties are invalid', () => {
      const payload: any = {
        signature: { properties: 'nope', checksum: 'x' },
      };

      expect(() => (service as any).validateSignature(payload)).toThrow(
        BadRequestException,
      );
    });

    it('should throw when signature property is missing', () => {
      const payload: any = {
        signature: {
          properties: ['transaction.id'],
          checksum: 'x',
        },
        data: { transaction: {} },
      };

      expect(() => (service as any).validateSignature(payload)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('createTransaction', () => {
    it('should return error result on API failure', async () => {
      const axiosWompi = require('@/utils/axiosWompiInstance');
      axiosWompi.post.mockRejectedValue(new Error('fail'));

      const result = await (service as any).createTransaction({
        sourceId: 1,
        amountInCents: 100,
        email: 'test@example.com',
        reference: 'ref',
        description: 'desc',
        detail: {
          planType: 'PRO',
          frequency: 'MONTHLY',
          userId: '1',
          sourceId: '1',
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
