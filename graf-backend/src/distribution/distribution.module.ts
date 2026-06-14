import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Seller } from './entities/seller.entity';
import { CustomerAddress } from './entities/customer-address.entity';
import { Order } from '../order/entities/order.entity';
import { OrderItem } from '../order/entities/order-item.entity';
import { Product } from '../product/entities/product.entity';
import { Customer } from '../customer/entities/customer.entity';
import { DeliveryZone } from '../delivery-zone/entities/delivery-zone.entity';
import { Store } from '../store/entities/store.entity';
import { User } from '../user/entities/user.entity';
import { ProductStockModule } from '../product/modules/stock/product-stock.module';
import { DistAccessService } from './dist-access.service';
import { SellerService } from './seller.service';
import { ZoneService } from './zone.service';
import { DistCustomerService } from './dist-customer.service';
import { DistOrderService } from './dist-order.service';
import { ExportService } from './export.service';
import { SellerController } from './seller.controller';
import { ZoneController } from './zone.controller';
import { DistCustomerController } from './dist-customer.controller';
import { DistOrderController } from './dist-order.controller';
import { CatalogController } from './catalog.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Seller,
      CustomerAddress,
      Order,
      OrderItem,
      Product,
      Customer,
      DeliveryZone,
      Store,
      // User repo is required so FirebaseAuthGuard can resolve the caller.
      User,
    ]),
    // Inventory: "accept order = there is inventory" (D3).
    ProductStockModule,
  ],
  controllers: [
    SellerController,
    ZoneController,
    DistCustomerController,
    DistOrderController,
    CatalogController,
  ],
  providers: [
    DistAccessService,
    SellerService,
    ZoneService,
    DistCustomerService,
    DistOrderService,
    ExportService,
  ],
  exports: [
    SellerService,
    ZoneService,
    DistCustomerService,
    DistOrderService,
    ExportService,
  ],
})
export class DistributionModule {}
