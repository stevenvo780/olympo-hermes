import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ImportCustomerExcelDto } from './dto/import-customer-excel.dto';
import { Customer } from './entities/customer.entity';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@ApiTags('customers')
@Controller('customer')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  @ApiCreatedResponse({ type: Customer })
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.create(createCustomerDto);
  }

  @Get('store/:storeId')
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Listar clientes de una tienda' })
  @ApiOkResponse({ type: [Customer] })
  findByStore(
    @Param('storeId') storeId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ): Promise<Customer[]> {
    const _page = parseInt(page);
    const _limit = parseInt(limit);
    return this.customerService.findByStore(storeId, {
      page: _page,
      limit: _limit,
    });
  }

  @Get('store/:storeId/export')
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Exportar clientes de una tienda para Excel' })
  @ApiOkResponse({ type: [Customer] })
  exportCustomers(
    @Param('storeId') storeId: string,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<Customer[]> {
    const include = includeInactive === 'true';
    return this.customerService.exportCustomers(storeId, include);
  }

  @Post('store/:storeId/import')
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Importar clientes desde Excel' })
  @ApiCreatedResponse({
    description: 'Resultado de la importación',
    schema: {
      type: 'object',
      properties: {
        created: { type: 'number' },
        updated: { type: 'number' },
        deleted: { type: 'number' },
        skipped: { type: 'number' },
        failed: { type: 'number' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              email: { type: 'string' },
              status: { type: 'string' },
              message: { type: 'string' },
              name: { type: 'string' },
            },
          },
        },
      },
    },
  })
  importCustomers(
    @Param('storeId') storeId: string,
    @Body() dto: ImportCustomerExcelDto,
  ) {
    return this.customerService.importCustomersFromExcel(dto, storeId);
  }

  @Get('store/:storeId/stats')
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiOperation({
    summary: 'Obtener estadísticas globales de clientes de una tienda',
  })
  @ApiOkResponse({ type: Object })
  getStoreStats(@Param('storeId') storeId: string) {
    return this.customerService.getStoreStats(storeId);
  }

  @Post('recalculate-stats/:storeId')
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiOperation({
    summary: 'Recalcular estadísticas de todos los clientes de una tienda',
  })
  @ApiOkResponse({ type: Object })
  async recalculateStoreStats(@Param('storeId') storeId: string) {
    const customers = await this.customerService.findByStore(storeId);
    const results = {
      total: customers.length,
      updated: 0,
      errors: 0,
    };

    for (const customer of customers) {
      try {
        await this.customerService.recalculateCustomerStats(customer.id);
        results.updated++;
      } catch (err) {
        console.error(
          `Error recalculando stats para customer ${customer.id}:`,
          err,
        );
        results.errors++;
      }
    }

    return results;
  }

  @Get(':id')
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Obtener un cliente específico' })
  @ApiOkResponse({ type: Customer })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.findOne(id);
  }

  @Get(':id/stats')
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Obtener estadísticas de un cliente' })
  @ApiOkResponse({ type: Object })
  getStats(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.getCustomerStats(id);
  }

  @Patch(':id')
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Actualizar un cliente' })
  @ApiOkResponse({ type: Customer })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customerService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @Roles(UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Eliminar un cliente' })
  @ApiOkResponse({ description: 'Cliente eliminado exitosamente' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.remove(id);
  }
}
