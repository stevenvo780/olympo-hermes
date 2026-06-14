import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import * as XLSX from 'xlsx';
import { Order, OrderStatus, DiscountType } from './entities/order.entity';
import { OrderItem, ProductSnapshot } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { User } from '../user/entities/user.entity';
import { Store } from '../store/entities/store.entity';
import { PLAN_DETAILS, PlanType } from '../user/entities/subscription.entity';
import { Product } from '../product/entities/product.entity';
import { DeliveryZone } from '../delivery-zone/entities/delivery-zone.entity';
import { Tax } from '../tax/entities/tax.entity';
import { ProductCoreService } from '../product/modules/core/product-core.service';
import { canAccessStore, checkStoreAccess } from '../utils/permissions';
import { PluginService } from '../plugins/plugin.service';
import { ConfigService as AppConfigService } from '../config/config.service';
import { CustomerService } from '../customer/customer.service';
import { Customer } from '../customer/entities/customer.entity';
import { CauceHubService } from '../cauce/hub.service';
import { SortOrder } from '../user/dto/find-users.dto';
import { PaymentFrequency } from '../wompi/entities/payment-source.entity';

interface CustomerFilters {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

interface ExportFilters {
  startDate?: string;
  endDate?: string;
  status?: OrderStatus;
  search?: string;
  limit?: number;
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  private buildGuestCustomerEmail(storeId: string): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    return `guest-${storeId}-${timestamp}-${randomSuffix}@guest.local`;
  }

