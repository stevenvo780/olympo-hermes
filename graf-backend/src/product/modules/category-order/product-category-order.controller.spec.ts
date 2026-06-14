import { Test, TestingModule } from '@nestjs/testing';
import { ProductCategoryOrderController } from './product-category-order.controller';
import { ProductCategoryOrderService } from './product-category-order.service';
import { FirebaseAuthGuard } from '@/auth/firebase-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';

describe('ProductCategoryOrderController', () => {
  let controller: ProductCategoryOrderController;

  const mockService = {
    updateProductCategoryOrder: jest.fn(),
    getProductCategoryOrders: jest.fn(),
    syncProductCategoryOrders: jest.fn(),
  } as unknown as jest.Mocked<ProductCategoryOrderService>;

  const mockFirebaseAuthGuard = { canActivate: jest.fn(() => true) };
  const mockRolesGuard = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductCategoryOrderController],
      providers: [
        { provide: ProductCategoryOrderService, useValue: mockService },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue(mockFirebaseAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get(ProductCategoryOrderController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('updateOrderInCategory delega a service.updateProductCategoryOrder', async () => {
    (mockService.updateProductCategoryOrder as any).mockResolvedValue({
      id: 1,
      orderInCategory: 2,
    });
    const body = {
      productId: 10,
      categoryId: 5,
      newOrder: 3,
      storeId: 'store-1',
    };
    const req = { user: { id: 1 } } as any;
    await controller.updateOrderInCategory(body, req);
    expect(mockService.updateProductCategoryOrder).toHaveBeenCalledWith(
      10,
      5,
      3,
      'store-1',
      req.user,
    );
  });

  it('getCategoryOrders delega a service.getProductCategoryOrders', async () => {
    const mockOrders = [
      { id: 1, product: { id: 1 }, orderInCategory: 1 },
      { id: 2, product: { id: 2 }, orderInCategory: 2 },
    ];
    (mockService.getProductCategoryOrders as any).mockResolvedValue(mockOrders);

    const result = await controller.getCategoryOrders('5', 'store-1');
    expect(mockService.getProductCategoryOrders).toHaveBeenCalledWith(
      5,
      'store-1',
    );
    expect(result).toEqual(mockOrders);
  });
});
