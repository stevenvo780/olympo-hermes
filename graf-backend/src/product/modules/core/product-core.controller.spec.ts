import { Test, TestingModule } from '@nestjs/testing';
import { ProductCoreController } from './product-core.controller';
import { ProductCoreService } from './product-core.service';
import { FirebaseAuthGuard } from '@/auth/firebase-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';

describe('ProductCoreController', () => {
  let controller: ProductCoreController;

  const mockCoreService = {
    create: jest.fn(),
    findAll: jest.fn(),
    searchGlobal: jest.fn(),
    findMostPopularByStore: jest.fn(),
    getMinMaxPrices: jest.fn(),
    getAllProducts: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<ProductCoreService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductCoreController],
      providers: [{ provide: ProductCoreService, useValue: mockCoreService }],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get(ProductCoreController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create delega a service.create', async () => {
    const dto: any = { title: 'P', sku: 'SKU' };
    const req: any = { user: { id: 1 } };
    (mockCoreService.create as any).mockResolvedValue({ id: 1, ...dto });

    const result = await controller.create(dto, 'store-1', req);
    expect(result).toEqual({ id: 1, ...dto });
    expect(mockCoreService.create).toHaveBeenCalledWith(
      dto,
      'store-1',
      req.user,
    );
  });

  it('findAll construye filtro y delega a service.findAll', async () => {
    (mockCoreService.findAll as any).mockResolvedValue({
      products: [],
      total: 0,
      currentPage: 1,
      totalPages: 0,
    });
    const result = await controller.findAll(
      'store-1',
      5,
      10,
      'true',
      'true',
      1,
      100,
      't',
      'c1',
      'true',
      'text',
    );
    expect(result).toBeDefined();
    expect(mockCoreService.findAll).toHaveBeenCalledWith(
      'store-1',
      expect.objectContaining({
        limit: 5,
        offset: 10,
        exist: true,
        minPrice: 1,
        maxPrice: 100,
        title: 't',
        category: 'c1',
        discount: true,
        text: 'text',
      }),
    );
  });

  it('findAll mapea flags en false', async () => {
    (mockCoreService.findAll as any).mockResolvedValue({
      products: [],
      total: 0,
      currentPage: 1,
      totalPages: 0,
    });

    await controller.findAll(
      'store-1',
      10,
      0,
      'false',
      'false',
      undefined,
      undefined,
      undefined,
      undefined,
      'false',
      undefined,
    );

    expect(mockCoreService.findAll).toHaveBeenCalledWith(
      'store-1',
      expect.objectContaining({
        exist: false,
        includeOutOfStock: false,
        discount: false,
      }),
    );
  });

  it('findAll deja flags como undefined cuando no se especifican', async () => {
    (mockCoreService.findAll as any).mockResolvedValue({
      products: [],
      total: 0,
      currentPage: 1,
      totalPages: 0,
    });

    await controller.findAll('store-1', 10, 0);

    expect(mockCoreService.findAll).toHaveBeenCalledWith(
      'store-1',
      expect.objectContaining({
        exist: undefined,
        includeOutOfStock: undefined,
        discount: undefined,
      }),
    );
  });

  it('searchGlobal delega a service.searchGlobal', async () => {
    (mockCoreService.searchGlobal as any).mockResolvedValue({
      products: [],
      total: 0,
    });
    const result = await controller.searchGlobal('abc', 10, 0);
    expect(result).toBeDefined();
    expect(mockCoreService.searchGlobal).toHaveBeenCalledWith({
      query: 'abc',
      limit: 10,
      offset: 0,
    });
  });

  it('findMostPopular delega a service.findMostPopularByStore con storeId numerico', async () => {
    (mockCoreService.findMostPopularByStore as any).mockResolvedValue([]);
    await controller.findMostPopular('5', 3);
    expect(mockCoreService.findMostPopularByStore).toHaveBeenCalledWith(5, 3);
  });

  it('getPriceRange delega a service.getMinMaxPrices', async () => {
    (mockCoreService.getMinMaxPrices as any).mockResolvedValue({
      min: 0,
      max: 10,
    });
    await controller.getPriceRange('store-1');
    expect(mockCoreService.getMinMaxPrices).toHaveBeenCalledWith('store-1');
  });

  it('getAllProducts delega a service.getAllProducts', async () => {
    (mockCoreService.getAllProducts as any).mockResolvedValue([]);
    await controller.getAllProducts('store-1');
    expect(mockCoreService.getAllProducts).toHaveBeenCalledWith('store-1');
  });

  it('findOne delega a service.findOne con id numerico', async () => {
    (mockCoreService.findOne as any).mockResolvedValue({ id: 1 });
    await controller.findOne('1', 'store-1');
    expect(mockCoreService.findOne).toHaveBeenCalledWith(1, 'store-1');
  });

  it('update delega a service.update con id numerico y usuario', async () => {
    const dto: any = { title: 'X' };
    const req: any = { user: { id: 2 } };
    (mockCoreService.update as any).mockResolvedValue({ id: 1, ...dto });
    await controller.update('1', dto, 'store-1', req);
    expect(mockCoreService.update).toHaveBeenCalledWith(
      1,
      dto,
      'store-1',
      req.user,
    );
  });

  it('remove delega a service.remove con id numerico y usuario', async () => {
    const req: any = { user: { id: 3 } };
    (mockCoreService.remove as any).mockResolvedValue({});
    await controller.remove('1', 'store-1', req);
    expect(mockCoreService.remove).toHaveBeenCalledWith(1, 'store-1', req.user);
  });
});
