import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DeliveryZoneService } from './delivery-zone.service';
import { CreateDeliveryZoneDto } from './dto/create-delivery-zone.dto';
import { UpdateDeliveryZoneDto } from './dto/update-delivery-zone.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { DeliveryZone } from './entities/delivery-zone.entity';
import { RequestWithUser } from '../auth/types';

@ApiTags('delivery-zones')
@Controller('delivery-zones')
export class DeliveryZoneController {
  constructor(private readonly deliveryZoneService: DeliveryZoneService) {}

  @Post(':storeId')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva zona de entrega' })
  @ApiCreatedResponse({
    description: 'Zona de entrega creada exitosamente',
    type: DeliveryZone,
  })
  create(
    @Param('storeId') storeId: string,
    @Body() createDeliveryZoneDto: CreateDeliveryZoneDto,
    @Request() req: RequestWithUser,
  ) {
    return this.deliveryZoneService.create(
      storeId,
      req.user,
      createDeliveryZoneDto,
    );
  }

  @Get(':storeId')
  @ApiOperation({ summary: 'Obtener todas las zonas de entrega de una tienda' })
  @ApiOkResponse({
    description: 'Zonas de entrega recuperadas exitosamente',
    type: [DeliveryZone],
  })
  findAll(@Param('storeId') storeId: string) {
    return this.deliveryZoneService.findAllByStore(storeId);
  }

  @Get('single/:id')
  @ApiOperation({ summary: 'Obtener una zona de entrega específica' })
  @ApiOkResponse({
    description: 'Zona de entrega recuperada exitosamente',
    type: DeliveryZone,
  })
  findOne(@Param('id') id: number) {
    return this.deliveryZoneService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar una zona de entrega' })
  @ApiOkResponse({
    description: 'Zona de entrega actualizada exitosamente',
    type: DeliveryZone,
  })
  update(
    @Param('id') id: number,
    @Body() updateDeliveryZoneDto: UpdateDeliveryZoneDto,
    @Request() req: RequestWithUser,
  ) {
    return this.deliveryZoneService.update(id, req.user, updateDeliveryZoneDto);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una zona de entrega' })
  @ApiOkResponse({
    description: 'Zona de entrega eliminada exitosamente',
  })
  remove(@Param('id') id: number, @Request() req: RequestWithUser) {
    return this.deliveryZoneService.remove(id, req.user);
  }
}
