import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { Customer } from './entities/customer.entity';
import { Store } from '../store/entities/store.entity';
import { PluginModule } from '../plugins/plugin.module';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Store]), PluginModule],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
