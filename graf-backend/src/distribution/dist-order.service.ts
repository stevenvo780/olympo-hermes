import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  AmountOrder,
  DistOrderStatus,
  Order,
  OrderStatus,
} from '../order/entities/order.entity';
import {
  OrderItem,
  ProductSnapshot,
} from '../order/entities/order-item.entity';
import { Product } from '../product/entities/product.entity';
import { Seller } from './entities/seller.entity';
import { Customer } from '../customer/entities/customer.entity';
import { CustomerAddress } from './entities/customer-address.entity';
import { DistCustomerService } from './dist-customer.service';
import { DistAccessService } from './dist-access.service';
import { ProductStockService } from '../product/modules/stock/product-stock.service';
import { User } from '../user/entities/user.entity';
import {
  AssignRouteDto,
  CreateDistOrderDto,
  OrderItemInputDto,
  TransitionOrderDto,
  UpdateOrderItemsDto,
} from './dto/order.dto';
import { EDITABLE_STATUSES, ORDER_TRANSITIONS } from './distribution.constants';

export interface FindOrdersFilter {
  storeId?: string;
  sellerId?: number;
  deliveryZoneId?: number;
  status?: DistOrderStatus;
  startDate?: string;
  endDate?: string;
  routeStartDate?: string;
  routeEndDate?: string;
  search?: string;
}

export interface InventoryLine {
  productId: number | undefined;
  title: string | undefined;
  required: number;
  available: number | null; // null = stock no rastreado (ilimitado)
  ok: boolean;
}

