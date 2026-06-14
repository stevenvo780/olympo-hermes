import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Store } from '../store/entities/store.entity';
import { User } from '../user/entities/user.entity';
import { Product } from '../product/entities/product.entity';
import { DeliveryZone } from '../delivery-zone/entities/delivery-zone.entity';
import { Tax } from '../tax/entities/tax.entity';
import { DeliveryZoneModule } from '../delivery-zone/delivery-zone.module';
import { ProductModule } from '../product/product.module';
import { ProductCoreModule } from '../product/modules/core/product-core.module';
import { PluginModule } from '../plugins/plugin.module';
import { ConfigModule as AppConfigModule } from '../config/config.module';
import { CustomerModule } from '../customer/customer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Store,
      User,
      Product,
      DeliveryZone,
      Tax,
    ]),
    DeliveryZoneModule,
    ProductModule,
    ProductCoreModule,
    HttpModule,
    ConfigModule,
    PluginModule,
    AppConfigModule,
    CustomerModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
