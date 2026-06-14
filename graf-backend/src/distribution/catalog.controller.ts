import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DistOrderService } from './dist-order.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RequestWithUser } from '../auth/types';
import { UserRole } from '../user/entities/user.entity';

@ApiTags('distribution/products')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
@Controller('distribution/products')
export class CatalogController {
  constructor(private readonly service: DistOrderService) {}

  @Get()
  @ApiOperation({ summary: 'Catálogo de productos para el carrito' })
  list(@Query('storeId') storeId: string, @Request() req: RequestWithUser) {
    return this.service.listProducts(storeId, req.user);
  }
}
