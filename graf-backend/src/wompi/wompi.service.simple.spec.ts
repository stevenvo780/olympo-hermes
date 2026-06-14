import { BadRequestException, UnauthorizedException } from '@nestjs/common';

const mockWompiService = {
  createUniquePaymentLink: jest.fn(),
  processSubscription: jest.fn(),
  cancelSubscription: jest.fn(),
  handleWebhookEvent: jest.fn(),
  _validateSignature: jest.fn(),
};

jest.mock('@/utils/axiosWompiInstance', () => ({
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

jest.mock('@/utils/encrypt', () => ({
  encrypt: jest.fn((data: string) => `encrypted_${data}`),
  decrypt: jest.fn((data: string) => data.replace('encrypted_', '')),
}));

jest.mock('crypto', () => ({
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'mocked-hash'),
  })),
  createHmac: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'valid-signature'),
  })),
}));

describe('WompiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.WOMPI_EVENTS_SECRET = 'test-secret';
    process.env.ENCRYPTION_KEY = 'test-encryption-key';
    process.env.WOMPI_STORE_SKU = 'STORE_SKU';
  });

  describe('createUniquePaymentLink', () => {
    it('should create a unique payment link successfully', async () => {
      mockWompiService.createUniquePaymentLink.mockResolvedValue(
        'https://wompi.com/link/123',
      );

      const result = await mockWompiService.createUniquePaymentLink({
        name: 'Test Payment',
        description: 'Test Description',
        sku: 'TEST_SKU',
        userId: 'user-123',
        amountInCents: 10000,
        redirectUrl: 'https://example.com/success',
        storeId: 'store-123',
      });

      expect(result).toBe('https://wompi.com/link/123');
      expect(mockWompiService.createUniquePaymentLink).toHaveBeenCalled();
    });

    it('should throw BadRequestException when Wompi API fails', async () => {
      mockWompiService.createUniquePaymentLink.mockRejectedValue(
        new BadRequestException('Wompi API error'),
      );

      await expect(
        mockWompiService.createUniquePaymentLink({}),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('processSubscription', () => {
    it('should process subscription successfully', async () => {
      mockWompiService.processSubscription.mockResolvedValue({
        id: 'sub-123',
        status: 'ACTIVE',
      });

      const result = await mockWompiService.processSubscription({
        userId: 'user-123',
        planType: 'BASIC',
        tokenId: 'tok_123',
      });

      expect(result.status).toBe('ACTIVE');
      expect(mockWompiService.processSubscription).toHaveBeenCalled();
    });

    it('should throw BadRequestException when user not found', async () => {
      mockWompiService.processSubscription.mockRejectedValue(
        new BadRequestException('Usuario no encontrado'),
      );

      await expect(mockWompiService.processSubscription({})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when payment source is unavailable', async () => {
      mockWompiService.processSubscription.mockRejectedValue(
        new BadRequestException('Error al crear la fuente de pago'),
      );

      await expect(mockWompiService.processSubscription({})).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription successfully', async () => {
      mockWompiService.cancelSubscription.mockResolvedValue({
        cancelled: 1,
        activeSources: 0,
      });

      const result = await mockWompiService.cancelSubscription('user-123');

      expect(result.cancelled).toBe(1);
      expect(mockWompiService.cancelSubscription).toHaveBeenCalledWith(
        'user-123',
      );
    });
  });

  describe('handleWebhookEvent', () => {
    it('should handle store purchase webhook successfully', async () => {
      mockWompiService.handleWebhookEvent.mockResolvedValue({
        storePurchases: 1,
        subscriptionsProcessed: 0,
      });

      const result = await mockWompiService.handleWebhookEvent({
        signature: 'valid-signature',
        event: 'transaction.updated',
        data: { reference: 'store-123' },
      });

      expect(result.storePurchases).toBe(1);
      expect(mockWompiService.handleWebhookEvent).toHaveBeenCalled();
    });

    it('should handle order payment webhook successfully', async () => {
      mockWompiService.handleWebhookEvent.mockResolvedValue({
        storePurchases: 1,
        subscriptionsProcessed: 0,
      });

      const result = await mockWompiService.handleWebhookEvent({
        signature: 'valid-signature',
        event: 'transaction.updated',
        data: { reference: 'order-456' },
      });

      expect(result.storePurchases).toBe(1);
      expect(mockWompiService.handleWebhookEvent).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid signature', async () => {
      mockWompiService.handleWebhookEvent.mockRejectedValue(
        new UnauthorizedException('Invalid signature'),
      );

      await expect(
        mockWompiService.handleWebhookEvent({
          signature: 'invalid-signature',
          event: 'transaction.updated',
          data: {},
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle subscription webhook successfully', async () => {
      mockWompiService.handleWebhookEvent.mockResolvedValue({
        storePurchases: 0,
        subscriptionsProcessed: 1,
      });

      const result = await mockWompiService.handleWebhookEvent({
        signature: 'valid-signature',
        event: 'transaction.updated',
        data: { reference: 'sub-123' },
      });

      expect(result.subscriptionsProcessed).toBe(1);
      expect(mockWompiService.handleWebhookEvent).toHaveBeenCalled();
    });
  });

  describe('signature validation', () => {
    it('should validate correct signature', () => {
      mockWompiService._validateSignature.mockReturnValue(true);

      const result = mockWompiService._validateSignature(
        'test-signature',
        JSON.stringify({ test: 'data' }),
        'secret-key',
      );

      expect(result).toBe(true);
      expect(mockWompiService._validateSignature).toHaveBeenCalled();
    });
  });
});
