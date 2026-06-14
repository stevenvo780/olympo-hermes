import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductExcelService } from './product-excel.service';
import { ProductExcelController } from './product-excel.controller';
import { Product } from '../../entities/product.entity';
import { Store } from '@/store/entities/store.entity';
import { Tax } from '@/tax/entities/tax.entity';
import { Discount } from '@/discount/entities/discount.entity';
import { Category } from '@/category/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Store, Tax, Discount, Category]),
  ],
  controllers: [ProductExcelController],
  providers: [ProductExcelService],
  exports: [ProductExcelService],
})
export class ProductExcelModule {}
