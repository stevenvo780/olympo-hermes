import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCategoryOrderService } from './product-category-order.service';
import { ProductCategoryOrderController } from './product-category-order.controller';
import { Product } from '../../entities/product.entity';
import { ProductCategoryOrder } from '../../entities/product-category-order.entity';
import { Category } from '@/category/entities/category.entity';
import { Store } from '@/store/entities/store.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductCategoryOrder, Category, Store]),
  ],
  controllers: [ProductCategoryOrderController],
  providers: [ProductCategoryOrderService],
  exports: [ProductCategoryOrderService],
})
export class ProductCategoryOrderModule {}
