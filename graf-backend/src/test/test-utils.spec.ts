import {
  createMockRequest,
  createTestProduct,
  createTestUser,
} from './test-utils';

describe('test-utils helpers', () => {
  it('createTestProduct uses defaults when overrides are omitted', () => {
    const product = createTestProduct();
    expect(product.title).toBe('Test Product');
    expect(product.enabled).toBe(true);
  });

  it('createMockRequest uses provided user', () => {
    const user = createTestUser({ id: 'custom-user' });
    const req = createMockRequest(user);

    expect(req.user).toBe(user);
    expect(req.headers.authorization).toBe('Bearer test-token');
  });

  it('createMockRequest creates a user when none provided', () => {
    const req = createMockRequest();

    expect(req.user).toBeDefined();
    expect(req.headers.authorization).toBe('Bearer test-token');
  });
});
