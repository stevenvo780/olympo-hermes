import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { IntegrationsController } from './integrations.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [HttpModule, ConfigModule, UserModule],
  controllers: [IntegrationsController],
})
export class IntegrationsModule {}
