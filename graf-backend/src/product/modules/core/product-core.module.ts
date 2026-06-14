import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCoreService } from './product-core.service';
import { Product } from '../../entities/product.entity';
import { ProductCategoryOrder } from '../../entities/product-category-order.entity';
import { Store } from '@/store/entities/store.entity';
import { Tax } from '@/tax/entities/tax.entity';
import { Discount } from '@/discount/entities/discount.entity';
import { Category } from '@/category/entities/category.entity';
import { Order } from '@/order/entities/order.entity';
import { ProductCoreController } from './product-core.controller';
import { ProductSearchController } from './product-search.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductCategoryOrder,
      Store,
      Tax,
      Discount,
      Category,
      Order,
    ]),
  ],
  controllers: [ProductCoreController, ProductSearchController],
  providers: [ProductCoreService],
  exports: [ProductCoreService],
})
export class ProductCoreModule {}
