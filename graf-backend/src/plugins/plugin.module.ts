import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule as EnvConfigModule } from '@nestjs/config';
import { PluginService } from './plugin.service';
import { UniversalEventService } from './universal-event.service';
import { ConfigModule } from '../config/config.module';
import { UserModule } from 'src/user/user.module';
import { PluginController } from './plugin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from 'src/store/entities/store.entity';
import { Order } from 'src/order/entities/order.entity';
import { User } from 'src/user/entities/user.entity';
import { OrderItem } from 'src/order/entities/order-item.entity';
import { Product } from 'src/product/entities/product.entity';

@Module({
  imports: [
    HttpModule,
    EnvConfigModule,
    ConfigModule,
    UserModule,
    TypeOrmModule.forFeature([Store, Order, User, OrderItem, Product]),
  ],
  providers: [PluginService, UniversalEventService],
  controllers: [PluginController],
  exports: [PluginService, UniversalEventService],
})
export class PluginModule {}
