import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomPaymentsService } from './custom-payments.service';
import { CustomPaymentsController } from './custom-payments.controller';
import { PaymentCredentials } from '../credentials/entities/payment-credentials.entity';
import { PaymentLinkMapping } from '../wompi/entities/payment-link.entity';
import { UserModule } from '../user/user.module';
import { CredentialsModule } from '../credentials/credentials.module';
import { WompiModule } from '../wompi/wompi.module';
import { OrderModule } from '../order/order.module';
import { ConfigModule as AppConfigModule } from '../config/config.module';
import { PluginModule } from '../plugins/plugin.module';
import { Store } from 'src/store/entities/store.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentCredentials, PaymentLinkMapping, Store]),
    forwardRef(() => UserModule),
    forwardRef(() => CredentialsModule),
    forwardRef(() => WompiModule),
    forwardRef(() => OrderModule),
    AppConfigModule,
    PluginModule,
  ],
  controllers: [CustomPaymentsController],
  providers: [CustomPaymentsService],
  exports: [CustomPaymentsService],
})
export class CustomPaymentsModule {}
