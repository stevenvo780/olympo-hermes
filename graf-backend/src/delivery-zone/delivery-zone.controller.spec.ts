import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryZoneController } from './delivery-zone.controller';
import { DeliveryZoneService } from './delivery-zone.service';
import { DeliveryZone } from './entities/delivery-zone.entity';
import { UserRole } from '../user/entities/user.entity';
import { CreateDeliveryZoneDto } from './dto/create-delivery-zone.dto';
import { UpdateDeliveryZoneDto } from './dto/update-delivery-zone.dto';
import { RequestWithUser } from '../auth/types';

describe('DeliveryZoneController', () => {
  let controller: DeliveryZoneController;
  let service: DeliveryZoneService;

  const mockDeliveryZoneService = {
    create: jest.fn(),
    findAllByStore: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeliveryZoneController],
      providers: [
        {
          provide: DeliveryZoneService,
          useValue: mockDeliveryZoneService,
        },
      ],
    })
      .overrideGuard(require('../auth/firebase-auth.guard').FirebaseAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(require('../auth/roles.guard').RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<DeliveryZoneController>(DeliveryZoneController);
    service = module.get<DeliveryZoneService>(DeliveryZoneService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a delivery zone', async () => {
      const storeId = 'store1';
      const createDeliveryZoneDto: CreateDeliveryZoneDto = {
        zone: 'Centro',
        price: 5.5,
        estimatedTime: '30-45 min',
      };
      const req = {
        user: { id: '1', role: UserRole.SUPER_ADMIN },
      } as RequestWithUser;

      const createdDeliveryZone = {
        id: 1,
        ...createDeliveryZoneDto,
        store: { id: storeId },
      } as unknown as DeliveryZone;

      mockDeliveryZoneService.create.mockResolvedValue(createdDeliveryZone);

      const result = await controller.create(
        storeId,
        createDeliveryZoneDto,
        req,
      );

      expect(result).toEqual(createdDeliveryZone);
      expect(service.create).toHaveBeenCalledWith(
        storeId,
        req.user,
        createDeliveryZoneDto,
      );
    });
  });

  describe('findAll', () => {
    it('should return delivery zones for a store', async () => {
      const storeId = 'store1';
      const deliveryZones = [
        {
          id: 1,
          zone: 'Centro',
          price: 5.5,
          estimatedTime: '30-45 min',
        },
        {
          id: 2,
          zone: 'Norte',
          price: 7.0,
          estimatedTime: '45-60 min',
        },
      ] as DeliveryZone[];

      mockDeliveryZoneService.findAllByStore.mockResolvedValue(deliveryZones);

      const result = await controller.findAll(storeId);

      expect(result).toEqual(deliveryZones);
      expect(service.findAllByStore).toHaveBeenCalledWith(storeId);
    });
  });

  describe('findOne', () => {
    it('should return a delivery zone by id', async () => {
      const deliveryZoneId = 1;
      const deliveryZone = {
        id: deliveryZoneId,
        zone: 'Centro',
        price: 5.5,
        estimatedTime: '30-45 min',
      } as DeliveryZone;

      mockDeliveryZoneService.findOne.mockResolvedValue(deliveryZone);

      const result = await controller.findOne(deliveryZoneId);

      expect(result).toEqual(deliveryZone);
      expect(service.findOne).toHaveBeenCalledWith(deliveryZoneId);
    });
  });

  describe('update', () => {
    it('should update a delivery zone', async () => {
      const deliveryZoneId = 1;
      const updateDeliveryZoneDto: UpdateDeliveryZoneDto = {
        zone: 'Centro Actualizado',
        price: 6.0,
        estimatedTime: '25-40 min',
      };
      const req = {
        user: { id: '1', role: UserRole.SUPER_ADMIN },
      } as RequestWithUser;

      const updatedDeliveryZone = {
        id: deliveryZoneId,
        ...updateDeliveryZoneDto,
      } as DeliveryZone;

      mockDeliveryZoneService.update.mockResolvedValue(updatedDeliveryZone);

      const result = await controller.update(
        deliveryZoneId,
        updateDeliveryZoneDto,
        req,
      );

      expect(result).toEqual(updatedDeliveryZone);
      expect(service.update).toHaveBeenCalledWith(
        deliveryZoneId,
        req.user,
        updateDeliveryZoneDto,
      );
    });
  });

  describe('remove', () => {
    it('should remove a delivery zone', async () => {
      const deliveryZoneId = 1;
      const req = {
        user: { id: '1', role: UserRole.SUPER_ADMIN },
      } as RequestWithUser;

      mockDeliveryZoneService.remove.mockResolvedValue(undefined);

      await controller.remove(deliveryZoneId, req);

      expect(service.remove).toHaveBeenCalledWith(deliveryZoneId, req.user);
    });
  });
});
