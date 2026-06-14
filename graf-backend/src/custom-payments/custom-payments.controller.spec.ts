import { Test, TestingModule } from '@nestjs/testing';
import { CustomPaymentsController } from './custom-payments.controller';
import { CustomPaymentsService } from './custom-payments.service';
import { CreateOrderPaymentDto } from './dto/create-order-payment.dto';
import { RequestWithUser } from '../auth/types';
import { OptionalFirebaseAuthGuard } from '../auth/optional-firebase-auth.guard';
import { UserRole } from '../user/entities/user.entity';

describe('CustomPaymentsController', () => {
  let controller: CustomPaymentsController;
  let service: jest.Mocked<CustomPaymentsService>;

  const mockCustomPaymentsService = {
    orderAndPay: jest.fn(),
    handleWebhook: jest.fn(),
  };

  const mockRequest: RequestWithUser = {
    user: { id: 'user1', role: UserRole.CUSTOMER },
  } as unknown as RequestWithUser;

  const mockCreateOrderPaymentDto: CreateOrderPaymentDto = {
    order: {
      items: [],
      deliveryAddress: 'Test Address',
    } as any,
    redirectUrl: 'https://frontend.app/payment-summary',
  };

  const mockOrderAndPayResult = {
    order: {
      id: 1,
      amount: { total: 100.5 },
      status: 'PENDING',
    },
    paymentLink: 'https://checkout.wompi.co/l/payment-link-id-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomPaymentsController],
      providers: [
        {
          provide: CustomPaymentsService,
          useValue: mockCustomPaymentsService,
        },
      ],
    })
      .overrideGuard(OptionalFirebaseAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CustomPaymentsController>(CustomPaymentsController);
    service = module.get(CustomPaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('orderAndPay', () => {
    it('should create order and payment link successfully', async () => {
      const storeId = '1';

      mockCustomPaymentsService.orderAndPay.mockResolvedValue(
        mockOrderAndPayResult,
      );

      const result = await controller.orderAndPay(
        storeId,
        mockRequest,
        mockCreateOrderPaymentDto,
      );

      expect(result).toEqual(mockOrderAndPayResult);
      expect(service.orderAndPay).toHaveBeenCalledWith(
        storeId,
        mockRequest.user,
        mockCreateOrderPaymentDto,
      );
      expect(service.orderAndPay).toHaveBeenCalledTimes(1);
    });

    it('should handle errors from service', async () => {
      const storeId = '1';
      const error = new Error('Service error');

      mockCustomPaymentsService.orderAndPay.mockRejectedValue(error);

      await expect(
        controller.orderAndPay(storeId, mockRequest, mockCreateOrderPaymentDto),
      ).rejects.toThrow('Service error');

      expect(service.orderAndPay).toHaveBeenCalledWith(
        storeId,
        mockRequest.user,
        mockCreateOrderPaymentDto,
      );
    });
  });

  describe('webhook', () => {
    it('should process webhook successfully', async () => {
      const storeId = '1';
      const payload = {
        event: 'transaction.updated',
        data: {
          transaction: {
            status: 'APPROVED',
            payment_link_id: 'payment-link-id-123',
          },
        },
      };

      const expectedResult = { success: true };
      mockCustomPaymentsService.handleWebhook.mockResolvedValue(expectedResult);

      const result = await controller.webhook(storeId, payload as any);

      expect(result).toEqual(expectedResult);
      expect(service.handleWebhook).toHaveBeenCalledWith(storeId, payload);
      expect(service.handleWebhook).toHaveBeenCalledTimes(1);
    });

    it('should handle different webhook events', async () => {
      const storeId = '2';
      const payload = {
        event: 'payment.created',
        data: {
          payment: {
            id: 'payment-123',
          },
        },
      };

      const expectedResult = { success: true };
      mockCustomPaymentsService.handleWebhook.mockResolvedValue(expectedResult);

      const result = await controller.webhook(storeId, payload as any);

      expect(result).toEqual(expectedResult);
      expect(service.handleWebhook).toHaveBeenCalledWith(storeId, payload);
    });

    it('should handle empty payload', async () => {
      const storeId = '1';
      const payload = {};

      const expectedResult = { success: true };
      mockCustomPaymentsService.handleWebhook.mockResolvedValue(expectedResult);

      const result = await controller.webhook(storeId, payload as any);

      expect(result).toEqual(expectedResult);
      expect(service.handleWebhook).toHaveBeenCalledWith(storeId, payload);
    });
  });
});
