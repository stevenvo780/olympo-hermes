import {
  Module,
  NestModule,
  MiddlewareConsumer,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerMiddleware } from './logger.middleware';
import AppProvider from './app.provider';
import { typeOrmConfig } from './utils/typeorm.config';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { CategoryModule } from './category/category.module';
import { ConfigModule as ConfigurationModule } from './config/config.module';
import { DiscountModule } from './discount/discount.module';
import { OrderModule } from './order/order.module';
import { ProductModule } from './product/product.module';
import { TaxModule } from './tax/tax.module';
import { StoreModule } from './store/store.module';
import { StatisticsModule } from './statistics/statistics.module';
import { WompiModule } from './wompi/wompi.module';
import { DeliveryZoneModule } from './delivery-zone/delivery-zone.module';
import { CustomPaymentsModule } from './custom-payments/custom-payments.module';
import { CredentialsModule } from './credentials/credentials.module';
import { FirebaseModule } from './firebase/firebase.module';
import { CustomerModule } from './customer/customer.module';
import { InventoryModule } from './inventory/inventory.module';
import { UserModule } from './user/user.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { DistributionModule } from './distribution/distribution.module';
import { PrizmaModule } from './prizma/prizma.module';
import { TtlCleanupModule } from './ttl-cleanup/ttl-cleanup.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ...(process.env.DB_HOST
      ? [TypeOrmModule.forRoot(typeOrmConfig), TtlCleanupModule]
      : []),
    PrizmaModule,
    AuthModule,
    ProfileModule,
    CategoryModule,
    ConfigModule,
    DiscountModule,
    OrderModule,
    ProductModule,
    TaxModule,
    StoreModule,
    StatisticsModule,
    WompiModule,
    DeliveryZoneModule,
    ConfigurationModule,
    CustomPaymentsModule,
    CredentialsModule,
    FirebaseModule,
    CustomerModule,
    InventoryModule,
    UserModule,
    IntegrationsModule,
    DistributionModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppProvider],
})
export class AppModule implements NestModule, OnModuleDestroy {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
  async onModuleDestroy() {
    await AppProvider.closeConnection();
  }
}
