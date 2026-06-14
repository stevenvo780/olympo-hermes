import { Test, TestingModule } from '@nestjs/testing';
import { ProductExcelController } from './product-excel.controller';
import { ProductExcelService } from './product-excel.service';
import { FirebaseAuthGuard } from '@/auth/firebase-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';

describe('ProductExcelController', () => {
  let controller: ProductExcelController;

  const mockService = {
    getLookupData: jest.fn(),
    getAllProductsForExport: jest.fn(),
    importExcel: jest.fn(),
  } as unknown as jest.Mocked<ProductExcelService>;

  const mockFirebaseAuthGuard = { canActivate: jest.fn(() => true) };
  const mockRolesGuard = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductExcelController],
      providers: [{ provide: ProductExcelService, useValue: mockService }],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue(mockFirebaseAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get(ProductExcelController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getLookupData delega a service.getLookupData', async () => {
    (mockService.getLookupData as any).mockResolvedValue({});
    await controller.getLookupData('store-1');
    expect(mockService.getLookupData).toHaveBeenCalledWith('store-1');
  });

  it('exportProducts delega a service.getAllProductsForExport', async () => {
    (mockService.getAllProductsForExport as any).mockResolvedValue([]);
    await controller.exportProducts('store-1');
    expect(mockService.getAllProductsForExport).toHaveBeenCalledWith('store-1');
  });

  it('importProducts delega a service.importExcel con usuario', async () => {
    const dto: any = { rows: [] };
    const req: any = { user: { id: 1 } };
    (mockService.importExcel as any).mockResolvedValue({ imported: 0 });
    await controller.importProducts('store-1', dto, req);
    expect(mockService.importExcel).toHaveBeenCalledWith(
      dto,
      'store-1',
      req.user,
    );
  });
});
