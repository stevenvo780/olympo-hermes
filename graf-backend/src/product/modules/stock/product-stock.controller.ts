import {
  Controller,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ProductStockService } from './product-stock.service';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConflictException } from '@nestjs/common';
import { FirebaseAuthGuard } from '@/auth/firebase-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { Roles } from '@/auth/roles.decorator';
import { UserRole } from '@/user/entities/user.entity';

@ApiTags('products/stock')
@ApiBearerAuth()
@Controller('products/:storeId/stock')
export class ProductStockController {
  constructor(private readonly productStockService: ProductStockService) {}

  @Patch(':productId')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Update product stock' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
  async updateStock(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('storeId') storeId: string,
    @Body()
    body: {
      stock: number;
      source?: string;
      reason?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    if (body.stock < 0) {
      throw new ConflictException('Stock cannot be negative');
    }

    return this.productStockService.updateStock(
      productId,
      storeId,
      body.stock,
      body.source || 'hub-central',
      body,
    );
  }

  @Patch(':productId/decrement')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Decrement product stock' })
  async decrementStock(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('storeId') storeId: string,
    @Body()
    body: {
      decrementBy: number;
      source: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.productStockService.decrementStock(
      productId,
      storeId,
      body.decrementBy,
      body.source,
      body,
    );
  }

  @Patch(':productId/increment')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Increment product stock' })
  async incrementStock(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('storeId') storeId: string,
    @Body()
    body: {
      quantity: number;
      reason?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    if (body.quantity < 0) {
      throw new ConflictException('Increment quantity cannot be negative');
    }

    return this.productStockService.incrementStock(
      productId,
      storeId,
      body.quantity,
      'hub-central',
      body,
    );
  }
}
