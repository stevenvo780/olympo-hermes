import {
  Controller,
  UseGuards,
  Post,
  Get,
  Body,
  Req,
  Patch,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CredentialsService } from './credentials.service';
import { CreateCredentialsDto } from './dto/create-credentials.dto';
import { UpdateCredentialsDto } from './dto/update-credentials.dto';
import { RequestWithUser } from '../auth/types';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/user/entities/user.entity';

@ApiTags('credentials')
@Controller('credentials/wompi/:storeId')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class CredentialsController {
  constructor(private readonly service: CredentialsService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiBearerAuth()
  @Post()
  create(
    @Param('storeId') storeId: string,
    @Req() req: RequestWithUser,
    @Body() dto: CreateCredentialsDto,
  ) {
    return this.service.setCredentials(storeId, req.user, dto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiBearerAuth()
  @Get()
  get(@Param('storeId') storeId: string, @Req() req: RequestWithUser) {
    return this.service.getCredentials(storeId, req.user);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiBearerAuth()
  @Patch()
  update(
    @Param('storeId') storeId: string,
    @Req() req: RequestWithUser,
    @Body() dto: UpdateCredentialsDto,
  ) {
    return this.service.updateCredentials(storeId, req.user, dto);
  }
}
