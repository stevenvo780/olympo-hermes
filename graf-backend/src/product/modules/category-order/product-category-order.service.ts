import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { ProductCategoryOrder } from '../../entities/product-category-order.entity';
import { Category } from '@/category/entities/category.entity';
import { Store } from '@/store/entities/store.entity';
import { User } from '@/user/entities/user.entity';
import { SortOrder } from '@/user/dto/find-users.dto';

@Injectable()
export class ProductCategoryOrderService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductCategoryOrder)
    private readonly productCategoryOrderRepository: Repository<ProductCategoryOrder>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async updateProductCategoryOrder(
    productId: number,
    categoryId: number,
    newOrder: number,
    storeId: string,
    _user: User,
  ): Promise<ProductCategoryOrder> {
    return this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id: productId, store: { id: storeId }, enabled: true },
        relations: ['categories'],
      });
      if (!product) {
        throw new NotFoundException('Producto no encontrado');
      }

      const category = await manager.findOne(Category, {
        where: { id: categoryId, store: { id: storeId } },
      });
      if (!category) {
        throw new NotFoundException('Categoría no encontrada');
      }

      const belongsToCategory = product.categories?.some(
        (c) => c.id === categoryId,
      );
      if (!belongsToCategory) {
        throw new NotFoundException(
          'El producto no pertenece a esta categoría',
        );
      }

      const allOrdersInCategory = await manager.find(ProductCategoryOrder, {
        where: { category: { id: categoryId } },
        relations: ['product'],
        order: { orderInCategory: SortOrder.ASC },
      });

      const enabledOrders = allOrdersInCategory.filter(
        (o) => o.product && o.product.enabled !== false,
      );

      let currentOrder = enabledOrders.find((o) => o.product.id === productId);

      if (!currentOrder) {
        currentOrder = manager.create(ProductCategoryOrder, {
          product,
          category,
          orderInCategory:
            enabledOrders.length > 0
              ? Math.max(...enabledOrders.map((o) => o.orderInCategory)) + 1
              : 1,
        });
        await manager.save(ProductCategoryOrder, currentOrder);
        enabledOrders.push(currentOrder);
      }

      const oldIndex = enabledOrders.findIndex(
        (o) => o.product.id === productId,
      );
      const targetPosition = Math.max(
        1,
        Math.min(newOrder, enabledOrders.length),
      );
      const newIndex = targetPosition - 1;

      if (oldIndex === newIndex) {
        return currentOrder;
      }

      const movedOrder = enabledOrders[oldIndex];
      enabledOrders.splice(oldIndex, 1);
      enabledOrders.splice(newIndex, 0, movedOrder);

      const updatePromises = enabledOrders.map((order, index) =>
        manager.update(ProductCategoryOrder, order.id, {
          orderInCategory: index + 1,
        }),
      );
      await Promise.all(updatePromises);

      return manager.findOne(ProductCategoryOrder, {
        where: { id: currentOrder.id },
        relations: ['product', 'category'],
      }) as Promise<ProductCategoryOrder>;
    });
  }

  async getProductCategoryOrders(
    categoryId: number,
    storeId: string,
  ): Promise<ProductCategoryOrder[]> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, store: { id: storeId } },
    });
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return this.productCategoryOrderRepository.find({
      where: { category: { id: categoryId } },
      relations: ['product'],
      order: { orderInCategory: SortOrder.ASC },
    });
  }

  async syncProductCategoryOrders(
    productId: number,
    categoryIds: number[],
    storeId: string,
  ): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id: productId, store: { id: storeId } },
      });
      if (!product) return;

      const existingOrders = await manager.find(ProductCategoryOrder, {
        where: { product: { id: productId } },
        relations: ['category'],
      });

      const existingCategoryIds = existingOrders.map((o) => o.category.id);

      const toRemove = existingOrders.filter(
        (o) => !categoryIds.includes(o.category.id),
      );
      if (toRemove.length > 0) {
        await manager.remove(ProductCategoryOrder, toRemove);
      }

      const toAdd = categoryIds.filter(
        (cId) => !existingCategoryIds.includes(cId),
      );
      for (const categoryId of toAdd) {
        const category = await manager.findOne(Category, {
          where: { id: categoryId },
        });
        if (category) {
          const maxOrder = await manager
            .createQueryBuilder(ProductCategoryOrder, 'pco')
            .where('pco.categoryId = :categoryId', { categoryId })
            .select('MAX(pco.orderInCategory)', 'max')
            .getRawOne();

          const newOrder = manager.create(ProductCategoryOrder, {
            product,
            category,
            orderInCategory: (maxOrder?.max || 0) + 1,
          });
          await manager.save(ProductCategoryOrder, newOrder);
        }
      }
    });
  }
}
