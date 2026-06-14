import { Test, TestingModule } from '@nestjs/testing';
import { CustomPaymentsService } from './custom-payments.service';
import { CredentialsService } from '../credentials/credentials.service';
import { OrderService } from '../order/order.service';
import { ConfigService } from '../config/config.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentLinkMapping } from '../wompi/entities/payment-link.entity';
import { Store } from '../store/entities/store.entity';
import { BadRequestException } from '@nestjs/common';
import { CreateOrderPaymentDto } from './dto/create-order-payment.dto';
import { RequestWithUser } from '../auth/types';
import { OrderStatus, PaymentMethod } from '../order/entities/order.entity';
import { UserRole } from '../user/entities/user.entity';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CustomPaymentsService', () => {
  let service: CustomPaymentsService;
  let credentialsService: jest.Mocked<CredentialsService>;
  let orderService: jest.Mocked<OrderService>;
  let configService: jest.Mocked<ConfigService>;
  let paymentLinkRepository: jest.Mocked<Repository<PaymentLinkMapping>>;
  let storeRepository: jest.Mocked<Repository<Store>>;

  const mockStore = {
    id: '1',
    name: 'Test Store',
    owner: { id: 'owner1', role: 'BUSINESS_OWNER' },
  };

  const mockUser: RequestWithUser['user'] = {
    id: 'user1',
    role: UserRole.CUSTOMER,
  } as any;

  const mockConfig = {
    enablePaymentLinks: true,
  };

  const mockCredentials = {
    privateKey: 'test-private-key',
    publicKey: 'pub_test_abc123',
  };

  const mockOrder = {
    id: 1,
    amount: { total: 100.5 },
    status: OrderStatus.PENDING,
  };

  const mockCreateOrderPaymentDto: CreateOrderPaymentDto = {
    order: {
      items: [],
      deliveryAddress: 'Test Address',
    } as any,
    redirectUrl: 'https://frontend.app/payment-summary',
  };

  beforeEach(async () => {
    const mockCredentialsService = {
      getCredentials: jest.fn(),
    };

    const mockOrderService = {
      createOrder: jest.fn(),
      updateOrder: jest.fn(),
    };

    const mockConfigService = {
      getConfigByStore: jest.fn(),
    };

    const mockPaymentLinkRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const mockStoreRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomPaymentsService,
        {
          provide: CredentialsService,
          useValue: mockCredentialsService,
        },
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(PaymentLinkMapping),
          useValue: mockPaymentLinkRepository,
        },
        {
          provide: getRepositoryToken(Store),
          useValue: mockStoreRepository,
        },
      ],
    }).compile();

    service = module.get<CustomPaymentsService>(CustomPaymentsService);
    credentialsService = module.get(CredentialsService);
    orderService = module.get(OrderService);
    configService = module.get(ConfigService);
    paymentLinkRepository = module.get(getRepositoryToken(PaymentLinkMapping));
    storeRepository = module.get(getRepositoryToken(Store));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('orderAndPay', () => {
    it('should create order and payment link successfully', async () => {
      const storeId = '1';

      storeRepository.findOne.mockResolvedValue(mockStore as any);
      configService.getConfigByStore.mockResolvedValue(mockConfig as any);
      orderService.createOrder.mockResolvedValue(mockOrder as any);
      credentialsService.getCredentials.mockResolvedValue(
        mockCredentials as any,
      );

      const mockPaymentLinkResponse = {
        data: {
          data: {
            id: 'payment-link-id-123',
          },
        },
      };
      mockedAxios.post.mockResolvedValue(mockPaymentLinkResponse);

      paymentLinkRepository.save.mockResolvedValue({} as any);

      const result = await service.orderAndPay(
        storeId,
        mockUser,
        mockCreateOrderPaymentDto,
      );

      expect(result).toEqual({
        order: mockOrder,
        paymentLink: 'https://checkout.wompi.co/l/payment-link-id-123',
      });
      expect(storeRepository.findOne).toHaveBeenCalledWith({
        where: { id: storeId },
        relations: ['owner'],
      });
      expect(configService.getConfigByStore).toHaveBeenCalledWith(
        storeId,
        mockStore.owner,
      );
      expect(orderService.createOrder).toHaveBeenCalledWith(mockUser, {
        ...mockCreateOrderPaymentDto.order,
        paymentMethod: 'wompi',
        store: mockStore,
      });
      expect(credentialsService.getCredentials).toHaveBeenCalledWith(
        storeId,
        mockStore.owner,
      );
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${process.env.WOMPI_BASE_URL || 'https://sandbox.wompi.co/v1'}/payment_links`,
        {
          name: 'Order #1',
          description: 'Payment for order 1',
          amount_in_cents: 10050,
          currency: 'COP',
          sku: 'order_1',
          redirect_url: mockCreateOrderPaymentDto.redirectUrl,
          single_use: true,
          collect_shipping: false,
        },
        {
          headers: {
            Authorization: 'Bearer test-private-key',
            'Content-Type': 'application/json',
          },
        },
      );
      expect(paymentLinkRepository.save).toHaveBeenCalledWith({
        paymentLinkId: 'payment-link-id-123',
        user: { id: 'user1' },
        sku: 'order_1',
        storeId: '1',
      });
    });

    it('should throw BadRequestException when store not found', async () => {
      const storeId = '999';

      storeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.orderAndPay(storeId, mockUser, mockCreateOrderPaymentDto),
      ).rejects.toThrow(new BadRequestException('Store not found'));

      expect(storeRepository.findOne).toHaveBeenCalledWith({
        where: { id: storeId },
        relations: ['owner'],
      });
    });

    it('should throw BadRequestException when payment links are disabled', async () => {
      const storeId = '1';
      const disabledConfig = { enablePaymentLinks: false };

      storeRepository.findOne.mockResolvedValue(mockStore as any);
      configService.getConfigByStore.mockResolvedValue(disabledConfig as any);

      await expect(
        service.orderAndPay(storeId, mockUser, mockCreateOrderPaymentDto),
      ).rejects.toThrow(
        new BadRequestException('Payment links are disabled for this store'),
      );

      expect(configService.getConfigByStore).toHaveBeenCalledWith(
        storeId,
        mockStore.owner,
      );
    });

    it('should throw BadRequestException when payment link creation fails', async () => {
      const storeId = '1';

      storeRepository.findOne.mockResolvedValue(mockStore as any);
      configService.getConfigByStore.mockResolvedValue(mockConfig as any);
      orderService.createOrder.mockResolvedValue(mockOrder as any);
      credentialsService.getCredentials.mockResolvedValue(
        mockCredentials as any,
      );

      mockedAxios.post.mockRejectedValue(new Error('API Error'));

      await expect(
        service.orderAndPay(storeId, mockUser, mockCreateOrderPaymentDto),
      ).rejects.toThrow(
        'Error al generar el link de pago',
      );

      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('should use store owner when user is missing', async () => {
      const storeId = '1';

      storeRepository.findOne.mockResolvedValue(mockStore as any);
      configService.getConfigByStore.mockResolvedValue(mockConfig as any);
      orderService.createOrder.mockResolvedValue(mockOrder as any);
      credentialsService.getCredentials.mockResolvedValue(
        mockCredentials as any,
      );

      mockedAxios.post.mockResolvedValue({
        data: { data: { id: 'payment-link-id-456' } },
      });

      paymentLinkRepository.save.mockResolvedValue({} as any);

      await service.orderAndPay(
        storeId,
        undefined as any,
        mockCreateOrderPaymentDto,
      );

      expect(paymentLinkRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user: { id: mockStore.owner.id },
        }),
      );
    });

    it('should include response details when wompi responds with error', async () => {
      const storeId = '1';

      storeRepository.findOne.mockResolvedValue(mockStore as any);
      configService.getConfigByStore.mockResolvedValue(mockConfig as any);
      orderService.createOrder.mockResolvedValue(mockOrder as any);
      credentialsService.getCredentials.mockResolvedValue(
        mockCredentials as any,
      );

      mockedAxios.post.mockRejectedValue({
        response: { status: 400, data: { error: 'bad' } },
      });

      await expect(
        service.orderAndPay(storeId, mockUser, mockCreateOrderPaymentDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should fall back to unknown error when wompi error lacks details', async () => {
      const storeId = '1';

      storeRepository.findOne.mockResolvedValue(mockStore as any);
      configService.getConfigByStore.mockResolvedValue(mockConfig as any);
      orderService.createOrder.mockResolvedValue(mockOrder as any);
      credentialsService.getCredentials.mockResolvedValue(
        mockCredentials as any,
      );

      mockedAxios.post.mockRejectedValue({});

      await expect(
        service.orderAndPay(storeId, mockUser, mockCreateOrderPaymentDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should respect provided payment method', async () => {
      const storeId = '1';
      const dtoWithMethod: CreateOrderPaymentDto = {
        ...mockCreateOrderPaymentDto,
        order: {
          ...mockCreateOrderPaymentDto.order,
          paymentMethod: PaymentMethod.CASH,
        },
      };

      storeRepository.findOne.mockResolvedValue(mockStore as any);
      configService.getConfigByStore.mockResolvedValue(mockConfig as any);
      orderService.createOrder.mockResolvedValue(mockOrder as any);
      credentialsService.getCredentials.mockResolvedValue(
        mockCredentials as any,
      );
      mockedAxios.post.mockResolvedValue({
        data: { data: { id: 'payment-link-id-999' } },
      });
      paymentLinkRepository.save.mockResolvedValue({} as any);

      await service.orderAndPay(storeId, mockUser, dtoWithMethod);

      expect(orderService.createOrder).toHaveBeenCalledWith(mockUser, {
        ...dtoWithMethod.order,
        paymentMethod: PaymentMethod.CASH,
        store: mockStore,
      });
    });
  });

  describe('handleWebhook', () => {
    it('should process approved transaction webhook successfully', async () => {
      const storeId = '1';
      const payload = {
        event: 'transaction.updated',
        data: {
          transaction: {
            status: 'APPROVED',
            payment_link_id: 'payment-link-id-123',
            id: 'tx-123',
          },
        },
      };

      const mockMapping = {
        paymentLinkId: 'payment-link-id-123',
        sku: 'order_1',
        user: { id: 'user1' },
      };

      paymentLinkRepository.findOne.mockResolvedValue(mockMapping as any);
      storeRepository.findOne.mockResolvedValue(mockStore as any);
      orderService.updateOrder.mockResolvedValue(mockOrder as any);

      const result = await service.handleWebhook(storeId, payload);

      expect(result).toEqual({ success: true });
      expect(paymentLinkRepository.findOne).toHaveBeenCalledWith({
        where: { paymentLinkId: 'payment-link-id-123', storeId },
        relations: ['user'],
      });
      expect(storeRepository.findOne).toHaveBeenCalledWith({
        where: { id: storeId },
        relations: ['owner'],
      });
      expect(orderService.updateOrder).toHaveBeenCalledWith(
        1,
        { status: OrderStatus.PAID, paymentMethod: PaymentMethod.WOMPI },
        mockStore.owner,
      );
    });

    it('should return success for non-approved transactions', async () => {
      const storeId = '1';
      const payload = {
        event: 'transaction.updated',
        data: {
          transaction: {
            status: 'PENDING',
            payment_link_id: 'payment-link-id-123',
            id: 'tx-123',
          },
        },
      };

      const result = await service.handleWebhook(storeId, payload);

      expect(result).toEqual({ success: true });
      expect(paymentLinkRepository.findOne).not.toHaveBeenCalled();
    });

    it('should handle missing order when processing approved transaction', async () => {
      const storeId = '1';
      const payload = {
        event: 'transaction.updated',
        data: {
          transaction: {
            status: 'APPROVED',
            payment_link_id: 'payment-link-id-123',
            id: 'tx-123',
          },
        },
      };

      const mockMapping = {
        paymentLinkId: 'payment-link-id-123',
        sku: 'order_99',
        user: { id: 'user1' },
      };

      paymentLinkRepository.findOne.mockResolvedValue(mockMapping as any);
      storeRepository.findOne.mockResolvedValue(mockStore as any);
      orderService.updateOrder.mockResolvedValue(null);

      const result = await service.handleWebhook(storeId, payload);

      expect(result).toEqual({ success: true });
      expect(orderService.updateOrder).toHaveBeenCalled();
    });

    it('should return success for different event types', async () => {
      const storeId = '1';
      const payload = {
        event: 'payment.created',
        data: {},
      };

      const result = await service.handleWebhook(storeId, payload);

      expect(result).toEqual({ success: true });
      expect(paymentLinkRepository.findOne).not.toHaveBeenCalled();
    });

    it('should handle missing mapping gracefully', async () => {
      const storeId = '1';
      const payload = {
        event: 'transaction.updated',
        data: {
          transaction: {
            status: 'APPROVED',
            payment_link_id: 'nonexistent-payment-link',
            id: 'tx-123',
          },
        },
      };

      paymentLinkRepository.findOne.mockResolvedValue(null);

      const result = await service.handleWebhook(storeId, payload);

      expect(result).toEqual({ success: true });
      expect(paymentLinkRepository.findOne).toHaveBeenCalled();
      expect(storeRepository.findOne).not.toHaveBeenCalled();
    });

    it('should ignore mappings that do not represent orders', async () => {
      const storeId = '1';
      const payload = {
        event: 'transaction.updated',
        data: {
          transaction: {
            status: 'APPROVED',
            payment_link_id: 'payment-link-id-123',
            id: 'tx-123',
          },
        },
      };

      paymentLinkRepository.findOne.mockResolvedValue({
        paymentLinkId: 'payment-link-id-123',
        sku: 'product_1',
        user: { id: 'user1' },
      } as any);

      const result = await service.handleWebhook(storeId, payload);

      expect(result).toEqual({ success: true });
      expect(orderService.updateOrder).not.toHaveBeenCalled();
    });
  });
});