@Injectable()
export class DistOrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Seller)
    private readonly sellerRepo: Repository<Seller>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    private readonly customerService: DistCustomerService,
    private readonly access: DistAccessService,
    private readonly productStock: ProductStockService,
  ) {}

  private readonly relations = [
    'seller',
    'customer',
    'customerAddress',
    'deliveryZone',
    'items',
    'store',
  ];

  /** Catalog of enabled products for the cart and the edit modal. */
  async listProducts(storeId: string, user: User): Promise<Product[]> {
    await this.access.assertAccess(storeId, user);
    return this.productRepo.find({
      where: { store: { id: storeId }, enabled: true },
      order: { title: 'ASC' },
    });
  }

  // --- Helpers ---

  private async buildItems(
    storeId: string,
    inputs: OrderItemInputDto[],
  ): Promise<OrderItem[]> {
    if (!inputs?.length) {
      throw new BadRequestException('El pedido debe tener al menos un producto');
    }
    const ids = inputs.map((i) => i.productId);
    const products = await this.productRepo.find({
      where: { id: In(ids), store: { id: storeId } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    return inputs.map((input) => {
      const product = byId.get(input.productId);
      if (!product) {
        throw new BadRequestException(
          `Producto ${input.productId} no existe en la tienda`,
        );
      }
      if (input.quantity <= 0) {
        throw new BadRequestException('La cantidad debe ser mayor a cero');
      }
      const snapshot: ProductSnapshot = {
        id: product.id,
        title: product.title,
        description: product.description,
        basePrice: Number(product.basePrice),
        sku: product.sku,
        images: product.images,
        stock: product.stock,
        enabled: product.enabled,
      };
      const unitPrice = input.unitPrice ?? Number(product.basePrice);
      const item = new OrderItem();
      item.product = snapshot;
      item.quantity = input.quantity;
      item.unitPrice = unitPrice;
      item.finalPrice = unitPrice;
      return item;
    });
  }

  private computeAmount(items: OrderItem[]): AmountOrder {
    const total = items.reduce(
      (sum, it) => sum + Number(it.unitPrice) * it.quantity,
      0,
    );
    return { discountTotal: 0, taxTotal: 0, delivery: 0, total };
  }

  /**
   * Carrier rule: when the order zone is a transportadora, a destination
   * address and a phone are mandatory. Throws otherwise.
   */
  private assertCarrierRequirements(
    zoneIsCarrier: boolean,
    address: CustomerAddress | undefined,
    phone: string | undefined,
  ): void {
    if (!zoneIsCarrier) return;
    const resolvedPhone = phone || address?.phone;
    if (!address || !address.address?.trim()) {
      throw new BadRequestException(
        'Zona transportadora: la dirección de entrega es obligatoria',
      );
    }
    if (!resolvedPhone?.trim()) {
      throw new BadRequestException(
        'Zona transportadora: el teléfono de contacto es obligatorio',
      );
    }
  }

  /**
   * Inventory snapshot per order line. null available = untracked stock
   * (treated as unlimited, like the marketplace does).
   */
  private async inventoryLines(
    storeId: string,
    order: Order,
  ): Promise<InventoryLine[]> {
    const items = order.items ?? [];
    const ids = items.map((it) => it.product?.id).filter(Boolean) as number[];
    const products = ids.length
      ? await this.productRepo.find({
          where: { id: In(ids), store: { id: storeId } },
        })
      : [];
    const byId = new Map(products.map((p) => [p.id, p]));
    return items.map((item) => {
      const pid = item.product?.id;
      const product = pid ? byId.get(pid) : undefined;
      const available = product ? product.stock : null;
      return {
        productId: pid,
        title: item.product?.title,
        required: item.quantity,
        available: available === undefined ? null : available,
        ok: available === null || available === undefined || available >= item.quantity,
      };
    });
  }

  /** D3: "I move them to accepted because I have the inventory." */
  private async assertInventory(storeId: string, order: Order): Promise<void> {
    const lines = await this.inventoryLines(storeId, order);
    const short = lines.filter((l) => !l.ok);
    if (short.length) {
      const detail = short
        .map((l) => `${l.title}: disponible ${l.available}, requiere ${l.required}`)
        .join('; ');
      throw new ConflictException(
        `Inventario insuficiente para aceptar el pedido: ${detail}`,
      );
    }
  }

  // --- Commands ---

  async create(
    storeId: string,
    user: User,
    dto: CreateDistOrderDto,
  ): Promise<Order> {
    await this.access.assertAccess(storeId, user);

    const seller = await this.sellerRepo.findOne({
      where: { id: dto.sellerId, storeId },
    });
    if (!seller) throw new BadRequestException('Vendedor no encontrado');

    const customer = await this.customerService.findByIdInStore(
      dto.customerId,
      storeId,
    );
    const zone = customer.zone; // zone is inherited from the customer
    const address = this.customerService.resolveAddress(
      customer,
      dto.customerAddressId,
    );

    this.assertCarrierRequirements(!!zone?.isCarrier, address, dto.buyerPhone);

    const items = await this.buildItems(storeId, dto.items);

    const order = this.orderRepo.create({
      store: { id: storeId },
      seller,
      sellerId: seller.id,
      customer,
      deliveryZone: zone ?? undefined,
      customerAddress: address ?? undefined,
      customerAddressId: address?.id,
      items,
      status: OrderStatus.PENDING,
      distStatus: DistOrderStatus.QUEUED,
      amount: this.computeAmount(items),
      notes: dto.notes ?? null,
      buyerName: customer.name,
      buyerPhone: dto.buyerPhone || address?.phone || customer.phone,
      shippingAddress: address
        ? {
            address: address.address,
            city: address.city ?? '',
            department: '',
            country: 'Colombia',
            reference: address.label,
          }
        : undefined,
      customAnswers: [],
    });

    const saved = await this.orderRepo.save(order);
    return this.findOneInStore(saved.id, storeId);
  }

  /** Store-scoped lookup (caller already asserted access). */
  private async findOneInStore(id: number, storeId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id, store: { id: storeId } },
      relations: this.relations,
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  async getOrder(id: number, storeId: string, user: User): Promise<Order> {
    await this.access.assertAccess(storeId, user);
    return this.findOneInStore(id, storeId);
  }

  async getInventory(
    id: number,
    storeId: string,
    user: User,
  ): Promise<{ orderId: number; allOk: boolean; items: InventoryLine[] }> {
    await this.access.assertAccess(storeId, user);
    const order = await this.findOneInStore(id, storeId);
    const items = await this.inventoryLines(storeId, order);
    return { orderId: id, allOk: items.every((i) => i.ok), items };
  }

  async findAll(
    storeId: string,
    user: User,
    filter: FindOrdersFilter,
  ): Promise<Order[]> {
    await this.access.assertAccess(storeId, user);
    const qb = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.seller', 'seller')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.customerAddress', 'customerAddress')
      .leftJoinAndSelect('order.deliveryZone', 'deliveryZone')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.storeId = :storeId', { storeId })
      .andWhere('order.distStatus IS NOT NULL');

    if (filter.sellerId) {
      qb.andWhere('order.sellerId = :sellerId', { sellerId: filter.sellerId });
    }
    if (filter.deliveryZoneId) {
      qb.andWhere('order.deliveryZoneId = :zoneId', {
        zoneId: filter.deliveryZoneId,
      });
    }
    if (filter.status) {
      qb.andWhere('order.distStatus = :status', { status: filter.status });
    }
    if (filter.startDate) {
      qb.andWhere('order.createdAt >= :startDate', {
        startDate: filter.startDate,
      });
    }
    if (filter.endDate) {
      qb.andWhere('order.createdAt <= :endDate', {
        endDate: `${filter.endDate} 23:59:59`,
      });
    }
    // Weekly cut: filter by assigned route/dispatch day so one week never
    // bleeds into the next (E1/E2).
    if (filter.routeStartDate) {
      qb.andWhere('order.routeDate >= :routeStart', {
        routeStart: filter.routeStartDate,
      });
    }
    if (filter.routeEndDate) {
      qb.andWhere('order.routeDate <= :routeEnd', {
        routeEnd: filter.routeEndDate,
      });
    }
    if (filter.search) {
      qb.andWhere('(customer.name ILIKE :s OR seller.name ILIKE :s)', {
        s: `%${filter.search}%`,
      });
    }

    return qb.orderBy('order.createdAt', 'DESC').getMany();
  }

  async updateItems(
    id: number,
    storeId: string,
    user: User,
    dto: UpdateOrderItemsDto,
  ): Promise<Order> {
    await this.access.assertAccess(storeId, user);
    const order = await this.findOneInStore(id, storeId);
    this.assertEditable(order);

    // Re-validate carrier requirements with the possibly-updated phone.
    this.assertCarrierRequirements(
      !!order.deliveryZone?.isCarrier,
      order.customerAddress,
      dto.buyerPhone || order.buyerPhone,
    );

    await this.itemRepo.delete({ order: { id: order.id } });
    const items = await this.buildItems(storeId, dto.items);
    items.forEach((it) => (it.order = order));
    await this.itemRepo.save(items);

    order.items = items;
    order.amount = this.computeAmount(items);
    if (dto.notes !== undefined) order.notes = dto.notes;
    if (dto.buyerPhone !== undefined) order.buyerPhone = dto.buyerPhone;
    await this.orderRepo.save(order);
    return this.findOneInStore(id, storeId);
  }

  private assertEditable(order: Order): void {
    const status = order.distStatus ?? DistOrderStatus.QUEUED;
    if (!EDITABLE_STATUSES.includes(status)) {
      throw new BadRequestException(
        `No se pueden editar las unidades de un pedido en estado "${status}"`,
      );
    }
  }

  async transition(
    id: number,
    storeId: string,
    user: User,
    dto: TransitionOrderDto,
  ): Promise<Order> {
    await this.access.assertAccess(storeId, user);
    const order = await this.findOneInStore(id, storeId);
    const from = order.distStatus ?? DistOrderStatus.QUEUED;
    const allowed = ORDER_TRANSITIONS[from] || [];
    if (!allowed.includes(dto.to)) {
      throw new BadRequestException(`Transición inválida: ${from} -> ${dto.to}`);
    }

    // Carrier orders cannot advance past the queue without address + phone.
    if (
      dto.to === DistOrderStatus.ACCEPTED ||
      dto.to === DistOrderStatus.ROUTED
    ) {
      this.assertCarrierRequirements(
        !!order.deliveryZone?.isCarrier,
        order.customerAddress,
        order.buyerPhone,
      );
    }

    // D3: accepting reflects inventory availability.
    if (dto.to === DistOrderStatus.ACCEPTED) {
      await this.assertInventory(storeId, order);
    }

    // Inventory leaves the warehouse at dispatch -> commit the decrement.
    if (dto.to === DistOrderStatus.DISPATCHED) {
      for (const item of order.items ?? []) {
        if (item.product?.id) {
          await this.productStock.decrementStock(
            item.product.id,
            storeId,
            item.quantity,
            'distribution-dispatch',
            { orderId: order.id },
          );
        }
      }
    }

    order.distStatus = dto.to;
    if (dto.to === DistOrderStatus.ROUTED && dto.routeDate) {
      order.routeDate = dto.routeDate;
    }
    await this.orderRepo.save(order);
    return this.findOneInStore(id, storeId);
  }

  /** E2: move a pending order from one day to another without losing it. */
  async setRouteDate(
    id: number,
    storeId: string,
    user: User,
    routeDate: string | null,
  ): Promise<Order> {
    await this.access.assertAccess(storeId, user);
    const order = await this.findOneInStore(id, storeId);
    const status = order.distStatus ?? DistOrderStatus.QUEUED;
    if (
      status === DistOrderStatus.DISPATCHED ||
      status === DistOrderStatus.CANCELED
    ) {
      throw new BadRequestException(
        `No se puede cambiar la fecha de ruta de un pedido en estado "${status}"`,
      );
    }
    order.routeDate = routeDate || null;
    await this.orderRepo.save(order);
    return this.findOneInStore(id, storeId);
  }

  async cancel(id: number, storeId: string, user: User): Promise<Order> {
    await this.access.assertAccess(storeId, user);
    const order = await this.findOneInStore(id, storeId);
    const from = order.distStatus ?? DistOrderStatus.QUEUED;
    if (
      from === DistOrderStatus.DISPATCHED ||
      from === DistOrderStatus.CANCELED
    ) {
      throw new BadRequestException(
        `No se puede anular un pedido en estado "${from}"`,
      );
    }
    order.distStatus = DistOrderStatus.CANCELED;
    await this.orderRepo.save(order);
    return this.findOneInStore(id, storeId);
  }

  // --- Routing ---

  /**
   * Classifies pending orders (queued/accepted) by zone/route so the office
   * can build the route from the consolidated list. Transportadora is kept as
   * its own bucket (it is picked up a single day, not routed with Medellín).
   */
  async routing(storeId: string, user: User, filter: FindOrdersFilter = {}) {
    const orders = await this.findAll(storeId, user, {
      ...filter,
      status: undefined,
    });
    const pending = orders.filter(
      (o) =>
        o.distStatus === DistOrderStatus.QUEUED ||
        o.distStatus === DistOrderStatus.ACCEPTED,
    );

    const groups = new Map<
      string,
      {
        zoneId: number | null;
        zone: string;
        routeGroup: string | null;
        isCarrier: boolean;
        orders: Order[];
      }
    >();

    for (const order of pending) {
      const z = order.deliveryZone;
      const key = z ? String(z.id) : 'sin-zona';
      if (!groups.has(key)) {
        groups.set(key, {
          zoneId: z?.id ?? null,
          zone: z?.zone ?? 'Sin zona',
          routeGroup: z?.routeGroup ?? null,
          isCarrier: !!z?.isCarrier,
          orders: [],
        });
      }
      groups.get(key)!.orders.push(order);
    }

    // Carrier buckets last; everything else alphabetically by zone.
    return Array.from(groups.values()).sort((a, b) => {
      if (a.isCarrier !== b.isCarrier) return a.isCarrier ? 1 : -1;
      return a.zone.localeCompare(b.zone);
    });
  }

  async assignRoute(
    storeId: string,
    user: User,
    dto: AssignRouteDto,
  ): Promise<{ updated: number }> {
    await this.access.assertAccess(storeId, user);
    if (!dto.orderIds?.length) {
      throw new BadRequestException('orderIds requerido');
    }
    const orders = await this.orderRepo.find({
      where: { id: In(dto.orderIds), store: { id: storeId } },
      relations: ['deliveryZone', 'customerAddress'],
    });
    let updated = 0;
    for (const order of orders) {
      const from = order.distStatus ?? DistOrderStatus.QUEUED;
      if (
        from === DistOrderStatus.DISPATCHED ||
        from === DistOrderStatus.CANCELED
      ) {
        continue;
      }
      this.assertCarrierRequirements(
        !!order.deliveryZone?.isCarrier,
        order.customerAddress,
        order.buyerPhone,
      );
      order.distStatus = DistOrderStatus.ROUTED;
      if (dto.routeDate) order.routeDate = dto.routeDate;
      updated++;
    }
    await this.orderRepo.save(orders);
    return { updated };
  }
}
