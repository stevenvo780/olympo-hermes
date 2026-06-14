import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DistCustomerService } from './dist-customer.service';
import {
  AddressDto,
  CreateDistCustomerDto,
  UpdateDistCustomerDto,
} from './dto/customer.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RequestWithUser } from '../auth/types';
import { UserRole } from '../user/entities/user.entity';

@ApiTags('distribution/customers')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
@Controller('distribution/customers')
export class DistCustomerController {
  constructor(private readonly service: DistCustomerService) {}

  @Get()
  @ApiOperation({ summary: 'Listar clientes (con direcciones y zona)' })
  findAll(
    @Query('storeId') storeId: string,
    @Request() req: RequestWithUser,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(storeId, req.user, search);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('storeId') storeId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.service.findOne(+id, storeId, req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Crear cliente (admite direcciones iniciales)' })
  create(
    @Query('storeId') storeId: string,
    @Body() dto: CreateDistCustomerDto,
    @Request() req: RequestWithUser,
  ) {
    return this.service.create(storeId ?? dto.storeId, req.user, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Query('storeId') storeId: string,
    @Body() dto: UpdateDistCustomerDto,
    @Request() req: RequestWithUser,
  ) {
    return this.service.update(+id, storeId, req.user, dto);
  }

  // --- Addresses (sedes) ---

  @Post(':id/addresses')
  @ApiOperation({ summary: 'Agregar dirección/sede a un cliente' })
  addAddress(
    @Param('id') id: string,
    @Query('storeId') storeId: string,
    @Body() dto: AddressDto,
    @Request() req: RequestWithUser,
  ) {
    return this.service.addAddress(+id, storeId, req.user, dto);
  }

  @Patch('addresses/:addressId')
  updateAddress(
    @Param('addressId') addressId: string,
    @Query('storeId') storeId: string,
    @Body() dto: Partial<AddressDto>,
    @Request() req: RequestWithUser,
  ) {
    return this.service.updateAddress(+addressId, storeId, req.user, dto);
  }

  @Delete('addresses/:addressId')
  removeAddress(
    @Param('addressId') addressId: string,
    @Query('storeId') storeId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.service.removeAddress(+addressId, storeId, req.user);
  }
}
