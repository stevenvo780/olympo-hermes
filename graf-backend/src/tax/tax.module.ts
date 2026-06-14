import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxService } from './tax.service';
import { TaxController } from './tax.controller';
import { Tax } from './entities/tax.entity';
import { Store } from '../store/entities/store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tax, Store])],
  controllers: [TaxController],
  providers: [TaxService],
})
export class TaxModule {}
