import {
  Controller,
  Patch,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProductCategoryOrderService } from './product-category-order.service';
import { FirebaseAuthGuard } from '@/auth/firebase-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { Roles } from '@/auth/roles.decorator';
import { UserRole } from '@/user/entities/user.entity';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RequestWithUser } from '@/auth/types';

@ApiTags('products/category-order')
@ApiBearerAuth()
@Controller('products/category-order')
export class ProductCategoryOrderController {
  constructor(
    private readonly productCategoryOrderService: ProductCategoryOrderService,
  ) {}

  @Patch('category')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({
    summary: 'Update product order within a category',
  })
  async updateOrderInCategory(
    @Body()
    body: {
      productId: number;
      categoryId: number;
      newOrder: number;
      storeId: string;
    },
    @Request() req: RequestWithUser,
  ) {
    const { productId, categoryId, newOrder, storeId } = body;
    return this.productCategoryOrderService.updateProductCategoryOrder(
      productId,
      categoryId,
      newOrder,
      storeId,
      req.user,
    );
  }

  @Get('category/:categoryId')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Get product orders for a category' })
  async getCategoryOrders(
    @Param('categoryId') categoryId: string,
    @Query('storeId') storeId: string,
  ) {
    return this.productCategoryOrderService.getProductCategoryOrders(
      parseInt(categoryId, 10),
      storeId,
    );
  }
}
