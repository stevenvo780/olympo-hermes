import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WompiService } from './wompi.service';
import { WompiController } from './wompi.controller';
import { StoreModule } from '../store/store.module';
import { PaymentLinkMapping } from './entities/payment-link.entity';
import { UserModule } from '../user/user.module';
import { PaymentSource } from './entities/payment-source.entity';
import { PendingWompiSubscription } from './entities/pending-wompi-subscription.entity';
import { GiftCoupon } from '../gift-coupon/entities/gift-coupon.entity';
import { OrderModule } from '../order/order.module';
import { PluginModule } from '../plugins/plugin.module';

@Module({
  imports: [
    HttpModule,
    StoreModule,
    forwardRef(() => UserModule),
    forwardRef(() => OrderModule),
    PluginModule,
    TypeOrmModule.forFeature([
      PaymentLinkMapping,
      PaymentSource,
      PendingWompiSubscription,
      GiftCoupon,
    ]),
  ],
  providers: [WompiService],
  controllers: [WompiController],
  exports: [WompiService],
})
export class WompiModule {}
