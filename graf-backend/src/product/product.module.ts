import { Module } from '@nestjs/common';
import { ProductCoreModule } from './modules/core/product-core.module';
import { ProductExcelModule } from './modules/excel/product-excel.module';
import { ProductStockModule } from './modules/stock/product-stock.module';
import { ProductCategoryOrderModule } from './modules/category-order/product-category-order.module';

@Module({
  imports: [
    ProductCoreModule,
    ProductExcelModule,
    ProductStockModule,
    ProductCategoryOrderModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class ProductModule {}
