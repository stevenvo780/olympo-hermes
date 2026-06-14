import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductStockService } from './product-stock.service';
import { ProductStockController } from './product-stock.controller';
import { Product } from '../../entities/product.entity';
import { Store } from '@/store/entities/store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Store])],
  controllers: [ProductStockController],
  providers: [ProductStockService],
  exports: [ProductStockService],
})
export class ProductStockModule {}
