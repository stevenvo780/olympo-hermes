import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryZoneService } from './delivery-zone.service';
import { DeliveryZoneController } from './delivery-zone.controller';
import { DeliveryZone } from './entities/delivery-zone.entity';
import { Store } from '../store/entities/store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryZone, Store])],
  controllers: [DeliveryZoneController],
  providers: [DeliveryZoneService],
  exports: [DeliveryZoneService],
})
export class DeliveryZoneModule {}