  constructor(
    @InjectRepository(Order) private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Store) private storeRepository: Repository<Store>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Product) private productRepository: Repository<Product>,
    @InjectRepository(DeliveryZone)
    private deliveryZoneRepository: Repository<DeliveryZone>,
    @InjectRepository(Tax)
    private taxRepository: Repository<Tax>,
    private productCoreService: ProductCoreService,
    private readonly pluginService: PluginService,
    private readonly appConfigService: AppConfigService,
    private readonly customerService: CustomerService,
    private readonly cauceHub: CauceHubService,
  ) {}

  /** Map a Graf Order entity to the @cauce/contracts ORDER_PAID payload. */
  private toCaucePaidPayload(order: Order) {
    const customer = order.customer;
    const items = (order.items || []).map((it) => {
      const product = it.product as unknown as {
        sku?: string;
        title?: string;
      };
      return {
        sku: product?.sku || String((product as { id?: number })?.id ?? ''),
        name: product?.title,
        qty: Number(it.quantity) || 0,
        unitPrice: Number(it.unitPrice ?? it.finalPrice) || 0,
      };
    });
    return {
      orderId: String(order.id),
      customer: {
        id: customer?.id != null ? String(customer.id) : undefined,
        name: customer?.name || order.buyerName || undefined,
        phone: customer?.phone || order.buyerPhone || undefined,
        email: customer?.email || undefined,
      },
      items,
      total: Number(order.amount?.total) || 0,
      currency: 'COP',
      paymentMethod: 'online' as const,
      store: order.store?.id ? String(order.store.id) : undefined,
    };
  }

  async createOrder(
    user: User | undefined,
    dto: CreateOrderDto,
  ): Promise<Order> {
    const { store, deliveryZoneId, userId } = dto;
    const storeSearch = await this.storeRepository.findOne({
      where: { id: store.id },
      relations: ['owner'],
    });

    let targetUser: User | undefined;
    if (userId) {
      targetUser = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['profile'],
      });
      if (!targetUser) {
        throw new NotFoundException('Usuario especificado no encontrado');
      }
    } else if (user) {
      targetUser = await this.userRepository.findOne({
        where: { id: user.id },
        relations: ['profile'],
      });
    }

    if (!storeSearch) {
      throw new NotFoundException('Store no encontrada');
    }

    await this.checkOrderLimit(storeSearch.owner.id);

    const productsWithUpdatedStock = await this.verifyAndUpdateProductStock(
      dto.items as unknown as Array<{
        product: { id: number };
        quantity: number;
      }>,
    );

    const productIds = dto.items.map((item) => item.product.id);
    const productsToCalculate = await this.productRepository.find({
      where: { id: In(productIds) },
      relations: ['taxes', 'discounts'],
    });
    const productMap = new Map(productsToCalculate.map((p) => [p.id, p]));

    let itemsTotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    const orderItems = dto.items.map((item) => {
      const productSearch = productMap.get(item.product.id);
      if (!productSearch) {
        throw new NotFoundException(
          `Producto con ID ${item.product.id} no encontrado`,
        );
      }
      const priceDetails =
        this.productCoreService.calculatePrices(productSearch);

      itemsTotal += priceDetails.totalPrice * item.quantity;
      taxTotal += priceDetails.taxPrice * item.quantity;
      discountTotal += priceDetails.discountPrice * item.quantity;

      // Crear snapshot limpio del producto (no guardar el entity completo)
      const productSnapshot: ProductSnapshot = {
        id: productSearch.id,
        title: productSearch.title,
        description: productSearch.description,
        basePrice: Number(productSearch.basePrice),
        sku: productSearch.sku,
        images: productSearch.images,
        stock: productSearch.stock,
        enabled: productSearch.enabled,
        taxes: productSearch.taxes?.map((t) => ({
          id: t.id,
          name: t.name,
          percentage: Number(t.rate),
        })),
        discounts: productSearch.discounts?.map((d) => ({
          id: d.id,
          name: d.name,
          type: d.discountType,
          value: Number(d.discountValue),
        })),
      };

      return {
        product: productSnapshot,
        quantity: item.quantity,
        finalPrice: priceDetails.totalPrice,
        unitPrice: priceDetails.basePrice,
      };
    });

    let orderDiscount = 0;
    if (dto.discountType && dto.discountValue) {
      if (dto.discountType === DiscountType.PERCENTAGE) {
        orderDiscount = (itemsTotal * dto.discountValue) / 100;
      } else if (dto.discountType === DiscountType.FIXED) {
        orderDiscount = dto.discountValue;
      }
      orderDiscount = Math.min(orderDiscount, itemsTotal);
    }

    const subtotalAfterDiscount = itemsTotal - orderDiscount;

    let deliveryZone: DeliveryZone = null;
    let deliveryPrice = 0;
    if (deliveryZoneId) {
      deliveryZone = await this.deliveryZoneRepository.findOne({
        where: { id: deliveryZoneId },
      });
      if (!deliveryZone) {
        throw new NotFoundException('DeliveryZone no encontrada');
      }

      if (
        deliveryZone.freeShippingThreshold &&
        subtotalAfterDiscount >= deliveryZone.freeShippingThreshold
      ) {
        deliveryPrice = 0;
      } else {
        deliveryPrice =
          typeof deliveryZone.price === 'number'
            ? deliveryZone.price
            : parseFloat(String(deliveryZone.price));
      }
    }

    let orderTaxTotal = 0;
    let orderTaxes: Tax[] = [];
    if (dto.taxIds && dto.taxIds.length > 0) {
      orderTaxes = await this.taxRepository.find({
        where: { id: In(dto.taxIds), store: { id: storeSearch.id } },
        relations: ['store'],
      });

      if (orderTaxes.length !== dto.taxIds.length) {
        throw new NotFoundException(
          'Uno o más impuestos no existen o no pertenecen a esta tienda',
        );
      }

      orderTaxes.forEach((tax) => {
        const rate =
          typeof tax.rate === 'number'
            ? tax.rate
            : parseFloat(String(tax.rate));
        orderTaxTotal += (subtotalAfterDiscount * rate) / 100;
      });
    }

    const finalTotal = subtotalAfterDiscount + orderTaxTotal + deliveryPrice;
    const totalDiscounts = discountTotal + orderDiscount;
    const totalTaxes = taxTotal + orderTaxTotal;

    const shippingAddress = dto.shippingAddress || targetUser?.profile?.shippingAddress || null;

    let customer: Customer;
    if (dto.customerId) {
      customer = await this.customerService.findOne(dto.customerId);
      if (!customer) {
        throw new NotFoundException(
          `Customer con ID ${dto.customerId} no encontrado`,
        );
      }
      if (customer.store.id !== storeSearch.id) {
        throw new BadRequestException('El customer no pertenece a esta tienda');
      }
    } else {
      const hasRealBuyerContact = Boolean(
        dto.buyerEmail || dto.buyerPhone || dto.buyerDocument,
      );
      customer = await this.customerService.findOrCreateCustomerForOrder(
        {
          name: dto.buyerName || targetUser?.name || 'Cliente Invitado',
          email:
            dto.buyerEmail ||
            targetUser?.email ||
            this.buildGuestCustomerEmail(storeSearch.id),
          phone: dto.buyerPhone || targetUser?.profile?.additionalPhone,
          documentNumber: dto.buyerDocument || targetUser?.documentNumber,
          address: shippingAddress?.address,
          city: shippingAddress?.city,
        },
        storeSearch.id,
        { forceNew: !targetUser && !hasRealBuyerContact },
      );
    }

    const newOrder = this.orderRepository.create({
      ...dto,
      items: orderItems,
      amount: {
        taxTotal: totalTaxes,
        discountTotal: totalDiscounts,
        delivery: deliveryPrice,
        total: finalTotal,
      },
      user: targetUser || null,
      customer: customer,
      store: storeSearch,
      shippingAddress,
      buyerName: dto.buyerName || targetUser?.name || null,
      buyerPhone: dto.buyerPhone || targetUser?.profile?.additionalPhone || null,
      documents: dto.documents || [],
      discountType: dto.discountType || null,
      discountValue: dto.discountValue || null,
      taxes: orderTaxes,
    });

    const savedOrder = await this.orderRepository.save(newOrder);

    if (customer?.id) {
      try {
        await this.customerService.updateCustomerOrderStats(
          customer.id,
          finalTotal,
        );
      } catch (err) {
        console.error('Error actualizando estadísticas del cliente:', err);
      }
    }

    await Promise.all(
      productsWithUpdatedStock.map(({ product, newStock }) => {
        product.stock = newStock;
        return this.productRepository.save(product);
      }),
    );

    const completeOrder = await this.orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: [
        'customer',
        'user',
        'store',
        'items',
        'deliveryZone',
        'taxes',
      ],
    });

    try {
      const payloadOrder = completeOrder || savedOrder;
      const payloadStore = payloadOrder.store;
      await this.pluginService.emit(
        'order.created',
        payloadOrder as unknown as Record<string, unknown>,
        payloadStore,
      );
    } catch (err) {
      console.error('Error notificando a Hub Central:', err);
    }

    return savedOrder;
  }

  private async verifyAndUpdateProductStock(
    orderItems: Array<{ product: { id: number }; quantity: number }>,
  ) {
    const productsToUpdate = [];
    const productIds = orderItems.map((item) => item.product.id);

    const products = await this.productRepository.find({
      where: { id: In(productIds) },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of orderItems) {
      const product = productMap.get(item.product.id);

      if (!product) {
        throw new NotFoundException(
          `Producto con ID ${item.product.id} no encontrado`,
        );
      }

      if (product.stock !== null) {
        const newStock = product.stock - item.quantity;

        if (newStock < 0) {
          throw new BadRequestException(
            `Stock insuficiente para el producto "${product.title}". Stock disponible: ${product.stock}`,
          );
        }

        productsToUpdate.push({ product, newStock, price: product.basePrice });
      }
    }

    return productsToUpdate;
  }

  async findOrdersByCustomer(
    user: User,
    pagination: { page: number; limit: number },
  ): Promise<{ data: Order[]; total: number }> {
    const { page, limit } = pagination;
    const [data, total] = await this.orderRepository.findAndCount({
      where: { user: { id: user.id } },
      relations: ['store', 'user', 'deliveryZone', 'items', 'taxes'],
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdAt: SortOrder.DESC,
      },
    });
    return { data, total };
  }

  async findOrdersByStore(
    storeId: string,
    user: User,
    options: {
      page: number;
      limit: number;
      search?: string;
      status?: OrderStatus;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<Order[]> {
    const { page, limit, search, status, startDate, endDate } = options;

    const store = await checkStoreAccess(this.storeRepository, storeId, user);
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    try {
      const queryBuilder = this.orderRepository
        .createQueryBuilder('order_table')
        .leftJoinAndSelect('order_table.store', 'store')
        .leftJoinAndSelect('order_table.user', 'user')
        .leftJoinAndSelect('user.profile', 'profile')
        .leftJoinAndSelect('order_table.customer', 'customer')
        .leftJoinAndSelect('order_table.deliveryZone', 'deliveryZone')
        .leftJoinAndSelect('order_table.taxes', 'taxes')
        .leftJoinAndSelect('order_table.items', 'items')
        .where('store.id = :storeId', { storeId });

      if (status) {
        queryBuilder.andWhere('order_table.status = :status', { status });
      }

      if (startDate) {
        const start = new Date(startDate);
        queryBuilder.andWhere('order_table.createdAt >= :start', { start });
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        queryBuilder.andWhere('order_table.createdAt <= :end', { end });
      }

      if (search && search.trim()) {
        const searchTerms = search
          .trim()
          .split(/\s+/)
          .filter((term) => term.length > 0)
          .map((term) => term.toLowerCase());

        if (searchTerms.length > 0) {
          const searchConditions = [];
          const parameters = {};

          searchTerms.forEach((term, index) => {
            const paramName = `searchTerm${index}`;
            const likePattern = `%${term}%`;
            parameters[paramName] = likePattern;

            searchConditions.push(`LOWER(user.name) LIKE :${paramName}`);
            searchConditions.push(`LOWER(user.email) LIKE :${paramName}`);
            searchConditions.push(
              `LOWER(profile.additionalPhone) LIKE :${paramName}`,
            );
            searchConditions.push(`LOWER(customer.name) LIKE :${paramName}`);
            searchConditions.push(`LOWER(customer.email) LIKE :${paramName}`);
            searchConditions.push(`LOWER(customer.phone) LIKE :${paramName}`);

            if (!isNaN(parseInt(term))) {
              const numericParam = `numericTerm${index}`;
              parameters[numericParam] = parseInt(term);
              searchConditions.push(`order_table.id = :${numericParam}`);
            }
          });

          queryBuilder.andWhere(
            `(${searchConditions.join(' OR ')})`,
            parameters,
          );
        }
      }

      queryBuilder
        .skip((page - 1) * limit)
        .take(limit)
        .orderBy('order_table.createdAt', SortOrder.DESC);

      return queryBuilder.getMany();
    } catch (error) {
      this.logger.error(
        `Error al buscar órdenes de la tienda ${storeId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error al cargar las órdenes. Contacte al administrador.',
      );
    }
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'user',
        'customer',
        'store',
        'store.owner',
        'store.employees',
        'deliveryZone',
        'taxes',
      ],
    });
    if (!order) throw new NotFoundException('Order not found');

    const rawItems: Array<Record<string, unknown>> =
      await this.orderItemRepository.query(
        'SELECT * FROM order_item WHERE "orderId" = $1',
        [order.id],
      );

    order.items = rawItems.map((raw) => {
      const item = new OrderItem();
      item.id = Number(raw.id);
      item.product = raw.product as ProductSnapshot;
      item.quantity = Number(raw.quantity);
      item.unitPrice = Number(raw.unitPrice);
      item.finalPrice = Number(raw.finalPrice);
      return item;
    });

    return order;
  }

  async updateOrder(
    id: number,
    dto: UpdateOrderDto,
    user: User,
  ): Promise<Order> {
    try {
      const order = await this.orderRepository.findOne({
        where: { id },
        relations: [
          'user',
          'customer',
          'store',
          'store.owner',
          'store.employees',
          'deliveryZone',
          'taxes',
        ],
      });

      if (!order) throw new NotFoundException('Order not found');
      const previousStatus = order.status;

      if (!canAccessStore(order.store, user)) {
        throw new ForbiddenException(
          'No tienes permiso para modificar esta orden',
        );
      }

      const {
        status,
        notes,
        paymentMethod,
        creditDays,
        discountType,
        discountValue,
        documents,
      } = dto;
      if (typeof status !== 'undefined') order.status = status;
      if (typeof notes !== 'undefined') order.notes = notes;
      if (typeof paymentMethod !== 'undefined')
        order.paymentMethod = paymentMethod;
      if (typeof creditDays !== 'undefined') order.creditDays = creditDays;
      if (typeof discountType !== 'undefined')
        order.discountType = discountType;
      if (typeof discountValue !== 'undefined')
        order.discountValue = discountValue;
      if (typeof documents !== 'undefined') order.documents = documents;

      if (
        status === OrderStatus.CANCELED &&
        previousStatus !== OrderStatus.CANCELED
      ) {
        const orderItems: Array<Record<string, unknown>> =
          await this.orderItemRepository.query(
            'SELECT * FROM order_item WHERE "orderId" = $1',
            [order.id],
          );

        for (const item of orderItems) {
          const productId = (item.product as { id?: number })?.id;
          if (productId) {
            const product = await this.productRepository.findOne({
              where: { id: productId },
            });
            if (product && product.stock !== null) {
              product.stock = Number(product.stock) + Number(item.quantity);
              await this.productRepository.save(product);
              this.logger.log(
                `Devuelto stock de ${item.quantity} unidades del producto ${productId} por cancelación de orden ${order.id}`,
              );
            }
          }
        }
      }

      const { items: newItems } = dto as UpdateOrderDto & {
        items?: Array<{ id: number; quantity: number; productId?: number }>;
      };
      if (typeof newItems !== 'undefined' && Array.isArray(newItems)) {
        try {
          const existingItems: Array<Record<string, unknown>> =
            await this.orderItemRepository.query(
              'SELECT * FROM order_item WHERE "orderId" = $1',
              [order.id],
            );

          const existingItemsMap = new Map(
            existingItems.map((item) => [item.id, item]),
          );
          const newItemsMap = new Map(
            newItems
              .filter((item) => item.id > 0)
              .map((item) => [item.id, item]),
          );

          const itemsToDelete = existingItems.filter(
            (item) => !newItemsMap.has(Number(item.id)),
          );

          for (const item of itemsToDelete) {
            const productId = (item.product as { id?: number })?.id;
            if (productId) {
              const product = await this.productRepository.findOne({
                where: { id: productId },
              });
              if (product && product.stock !== null) {
                product.stock = Number(product.stock) + Number(item.quantity);
                await this.productRepository.save(product);
              }
            }
            await this.orderItemRepository.query(
              'DELETE FROM order_item WHERE id = $1',
              [item.id],
            );
          }

          for (const newItem of newItems) {
            if (newItem.id > 0 && existingItemsMap.has(newItem.id)) {
              const existingItem = existingItemsMap.get(newItem.id)!;
              const oldQuantity = Number(existingItem.quantity);
              const newQuantity = Number(newItem.quantity);

              if (oldQuantity !== newQuantity) {
                const quantityDiff = newQuantity - oldQuantity;

                const productId = (existingItem.product as { id?: number })?.id;
                if (productId) {
                  const product = await this.productRepository.findOne({
                    where: { id: productId },
                  });

                  if (product && product.stock !== null) {
                    const newStock = Number(product.stock) - quantityDiff;
                    if (newStock < 0) {
                      throw new BadRequestException(
                        `Stock insuficiente para ${product.title}. Stock disponible: ${product.stock}`,
                      );
                    }
                    product.stock = newStock;
                    await this.productRepository.save(product);
                  }
                }

                await this.orderItemRepository.query(
                  'UPDATE order_item SET quantity = $1 WHERE id = $2',
                  [newQuantity, existingItem.id],
                );
              }
            }
          }

          const itemsToAdd = newItems.filter((item) => !item.id || item.id < 0);

          for (const newItem of itemsToAdd as {
            productId: number;
            quantity: number;
          }[]) {
            const product = await this.productRepository.findOne({
              where: { id: newItem.productId },
              relations: ['taxes', 'discounts'],
            });

            if (!product) {
              throw new NotFoundException(
                `Producto con ID ${newItem.productId} no encontrado`,
              );
            }

            if (product.stock !== null) {
              if (product.stock < newItem.quantity) {
                throw new BadRequestException(
                  `Stock insuficiente para ${product.title}. Stock disponible: ${product.stock}`,
                );
              }
              product.stock = Number(product.stock) - Number(newItem.quantity);
              await this.productRepository.save(product);
            }

            const priceDetails =
              this.productCoreService.calculatePrices(product);

            const productSnapshot = {
              id: product.id,
              title: product.title,
              description: product.description,
              basePrice: product.basePrice,
              images: product.images,
              taxes: product.taxes || [],
              discounts: product.discounts || [],
            };

            await this.orderItemRepository.query(
              'INSERT INTO order_item ("orderId", product, quantity, "unitPrice", "finalPrice") VALUES ($1, $2, $3, $4, $5)',
              [
                order.id,
                JSON.stringify(productSnapshot),
                newItem.quantity,
                priceDetails.basePrice,
                priceDetails.totalPrice,
              ],
            );
          }

          const updatedItems: Array<Record<string, unknown>> =
            await this.orderItemRepository.query(
              'SELECT * FROM order_item WHERE "orderId" = $1',
              [order.id],
            );

          let itemsTotal = 0;

          for (const item of updatedItems) {
            const finalPrice = Number(item.finalPrice || item.unitPrice || 0);
            const quantity = Number(item.quantity || 0);
            itemsTotal += finalPrice * quantity;
          }

          let orderDiscount = 0;
          if (order.discountType && order.discountValue) {
            const discountVal = Number(order.discountValue);
            if (order.discountType === DiscountType.PERCENTAGE) {
              orderDiscount = (itemsTotal * discountVal) / 100;
            } else if (order.discountType === DiscountType.FIXED) {
              orderDiscount = discountVal;
            }
            orderDiscount = Math.min(orderDiscount, itemsTotal);
          }

          const subtotalAfterDiscount = itemsTotal - orderDiscount;

          let orderTaxTotal = 0;
          if (order.taxes && order.taxes.length > 0) {
            for (const tax of order.taxes) {
              orderTaxTotal += (subtotalAfterDiscount * Number(tax.rate)) / 100;
            }
          }

          const totalTaxes = orderTaxTotal;
          const totalDiscounts = orderDiscount;
          const deliveryPrice = order.amount?.delivery || 0;
          const finalTotal = subtotalAfterDiscount + totalTaxes + deliveryPrice;

          order.amount = {
            ...order.amount,
            taxTotal: totalTaxes,
            discountTotal: totalDiscounts,
            total: finalTotal,
          };
        } catch (error) {
          this.logger.error(`Error actualizando items de orden ${id}:`, error);
          if (error instanceof BadRequestException) {
            throw error;
          }
          throw new InternalServerErrorException(
            `Error al actualizar items: ${error.message}`,
          );
        }
      }

      if (
        typeof discountType !== 'undefined' ||
        typeof discountValue !== 'undefined'
      ) {
        try {
          const items: Array<Record<string, unknown>> =
            await this.orderItemRepository.query(
              'SELECT * FROM order_item WHERE "orderId" = $1',
              [order.id],
            );

          if (!items || items.length === 0) {
            throw new BadRequestException(
              'La orden no tiene items para aplicar descuento',
            );
          }

          let itemsTotal = 0;
          let discountTotal = 0;

          for (const item of items) {
            if (!item.unitPrice || !item.finalPrice || !item.quantity) {
              throw new BadRequestException(
                'Items de orden con datos incompletos',
              );
            }
            const basePrice = Number(item.unitPrice) * Number(item.quantity);
            const finalPrice = Number(item.finalPrice) * Number(item.quantity);
            itemsTotal += basePrice;
            discountTotal += basePrice - finalPrice;
          }

          let orderDiscount = 0;
          if (order.discountType && order.discountValue) {
            const discountVal = Number(order.discountValue);
            if (isNaN(discountVal) || discountVal < 0) {
              throw new BadRequestException('Valor de descuento inválido');
            }

            if (order.discountType === DiscountType.PERCENTAGE) {
              if (discountVal > 100) {
                throw new BadRequestException(
                  'El porcentaje de descuento no puede ser mayor a 100%',
                );
              }
              orderDiscount = (itemsTotal * discountVal) / 100;
            } else if (order.discountType === DiscountType.FIXED) {
              orderDiscount = discountVal;
            }
            orderDiscount = Math.min(orderDiscount, itemsTotal);
          }

          const subtotalAfterDiscount = itemsTotal - orderDiscount;

          let orderTaxTotal = 0;
          if (order.taxes && order.taxes.length > 0) {
            for (const tax of order.taxes) {
              orderTaxTotal += (subtotalAfterDiscount * Number(tax.rate)) / 100;
            }
          }

          const totalTaxes = orderTaxTotal;
          const totalDiscounts = discountTotal + orderDiscount;
          const deliveryPrice = order.amount?.delivery || 0;
          const finalTotal = subtotalAfterDiscount + totalTaxes + deliveryPrice;

          order.amount = {
            ...order.amount,
            taxTotal: totalTaxes,
            discountTotal: totalDiscounts,
            total: finalTotal,
          };
        } catch (error) {
          this.logger.error(
            `Error recalculando totales de orden ${id}:`,
            error,
          );
          throw new InternalServerErrorException(
            `Error al recalcular totales: ${error.message}`,
          );
        }
      }

      const { deliveryZoneId, taxIds } = dto as UpdateOrderDto & {
        deliveryZoneId?: number;
        taxIds?: number[];
      };
      if (
        typeof deliveryZoneId !== 'undefined' ||
        typeof taxIds !== 'undefined'
      ) {
        try {
          const items: Array<Record<string, unknown>> =
            await this.orderItemRepository.query(
              'SELECT * FROM order_item WHERE "orderId" = $1',
              [order.id],
            );

          if (!items || items.length === 0) {
            throw new BadRequestException(
              'La orden no tiene items para recalcular totales',
            );
          }

          const productIds = items.map((it) =>
            typeof it.product === 'object'
              ? (it.product as unknown as { id: number }).id
              : it.product,
          );

          const products = await this.productRepository.find({
            where: { id: In(productIds) },
            relations: ['taxes', 'discounts'],
          });
          const productMap = new Map(products.map((p) => [p.id, p]));

          let itemsTotal = 0;
          let productTaxTotal = 0;
          let productDiscountTotal = 0;

          for (const item of items) {
            const p = productMap.get(
              typeof item.product === 'object'
                ? (item.product as unknown as { id: number }).id
                : Number(item.product),
            );
            if (!p)
              throw new NotFoundException('Producto en item no encontrado');

            const priceDetails = this.productCoreService.calculatePrices(p);

            itemsTotal +=
              Number(priceDetails.basePrice) * Number(item.quantity);
            productTaxTotal +=
              Number(priceDetails.taxPrice) * Number(item.quantity);
            productDiscountTotal +=
              Number(priceDetails.discountPrice) * Number(item.quantity);
          }

          let deliveryPrice = order.amount?.delivery || 0;
          let deliveryZone = order.deliveryZone;

          if (typeof deliveryZoneId !== 'undefined') {
            if (deliveryZoneId === null) {
              deliveryZone = null;
              deliveryPrice = 0;
            } else {
              deliveryZone = await this.deliveryZoneRepository.findOne({
                where: { id: deliveryZoneId },
              });
              if (!deliveryZone)
                throw new NotFoundException('DeliveryZone no encontrada');

              let tempOrderDiscount = 0;
              if (order.discountType && order.discountValue) {
                const discountVal = Number(order.discountValue);
                if (order.discountType === DiscountType.PERCENTAGE) {
                  tempOrderDiscount = (itemsTotal * discountVal) / 100;
                } else if (order.discountType === DiscountType.FIXED) {
                  tempOrderDiscount = discountVal;
                }
                tempOrderDiscount = Math.min(tempOrderDiscount, itemsTotal);
              }

              const tempSubtotalAfterDiscount = itemsTotal - tempOrderDiscount;

              if (
                deliveryZone.freeShippingThreshold &&
                tempSubtotalAfterDiscount >= deliveryZone.freeShippingThreshold
              ) {
                deliveryPrice = 0;
              } else {
                deliveryPrice =
                  typeof deliveryZone.price === 'number'
                    ? deliveryZone.price
                    : parseFloat(String(deliveryZone.price));
              }
            }
            order.deliveryZone = deliveryZone || null;
          }

          let orderDiscount = 0;
          if (order.discountType && order.discountValue) {
            const discountVal = Number(order.discountValue);
            if (isNaN(discountVal) || discountVal < 0) {
              throw new BadRequestException('Valor de descuento inválido');
            }
            if (order.discountType === DiscountType.PERCENTAGE) {
              if (discountVal > 100) {
                throw new BadRequestException(
                  'El porcentaje de descuento no puede ser mayor a 100%',
                );
              }
              orderDiscount = (itemsTotal * discountVal) / 100;
            } else if (order.discountType === DiscountType.FIXED) {
              orderDiscount = discountVal;
            }
            orderDiscount = Math.min(orderDiscount, itemsTotal);
          }

          const subtotalAfterDiscount = itemsTotal - orderDiscount;

          let orderTaxTotal = 0;
          let orderTaxes: Tax[] = order.taxes || [];
          if (typeof taxIds !== 'undefined') {
            if (!taxIds || taxIds.length === 0) {
              orderTaxes = [];
              orderTaxTotal = 0;
            } else {
              orderTaxes = await this.taxRepository.find({
                where: { id: In(taxIds), store: { id: order.store.id } },
                relations: ['store'],
              });
              if (orderTaxes.length !== taxIds.length) {
                throw new NotFoundException(
                  'Uno o más impuestos no existen o no pertenecen a esta tienda',
                );
              }
              orderTaxes.forEach((t) => {
                orderTaxTotal += (subtotalAfterDiscount * Number(t.rate)) / 100;
              });
            }
            order.taxes = orderTaxes;
          }

          const totalTaxes = productTaxTotal + orderTaxTotal;
          const totalDiscounts = productDiscountTotal + orderDiscount;
          const finalTotal =
            subtotalAfterDiscount + deliveryPrice + orderTaxTotal;

          order.amount = {
            ...order.amount,
            taxTotal: totalTaxes,
            discountTotal: totalDiscounts,
            delivery: deliveryPrice,
            total: finalTotal,
          };
        } catch (err) {
          this.logger.error(
            `Error recalculando totales (delivery/taxes) orden ${id}:`,
            err,
          );
          throw new InternalServerErrorException(
            err.message || 'Error al recalcular totales',
          );
        }
      }

      if (
        order.status === OrderStatus.CANCELED &&
        previousStatus !== OrderStatus.CANCELED
      ) {
        await this.restoreProductStock(order);
      }

      await this.orderRepository.save(order);

      const updated = await this.findOne(id);

      try {
        await this.pluginService.emit(
          'order.updated',
          updated as unknown as Record<string, unknown>,
          updated.store,
        );

        if (
          updated.status === OrderStatus.PAID &&
          previousStatus !== OrderStatus.PAID
        ) {
          await this.pluginService.emit(
            'order.paid',
            updated as unknown as Record<string, unknown>,
            updated.store,
          );
          // Cauce: Graf owns the online order (flow 1, pedido.pagado).
          // Fault-tolerant: never breaks the order transaction.
          await this.cauceHub.orderPaid(this.toCaucePaidPayload(updated));
        }

        if (
          updated.status === OrderStatus.CANCELED &&
          previousStatus !== OrderStatus.CANCELED
        ) {
          await this.pluginService.emit(
            'order.canceled',
            updated as unknown as Record<string, unknown>,
            updated.store,
          );
        }
      } catch (err) {
        console.error('Error notificando a Hub Central:', err);
      }
      return updated;
    } catch (error) {
      this.logger.error(`Error actualizando orden ${id}:`, error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        error.message || 'Error al actualizar la orden',
      );
    }
  }

  private async restoreProductStock(order: Order): Promise<void> {
    if (!order.items || order.items.length === 0) {
      return;
    }

    for (const item of order.items) {
      const productId =
        typeof item.product === 'object' ? item.product.id : item.product;
      const product = await this.productRepository.findOne({
        where: { id: productId },
      });

      if (product && product.stock !== null) {
        product.stock += item.quantity;
        await this.productRepository.save(product);
      }
    }
  }

  async removeOrder(id: number, user: User): Promise<void> {
    const order = await this.findOne(id);
    if (!canAccessStore(order.store, user)) {
      throw new ForbiddenException('No permission to delete this order');
    }

    try {
      await this.restoreProductStock(order as Order);
    } catch (e) {
      console.warn('No se pudo restaurar stock completamente', e);
    }

    await this.orderItemRepository.delete({ order: { id } });

    await this.orderRepository.delete(id);
  }

  private async checkOrderLimit(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['subscription', 'subscription.lastPaymentSource'],
    });

    const now = new Date();
    let planType = PlanType.FREE;
    let monthlyLimit = PLAN_DETAILS[PlanType.FREE].monthlyOrderLimit;

    if (user && user.subscription) {
      const { planType: subPlanType, lastPaymentSource } = user.subscription;
      if (
        lastPaymentSource &&
        lastPaymentSource.active &&
        lastPaymentSource.nextCharge > now
      ) {
        planType = subPlanType;
        monthlyLimit = PLAN_DETAILS[subPlanType].monthlyOrderLimit;
      }
    }

    if (planType === PlanType.FREE) {
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      const orderCount = await this.orderRepository.count({
        where: {
          store: { owner: { id: userId } },
          createdAt: Between(firstDayOfMonth, lastDayOfMonth),
        },
      });

      if (orderCount >= monthlyLimit) {
        throw new BadRequestException(
          `Ups la tienda a la que intentas hacer la orden ha alcanzado el límite de ${monthlyLimit} órdenes en el mes.`,
        );
      }
      return;
    }

    if (!user.subscription?.lastPaymentSource) {
      throw new BadRequestException('Información de suscripción no disponible');
    }

    const periodEnd = user.subscription.lastPaymentSource.nextCharge;
    const periodStart = new Date(periodEnd);

    if (
      user.subscription.lastPaymentSource.frequency === PaymentFrequency.MONTHLY
    ) {
      periodStart.setMonth(periodStart.getMonth() - 1);
    } else if (
      user.subscription.lastPaymentSource.frequency ===
      PaymentFrequency.ANNUALLY
    ) {
      periodStart.setFullYear(periodStart.getFullYear() - 1);
    }

    const orderCount = await this.orderRepository.count({
      where: {
        store: { owner: { id: userId } },
        createdAt: Between(periodStart, periodEnd),
      },
    });

    if (orderCount >= monthlyLimit) {
      throw new BadRequestException(
        `La tienda ha alcanzado el límite de ${monthlyLimit} órdenes en el período de su suscripción.`,
      );
    }
  }

  public async validateOrder(dto: CreateOrderDto): Promise<{
    items: {
      productId: number;
      quantity: number;
      basePrice: number;
      unitPrice: number;
      finalPrice: number;
      totalPrice: number;
    }[];
    subTotal: number;
    discountTotal: number;
    taxTotal: number;
    delivery?: number;
    total: number;
  }> {
    const orderItems = dto.items.map((item) => {
      if (
        'productId' in item &&
        typeof (item as { productId?: number }).productId === 'number'
      ) {
        return {
          ...item,
          product: { id: (item as { productId: number }).productId },
          quantity: item.quantity || 1,
        };
      }

      if (item.product && item.product.id) {
        return item;
      }

      throw new BadRequestException('Estructura de item inválida en la orden');
    });

    await this.verifyAndUpdateProductStock(
      orderItems as unknown as Array<{
        product: { id: number };
        quantity: number;
      }>,
    );

    const productIds = orderItems.map((item) => item.product.id);
    const products = await this.productRepository.find({
      where: { id: In(productIds) },
      relations: ['taxes', 'discounts'],
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let subTotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    const items = orderItems.map((item) => {
      const p = productMap.get(item.product.id);
      if (!p)
        throw new NotFoundException(`Producto ${item.product.id} no existe`);
      const prices = this.productCoreService.calculatePrices(p);
      const totalPrice = prices.totalPrice * item.quantity;

      subTotal += prices.basePrice * item.quantity;
      discountTotal += prices.discountPrice * item.quantity;
      taxTotal += prices.taxPrice * item.quantity;

      return {
        productId: p.id,
        quantity: item.quantity,
        basePrice: prices.basePrice,
        unitPrice: prices.basePrice,
        finalPrice: prices.totalPrice,
        totalPrice,
      };
    });

    let orderDiscount = 0;
    if (dto.discountType && dto.discountValue) {
      if (dto.discountType === DiscountType.PERCENTAGE) {
        orderDiscount = (subTotal * dto.discountValue) / 100;
      } else if (dto.discountType === DiscountType.FIXED) {
        orderDiscount = dto.discountValue;
      }
      orderDiscount = Math.min(orderDiscount, subTotal);
    }

    const subtotalAfterDiscount = subTotal - discountTotal - orderDiscount;

    let deliveryPrice = 0;
    if (dto.deliveryZoneId) {
      const zone = await this.deliveryZoneRepository.findOne({
        where: { id: dto.deliveryZoneId },
      });
      if (!zone) throw new NotFoundException('DeliveryZone no encontrada');

      if (
        zone.freeShippingThreshold &&
        subtotalAfterDiscount >= zone.freeShippingThreshold
      ) {
        deliveryPrice = 0;
      } else {
        deliveryPrice = zone.price;
      }
    }

    let orderTaxTotal = 0;
    if (dto.taxIds && dto.taxIds.length > 0) {
      const orderTaxes = await this.taxRepository.find({
        where: { id: In(dto.taxIds) },
      });

      if (orderTaxes.length !== dto.taxIds.length) {
        throw new NotFoundException('Uno o más impuestos no existen');
      }

      orderTaxes.forEach((tax) => {
        const rate =
          typeof tax.rate === 'number'
            ? tax.rate
            : parseFloat(String(tax.rate));
        orderTaxTotal += (subtotalAfterDiscount * rate) / 100;
      });
    }

    const totalTaxes = taxTotal + orderTaxTotal;
    const totalDiscounts = discountTotal + orderDiscount;
    const deliveryPriceNum =
      typeof deliveryPrice === 'number'
        ? deliveryPrice
        : parseFloat(String(deliveryPrice));
    const total = subtotalAfterDiscount + totalTaxes + deliveryPriceNum;

    return {
      items,
      subTotal,
      discountTotal: totalDiscounts,
      taxTotal: totalTaxes,
      delivery: deliveryPriceNum,
      total,
    };
  }

  async exportOrdersToExcel(
    storeId: string,
    user: User,
    filters: ExportFilters,
  ): Promise<Buffer> {
    const store = await checkStoreAccess(this.storeRepository, storeId, user);
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order_table')
      .leftJoinAndSelect('order_table.store', 'store')
      .leftJoinAndSelect('order_table.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('order_table.deliveryZone', 'deliveryZone')
      .leftJoinAndSelect('order_table.items', 'items')
      .where('store.id = :storeId', { storeId })
      .take(filters.limit || 20000);

    if (filters.status) {
      queryBuilder.andWhere('order_table.status = :status', {
        status: filters.status,
      });
    }

    if (filters.startDate) {
      const start = new Date(filters.startDate);
      queryBuilder.andWhere('order_table.createdAt >= :start', { start });
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('order_table.createdAt <= :end', { end });
    }

    if (filters.search && filters.search.trim()) {
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(user.name) LIKE :search OR LOWER(user.email) LIKE :search OR CAST(order_table.id AS TEXT) LIKE :search)',
        { search: searchTerm },
      );
    }

    queryBuilder.orderBy('order_table.createdAt', SortOrder.DESC);

    const orders = await queryBuilder.getMany();

    const excelData = orders.map((order) => {
      const productSummary =
        order.items
          ?.map((item) => {
            const product = item.product;
            return `${product.title} (SKU: ${product.sku}) x${item.quantity} - $${item.unitPrice}`;
          })
          .join(' | ') || 'Sin productos';

      return {
        'ID Orden': order.id,
        Estado: order.status,
        Cliente: order.user?.name || 'Cliente Anónimo',
        Email: order.user?.email || '',
        Teléfono: order.user?.profile?.additionalPhone || '',
        Productos: productSummary,
        'Cantidad Items': order.items?.length || 0,
        Total: order.amount?.total || 0,
        Descuentos: order.amount?.discountTotal || 0,
        Impuestos: order.amount?.taxTotal || 0,
        Envío: order.amount?.delivery || 0,
        'Zona de Entrega': order.deliveryZone?.zone || '',
        'Fecha Creación': order.createdAt?.toLocaleString('es-ES') || '',
        'Fecha Actualización': order.updatedAt?.toLocaleString('es-ES') || '',
      };
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const columnWidths = [
      { wch: 10 },
      { wch: 15 },
      { wch: 25 },
      { wch: 30 },
      { wch: 15 },
      { wch: 50 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Órdenes');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async findStoreCustomers(
    storeId: string,
    _user: User,
    _filters: CustomerFilters,
  ): Promise<{ customers: Record<string, unknown>[]; total: number }> {
    const customers = await this.customerService.findByStore(storeId);

    return {
      customers: customers as unknown as Record<string, unknown>[],
      total: customers.length,
    };
  }

  async exportCustomersToExcel(
    storeId: string,
    _user: User,
    _filters: ExportFilters,
  ): Promise<Buffer> {
    const customers = await this.customerService.findByStore(storeId);

    const customerData = customers.map((customer) => ({
      'ID Cliente': customer.id,
      Nombre: customer.name || '',
      Email: customer.email,
      Teléfono: customer.phone || '',
      Ciudad: customer.city || '',
      Dirección: customer.address || '',
      'Fecha Registro': customer.createdAt?.toLocaleString('es-ES') || '',
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(customerData);

    const columnWidths = [
      { wch: 12 },
      { wch: 25 },
      { wch: 30 },
      { wch: 15 },
      { wch: 20 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 10 },
      { wch: 15 },
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
