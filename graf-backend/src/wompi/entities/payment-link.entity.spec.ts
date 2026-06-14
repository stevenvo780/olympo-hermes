import { PaymentLinkMapping } from './payment-link.entity';

describe('PaymentLinkMapping Entity', () => {
  it('should create an instance with default values', () => {
    const entity = new PaymentLinkMapping();
    expect(entity).toBeDefined();
    expect(entity.storeId).toBeUndefined(); // Before DB default logic applies
  });

  it('should accept values', () => {
    const entity = new PaymentLinkMapping();
    entity.paymentLinkId = 'link-123';
    entity.sku = 'SKU-ABC';
    entity.storeId = 'store-1';

    expect(entity.paymentLinkId).toBe('link-123');
    expect(entity.sku).toBe('SKU-ABC');
    expect(entity.storeId).toBe('store-1');
  });
});
