import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult, In } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { ProductCategoryOrder } from '../../entities/product-category-order.entity';
import { Store } from '@/store/entities/store.entity';
import { User } from '@/user/entities/user.entity';
import { CreateProductDto } from '../../dto/create-product.dto';
import { UpdateProductDto } from '../../dto/update-product.dto';
import { Tax } from '@/tax/entities/tax.entity';
import { Discount, DiscountType } from '@/discount/entities/discount.entity';
import { Category } from '@/category/entities/category.entity';
import { Order } from '@/order/entities/order.entity';
import {
  ProductResponse,
  PaginatedProductsResponse,
} from '../../types/product-response.type';
import {
  ProductPrices,
  ProductDisplayInfo,
} from '../../types/product-prices.type';
import { checkStoreAccess } from '@/utils/permissions';
import { SortOrder } from '@/user/dto/find-users.dto';

@Injectable()
export class ProductCoreService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductCategoryOrder)
    private readonly productCategoryOrderRepository: Repository<ProductCategoryOrder>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(Tax)
    private readonly taxRepository: Repository<Tax>,
    @InjectRepository(Discount)
    private readonly discountRepository: Repository<Discount>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    storeId: string,
    user: User,
  ): Promise<Product> {
    const store = await checkStoreAccess(this.storeRepository, storeId, user);
    const existing = await this.productRepository.findOne({
      where: {
        store: store,
        sku: createProductDto.sku,
      },
    });

    if (existing) {
      throw new ConflictException('El SKU ya existe para esta tienda');
    }

    const { parentId, categoryIds, taxIds, discountIds, ...rest } =
      createProductDto as CreateProductDto & {
        parentId?: number;
        categoryIds?: number[];
        taxIds?: number[];
        discountIds?: number[];
      };
    let parent: Product | null = null;
    if (parentId !== undefined && parentId !== null) {
      parent = await this.productRepository.findOne({
        where: { id: parentId, store: { id: storeId }, enabled: true },
      });
      if (!parent) {
        throw new NotFoundException('Producto padre no encontrado');
      }
    }

    const product = new Product();
    Object.assign(product, rest);
    product.parent = parent || undefined;
    product.store = store;

    if (taxIds && taxIds.length > 0) {
      product.taxes = await this.taxRepository.findBy({ id: In(taxIds) });
    }
    if (discountIds && discountIds.length > 0) {
      product.discounts = await this.discountRepository.findBy({
        id: In(discountIds),
      });
    }
    if (categoryIds && categoryIds.length > 0) {
      product.categories = await this.categoryRepository.findBy({
        id: In(categoryIds),
      });
    }

    const savedProduct = await this.productRepository.save(product);

    if (categoryIds && categoryIds.length > 0) {
      await this.syncProductCategoryOrders(
        savedProduct.id,
        categoryIds,
        storeId,
      );
    }

    return savedProduct;
  }

  async findAll(
    storeId: string,
    filter: Record<string, unknown> = {},
  ): Promise<PaginatedProductsResponse> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const limit = Number(filter.limit) || 10;
    const offset = Number(filter.offset) || 0;

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.taxes', 'taxes')
      .leftJoinAndSelect('product.categories', 'category')
      .leftJoinAndSelect('product.discounts', 'discounts')
      .leftJoinAndSelect('product.store', 'store')
      .andWhere('product.store = :storeId', { storeId })
      .andWhere('product.parent IS NULL')
      .andWhere('product.enabled = true');

    if (filter.exist === true) {
      query.andWhere('(product.stock IS NULL OR product.stock > 0)');
    } else if (
      filter.exist === undefined &&
      filter.includeOutOfStock !== true
    ) {
      query.andWhere('(product.stock IS NULL OR product.stock > 0)');
    }
    if (filter.minPrice) {
      query.andWhere('product.basePrice >= :minPrice', {
        minPrice: filter.minPrice,
      });
    }
    if (filter.maxPrice) {
      query.andWhere('product.basePrice <= :maxPrice', {
        maxPrice: filter.maxPrice,
      });
    }
    if (filter.title) {
      query.andWhere('product.title ILIKE :title', {
        title: `%${filter.title}%`,
      });
    }
    if (filter.category) {
      query.andWhere('category.id = :categoryId', {
        categoryId: filter.category,
      });
      query.leftJoin(
        ProductCategoryOrder,
        'pco',
        'pco.productId = product.id AND pco.categoryId = :categoryId',
        { categoryId: filter.category },
      );
      query.addSelect('pco.orderInCategory');
    }
    if (filter.discount) {
      query.andWhere('discounts.id IS NOT NULL');
    }
    if (filter.text) {
      query.andWhere(
        '(product.title ILIKE :text OR product.description ILIKE :text)',
        { text: `%${filter.text}%` },
      );
    }

    if (filter.category) {
      query.orderBy('pco.orderInCategory', SortOrder.ASC, 'NULLS LAST');
      query.addOrderBy('product.id', SortOrder.ASC);
    } else {
      query.orderBy('product.id', SortOrder.ASC);
    }

    const [products, total] = await query
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    await this.loadChildrenByLevels(products);
    if (filter.category) {
      await this.attachOrderInCategory(products, Number(filter.category));
    }

    const productsWithPrice: ProductResponse[] = products
      .map((product) => this.enrichProductRec(product))
      .map(
        (p) =>
          this.attachDisplayPrice(
            p as unknown as {
              children?: ProductResponse[];
              netPrice?: number;
              displayPrice?: number;
            },
          ) as unknown as ProductResponse,
      );
    return {
      products: productsWithPrice,
      total,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async loadChildrenByLevels(
    roots: Product[],
    maxDepth = 6,
  ): Promise<void> {
    if (!roots || roots.length === 0 || maxDepth <= 0) return;

    for (const r of roots) r.children = [];

    let currentLevel = roots;
    let depth = 0;

    while (currentLevel.length > 0 && depth < maxDepth) {
      const parentIds = currentLevel
        .map((p) => p.id)
        .filter(Boolean) as number[];
      if (parentIds.length === 0) break;

      const children = await this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.parent', 'parent')
        .leftJoinAndSelect('product.taxes', 'taxes')
        .leftJoinAndSelect('product.discounts', 'discounts')
        .leftJoinAndSelect('product.categories', 'categories')
        .leftJoinAndSelect('product.store', 'store')
        .where('product.parent IN (:...parentIds)', { parentIds })
        .andWhere('product.enabled = true')
        .andWhere('(product.stock IS NULL OR product.stock > 0)')
        .orderBy('product.id', SortOrder.ASC)
        .getMany();

      if (children.length === 0) break;

      const grouped = new Map<number, Product[]>();
      for (const child of children) {
        const pid = (child.parent as Product)?.id as number;
        if (!grouped.has(pid)) grouped.set(pid, []);
        grouped.get(pid)!.push(child);
      }

      for (const parent of currentLevel) {
        parent.children = grouped.get(parent.id) || [];
      }

      currentLevel = children;
      depth += 1;
    }
  }

  private async attachOrderInCategory(
    products: Product[],
    categoryId: number | string,
  ): Promise<void> {
    if (!products || products.length === 0) return;
    const parsedCategoryId =
      typeof categoryId === 'string' ? parseInt(categoryId, 10) : categoryId;
    if (!parsedCategoryId || Number.isNaN(parsedCategoryId)) return;

    const productIds = products.map((product) => product.id);
    const orders = await this.productCategoryOrderRepository.find({
      where: {
        category: { id: parsedCategoryId },
        product: { id: In(productIds) },
      },
      relations: ['product'],
    });

    const orderMap = new Map<number, number>();
    for (const order of orders) {
      if (order.product?.id) {
        orderMap.set(order.product.id, order.orderInCategory);
      }
    }

    for (const product of products) {
      (product as Product & { orderInCategory?: number }).orderInCategory =
        orderMap.get(product.id);
    }
  }

  async findOne(id: number, storeId: string): Promise<ProductResponse> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const product = await this.productRepository.findOne({
      where: { id, enabled: true },
      relations: ['discounts', 'taxes', 'categories', 'store'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.store.id !== store.id) {
      throw new ForbiddenException('Product does not belong to this store');
    }

    await this.loadChildrenByLevels([product]);

    const enriched = this.enrichProductRec(product);
    return this.attachDisplayPrice(
      enriched as unknown as {
        children?: ProductResponse[];
        netPrice?: number;
        displayPrice?: number;
      },
    ) as unknown as ProductResponse;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    storeId: string,
    user: User,
  ): Promise<Product> {
    const store = await checkStoreAccess(this.storeRepository, storeId, user);
    const product = await this.productRepository.findOne({
      where: { id, enabled: true },
      relations: ['store'],
    });

    if (!product) {
      throw new NotFoundException('Product not found or is disabled');
    }

    if (product.store.id !== store.id) {
      throw new ForbiddenException('Product does not belong to this store');
    }

    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existing = await this.productRepository.findOne({
        where: {
          store: product.store,
          sku: updateProductDto.sku,
          enabled: true,
        },
      });
      if (existing && existing.id !== product.id) {
        throw new ConflictException('El SKU ya existe para esta tienda');
      }
    }

    if (Object.prototype.hasOwnProperty.call(updateProductDto, 'parentId')) {
      const newParentId = (
        updateProductDto as UpdateProductDto & { parentId?: number | null }
      ).parentId as number | null | undefined;
      if (newParentId === product.id) {
        throw new BadRequestException(
          'Un producto no puede ser padre de sí mismo',
        );
      }
      if (newParentId === null || newParentId === undefined) {
        product.parent = null;
      } else {
        const newParent = await this.productRepository.findOne({
          where: { id: newParentId, store: { id: storeId }, enabled: true },
        });
        if (!newParent) {
          throw new NotFoundException('Producto padre no encontrado');
        }
        product.parent = newParent;
      }
      const { parentId: _parentId, ...rest } =
        updateProductDto as UpdateProductDto & { parentId?: number | null };
      void _parentId;
      Object.assign(product, rest);
    } else {
      Object.assign(product, updateProductDto);
    }

    if (updateProductDto.taxIds !== undefined) {
      product.taxes = updateProductDto.taxIds.length
        ? await this.taxRepository.findBy({ id: In(updateProductDto.taxIds) })
        : [];
    }
    if (updateProductDto.discountIds !== undefined) {
      product.discounts = updateProductDto.discountIds.length
        ? await this.discountRepository.findBy({
            id: In(updateProductDto.discountIds),
          })
        : [];
    }
    if (updateProductDto.categoryIds !== undefined) {
      product.categories = updateProductDto.categoryIds.length
        ? await this.categoryRepository.findBy({
            id: In(updateProductDto.categoryIds),
          })
        : [];

      await this.syncProductCategoryOrders(
        product.id,
        updateProductDto.categoryIds,
        storeId,
      );
    }

    const savedProduct = await this.productRepository.save(product);

    const fullUpdated = await this.productRepository.findOne({
      where: { id: savedProduct.id },
      relations: ['taxes', 'discounts', 'categories', 'parent', 'children'],
    });

    return fullUpdated || savedProduct;
  }

  async remove(
    id: number,
    storeId: string,
    user: User,
  ): Promise<DeleteResult | Product> {
    const store = await checkStoreAccess(this.storeRepository, storeId, user);
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['store', 'children'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.store.id !== store.id) {
      throw new ForbiddenException('Product does not belong to this store');
    }

    const hasOrders = await this.hasAssociatedOrders(id);
    const children = await this.productRepository.find({
      where: { parent: { id } },
    });

    let childrenHaveOrders = false;
    if (children && children.length > 0) {
      for (const child of children) {
        const childHasOrders = await this.hasAssociatedOrders(child.id);
        if (childHasOrders) {
          childrenHaveOrders = true;
          break;
        }
      }
    }

    if (hasOrders || childrenHaveOrders) {
      product.enabled = false;

      if (children && children.length > 0) {
        for (const child of children) {
          child.enabled = false;
          await this.productRepository.save(child);
        }
      }

      const disabledProduct = await this.productRepository.save(product);
      return disabledProduct;
    }

    if (children && children.length > 0) {
      try {
        await Promise.all(
          children.map((child) => this.productRepository.delete(child.id)),
        );
      } catch (error) {
        throw new BadRequestException(
          `Error deleting child products: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    }

    return this.productRepository.delete(id);
  }

  /**
   * Calcula el desglose de precios incluyendo descuentos y tasas.
   * @param product Producto con impuestos y descuentos asociados.
   */
  public calculatePrices(product: Product): ProductPrices {
    const base = Number(product.basePrice);
    let discountPrice = 0;

    if (product.discounts && product.discounts.length > 0) {
      product.discounts.forEach((discount) => {
        const d = discount as Discount & {
          discountType?: DiscountType;
          type?: DiscountType;
          discountValue?: number;
          value?: number;
        };
        const discountType = d.discountType ?? d.type;
        const discountValue = d.discountValue ?? d.value;
        if (discountType === DiscountType.PERCENTAGE) {
          discountPrice += base * (Number(discountValue) / 100);
        } else if (discountType === DiscountType.FIXED) {
          discountPrice += Number(discountValue);
        }
      });
    }

    const priceAfterDiscount = Math.max(0, base - discountPrice);
    const totalTaxPercentage =
      product.taxes?.reduce((sum, tax) => sum + Number(tax.rate), 0) || 0;

    // Se calcula el impuesto sobre el precio neto (después de descuentos)
    const taxPrice = priceAfterDiscount * (totalTaxPercentage / 100);
    const totalPrice = priceAfterDiscount + taxPrice;

    // priceWithTax = precio de lista con impuesto (base + tax sobre base, SIN descuentos).
    // Se usa para mostrar el precio "original" tachado cuando hay descuento.
    // totalPrice = precio final (base - descuento + tax sobre neto). Es el que se cobra.
    const priceWithTax = base + (base * totalTaxPercentage) / 100;

    return {
      basePrice: base,
      discountPrice,
      netPrice: priceAfterDiscount,
      taxPrice,
      priceWithTax,
      totalPrice,
    };
  }

  private attachDisplayPrice<
    T extends {
      children?: ProductResponse[];
      netPrice?: number;
      displayPrice?: number;
    },
  >(node: T): T {
    if (node.children && node.children.length > 0) {
      node.children = node.children.map(
        (c) =>
          this.attachDisplayPrice(
            c as unknown as {
              children?: ProductResponse[];
              netPrice?: number;
              displayPrice?: number;
            },
          ) as unknown as ProductResponse,
      );
      const childPrices = node.children
        .map((c) => c.displayPrice)
        .filter((v) => typeof v === 'number');
      node.displayPrice = childPrices.length
        ? Math.min(...childPrices)
        : node.netPrice || 0;
    } else {
      node.displayPrice = node.netPrice || 0;
    }
    return node;
  }

  public calculateDisplayInfo(product: Product): ProductDisplayInfo {
    const isParentProduct = !!(product.children && product.children.length > 0);
    const hasStock = product.stock === null || product.stock > 0;
    const canAddToCart = !isParentProduct && hasStock;
    let firstImageUrl: string | null = null;
    if (product.images && product.images.length > 0) {
      firstImageUrl = product.images[0];
    }
    const displayPrice = product.basePrice || 0;
    return {
      isParentProduct,
      canAddToCart,
      hasStock,
      firstImageUrl,
      displayPrice,
    };
  }

  async searchGlobal(params: {
    query: string;
    limit: number;
    offset: number;
  }): Promise<PaginatedProductsResponse> {
    const { query: term, limit, offset } = params;

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.taxes', 'taxes')
      .leftJoinAndSelect('product.categories', 'category')
      .leftJoinAndSelect('product.discounts', 'discounts')
      .leftJoinAndSelect('product.store', 'store')
      .where('product.enabled = true')
      .andWhere('(product.stock IS NULL OR product.stock > 0)')
      .andWhere(
        '(product.title ILIKE :term OR product.description ILIKE :term OR product.sku ILIKE :term)',
        { term: `%${term}%` },
      )
      .orderBy('product.title', SortOrder.ASC)
      .take(limit)
      .skip(offset);

    const [products, total] = await query.getManyAndCount();

    const productsWithPrice: ProductResponse[] = products.map((product) => ({
      ...product,
      ...this.calculatePrices(product),
      ...this.calculateDisplayInfo(product),
    }));

    return {
      products: productsWithPrice,
      total,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findMostPopularByStore(
    storeId: number,
    limit = 10,
  ): Promise<ProductResponse[]> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId.toString() },
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.taxes', 'taxes')
      .leftJoinAndSelect('product.categories', 'category')
      .leftJoinAndSelect('product.discounts', 'discounts')
      .leftJoinAndSelect('product.store', 'store')
      .where('product.store = :storeId', { storeId: store.id })
      .andWhere('product.enabled = true')
      .andWhere('(product.stock IS NULL OR product.stock > 0)')
      .orderBy('product.soldCount', 'DESC')
      .take(limit)
      .getMany();

    return products.map((product) => ({
      ...product,
      ...this.calculatePrices(product),
      ...this.calculateDisplayInfo(product),
    }));
  }

  async getMinMaxPrices(storeId: string) {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const result = await this.productRepository
      .createQueryBuilder('product')
      .select('MIN(product.basePrice)', 'minPrice')
      .addSelect('MAX(product.basePrice)', 'maxPrice')
      .where('product.store = :storeId', { storeId })
      .andWhere('product.enabled = true')
      .getRawOne();

    return {
      minPrice: parseFloat(result.minPrice) || 0,
      maxPrice: parseFloat(result.maxPrice) || 0,
    };
  }

  async getAllProducts(storeId: string): Promise<Product[]> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return this.productRepository.find({
      where: { store: { id: storeId }, enabled: true },
      relations: ['taxes', 'discounts', 'categories', 'children'],
      order: { id: SortOrder.ASC },
    });
  }

  private async hasAssociatedOrders(productId: number): Promise<boolean> {
    const orderCount = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.items', 'orderItem')
      .where("(orderItem.product ->> 'id')::int = :productId", { productId })
      .getCount();

    return orderCount > 0;
  }

  private enrichProductRec(product: Product): ProductResponse {
    const current: ProductResponse = {
      ...product,
      ...this.calculatePrices(product),
      ...this.calculateDisplayInfo(product),
    };
    if (product.children && product.children.length > 0) {
      current.children = product.children.map((child) =>
        this.enrichProductRec(child),
      );
    }
    return current;
  }

  private async syncProductCategoryOrders(
    productId: number,
    categoryIds: number[],
    storeId: string,
  ): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id: productId, store: { id: storeId } },
    });
    if (!product) return;

    const existingOrders = await this.productCategoryOrderRepository.find({
      where: { product: { id: productId } },
      relations: ['category'],
    });

    const existingCategoryIds = existingOrders.map((o) => o.category.id);

    const toRemove = existingOrders.filter(
      (o) => !categoryIds.includes(o.category.id),
    );
    if (toRemove.length > 0) {
      await this.productCategoryOrderRepository.remove(toRemove);
    }

    const toAdd = categoryIds.filter(
      (cId) => !existingCategoryIds.includes(cId),
    );
    for (const categoryId of toAdd) {
      const category = await this.categoryRepository.findOne({
        where: { id: categoryId },
      });
      if (category) {
        const maxOrder = await this.productCategoryOrderRepository
          .createQueryBuilder('pco')
          .where('pco.categoryId = :categoryId', { categoryId })
          .select('MAX(pco.orderInCategory)', 'max')
          .getRawOne();

        const newOrder = this.productCategoryOrderRepository.create({
          product,
          category,
          orderInCategory: (maxOrder?.max || 0) + 1,
        });
        await this.productCategoryOrderRepository.save(newOrder);
      }
    }
  }
}
