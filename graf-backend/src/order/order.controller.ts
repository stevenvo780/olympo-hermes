import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Request,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrderService } from './order.service';
import { Order, OrderStatus } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { FirebaseAuthGuard } from '@/auth/firebase-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { Roles } from '@/auth/roles.decorator';
import { UserRole, User } from '@/user/entities/user.entity';
import { RequestWithUser } from '@/auth/types';
import { OptionalFirebaseAuthGuard } from '@/auth/optional-firebase-auth.guard';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(OptionalFirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva orden (con o sin autenticación)' })
  @ApiCreatedResponse({ type: Order })
  create(
    @Request() req: RequestWithUser,
    @Body() dto: CreateOrderDto,
  ): Promise<Order> {
    return this.orderService.createOrder(req.user as User | undefined, dto);
  }

  @Get('my')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Listar órdenes del cliente autenticado' })
  @ApiOkResponse({ type: [Order] })
  findMyOrders(
    @Request() req: RequestWithUser,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ): Promise<{ data: Order[]; total: number }> {
    const _page = parseInt(page);
    const _limit = parseInt(limit);
    return this.orderService.findOrdersByCustomer(req.user, {
      page: _page,
      limit: _limit,
    });
  }

  @Get('store/:storeId/customers')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Listar clientes de la tienda' })
  @ApiOkResponse({ type: [User] })
  async findStoreCustomers(
    @Param('storeId') storeId: string,
    @Request() req: RequestWithUser,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ customers: User[]; total: number }> {
    const _page = parseInt(page);
    const _limit = parseInt(limit);
    return this.orderService.findStoreCustomers(storeId, req.user as User, {
      page: _page,
      limit: _limit,
      search,
      startDate,
      endDate,
    }) as unknown as { customers: User[]; total: number };
  }

  @Get('store/:storeId/customers/export')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Exportar clientes de la tienda a Excel' })
  async exportStoreCustomers(
    @Param('storeId') storeId: string,
    @Request() req: RequestWithUser,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ): Promise<void> {
    const _limit = limit ? Math.min(parseInt(limit), 20000) : 20000;
    const buffer = await this.orderService.exportCustomersToExcel(
      storeId,
      req.user as User,
      {
        startDate,
        endDate,
        search,
        limit: _limit,
      },
    );

    const filename = `customers-${storeId}-${
      new Date().toISOString().split('T')[0]
    }.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @Get('store/:storeId')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiOperation({
    summary:
      'Listar órdenes de la tienda consultada del owner o empleado autenticado',
  })
  @ApiOkResponse({ type: [Order] })
  findStoreOrders(
    @Param('storeId') storeId: string,
    @Request() req: RequestWithUser,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
    @Query('status') status?: OrderStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<Order[]> {
    const _page = parseInt(page);
    const _limit = parseInt(limit);
    return this.orderService.findOrdersByStore(storeId, req.user as User, {
      page: _page,
      limit: _limit,
      search,
      status,
      startDate,
      endDate,
    });
  }

  @Get('store/:storeId/export')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Exportar órdenes de la tienda a Excel' })
  async exportStoreOrders(
    @Param('storeId') storeId: string,
    @Request() req: RequestWithUser,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: OrderStatus,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ): Promise<void> {
    const _limit = limit ? Math.min(parseInt(limit), 20000) : 20000;
    const buffer = await this.orderService.exportOrdersToExcel(
      storeId,
      req.user as User,
      {
        startDate,
        endDate,
        status,
        search,
        limit: _limit,
      },
    );

    const filename = `orders-${storeId}-${
      new Date().toISOString().split('T')[0]
    }.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una orden por ID' })
  @ApiOkResponse({ type: Order })
  findOne(@Param('id') id: string): Promise<Order> {
    return this.orderService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar el estado de una orden' })
  @ApiOkResponse({ type: Order })
  update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
  ): Promise<Order> {
    return this.orderService.updateOrder(+id, dto, req.user as User);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una orden' })
  @ApiOkResponse({ description: 'Orden eliminada' })
  remove(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.orderService.removeOrder(+id, req.user as User);
  }

  @ApiOperation({ summary: 'Validar pedido y calcular precios reales' })
  @Post('validate')
  async validateOrder(@Body() dto: CreateOrderDto): Promise<{
    items: {
      productId: number;
      quantity: number;
      basePrice: number;
      unitPrice: number;
      finalPrice: number;
      totalPrice: number;
    }[];
    subTotal: number;
    discountTotal: number;
    taxTotal: number;
    delivery?: number;
    total: number;
  }> {
    return this.orderService.validateOrder(dto);
  }
}
