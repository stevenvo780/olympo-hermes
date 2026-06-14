import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DistOrderService, FindOrdersFilter } from './dist-order.service';
import { ExportService } from './export.service';
import { DistOrderStatus } from '../order/entities/order.entity';
import {
  AssignRouteDto,
  CreateDistOrderDto,
  SetRouteDateDto,
  TransitionOrderDto,
  UpdateOrderItemsDto,
} from './dto/order.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RequestWithUser } from '../auth/types';
import { UserRole } from '../user/entities/user.entity';

@ApiTags('distribution/orders')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
@Controller('distribution/orders')
export class DistOrderController {
  constructor(
    private readonly service: DistOrderService,
    private readonly exportService: ExportService,
  ) {}

  private buildFilter(q: Record<string, string | undefined>): FindOrdersFilter {
    return {
      sellerId: q.sellerId ? +q.sellerId : undefined,
      deliveryZoneId: q.deliveryZoneId ? +q.deliveryZoneId : undefined,
      status: q.status as DistOrderStatus | undefined,
      startDate: q.startDate,
      endDate: q.endDate,
      routeStartDate: q.routeStartDate,
      routeEndDate: q.routeEndDate,
      search: q.search,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar/filtrar pedidos (vendedor/zona/estado/fecha)' })
  findAll(
    @Query('storeId') storeId: string,
    @Request() req: RequestWithUser,
    @Query() q: Record<string, string>,
  ) {
    return this.service.findAll(storeId, req.user, this.buildFilter(q));
  }

  @Get('routing')
  @ApiOperation({ summary: 'Clasificar pedidos pendientes por ruta/zona' })
  routing(
    @Query('storeId') storeId: string,
    @Request() req: RequestWithUser,
    @Query() q: Record<string, string>,
  ) {
    return this.service.routing(storeId, req.user, this.buildFilter(q));
  }

  @Post('routing/assign')
  @ApiOperation({ summary: 'Enrutar (asignar ruta/día) a varios pedidos' })
  assignRoute(
    @Query('storeId') storeId: string,
    @Body() dto: AssignRouteDto,
    @Request() req: RequestWithUser,
  ) {
    return this.service.assignRoute(storeId, req.user, dto);
  }

  @Get('export')
  @ApiOperation({ summary: 'Exportar consolidado (xlsx): hoja Consolidado + Rutas' })
  async export(
    @Res() res: Response,
    @Query('storeId') storeId: string,
    @Request() req: RequestWithUser,
    @Query() q: Record<string, string>,
  ): Promise<void> {
    const buffer = await this.exportService.buildConsolidated(
      storeId,
      req.user,
      this.buildFilter(q),
    );
    const filename = `consolidado-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Post()
  @ApiOperation({ summary: 'Alta de pedido (carrito del vendedor)' })
  create(
    @Query('storeId') storeId: string,
    @Body() dto: CreateDistOrderDto,
    @Request() req: RequestWithUser,
  ) {
    return this.service.create(storeId ?? dto.storeId, req.user, dto);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('storeId') storeId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.service.getOrder(+id, storeId, req.user);
  }

  @Get(':id/inventory')
  @ApiOperation({ summary: 'Disponibilidad de inventario del pedido (D3)' })
  inventory(
    @Param('id') id: string,
    @Query('storeId') storeId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.service.getInventory(+id, storeId, req.user);
  }

  @Patch(':id/items')
  @ApiOperation({ summary: 'Editar unidades del pedido' })
  updateItems(
    @Param('id') id: string,
    @Query('storeId') storeId: string,
    @Body() dto: UpdateOrderItemsDto,
    @Request() req: RequestWithUser,
  ) {
    return this.service.updateItems(+id, storeId, req.user, dto);
  }

  @Patch(':id/route-date')
  @ApiOperation({ summary: 'Mover el pedido de un día a otro (corte semanal)' })
  setRouteDate(
    @Param('id') id: string,
    @Query('storeId') storeId: string,
    @Body() dto: SetRouteDateDto,
    @Request() req: RequestWithUser,
  ) {
    return this.service.setRouteDate(
      +id,
      storeId,
      req.user,
      dto.routeDate ?? null,
    );
  }

  @Post(':id/transition')
  @ApiOperation({ summary: 'Transición de estado (máquina de estados)' })
  transition(
    @Param('id') id: string,
    @Query('storeId') storeId: string,
    @Body() dto: TransitionOrderDto,
    @Request() req: RequestWithUser,
  ) {
    return this.service.transition(+id, storeId, req.user, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Anular pedido' })
  cancel(
    @Param('id') id: string,
    @Query('storeId') storeId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.service.cancel(+id, storeId, req.user);
  }
}
