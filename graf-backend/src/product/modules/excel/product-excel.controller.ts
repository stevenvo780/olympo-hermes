import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProductExcelService } from './product-excel.service';
import { ImportExcelDto } from '../../dto/import-excel.dto';
import { FirebaseAuthGuard } from '@/auth/firebase-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { Roles } from '@/auth/roles.decorator';
import { UserRole } from '@/user/entities/user.entity';
import { RequestWithUser } from '@/auth/types';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('products/excel')
@ApiBearerAuth()
@Controller('products/:storeId/excel')
export class ProductExcelController {
  constructor(private readonly productExcelService: ProductExcelService) {}

  @Get('lookup')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Get lookup data for Excel import' })
  async getLookupData(@Param('storeId') storeId: string) {
    return this.productExcelService.getLookupData(storeId);
  }

  @Get('export')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Export products in hierarchical order' })
  async exportProducts(@Param('storeId') storeId: string) {
    return this.productExcelService.getAllProductsForExport(storeId);
  }

  @Post('import')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Import products from Excel' })
  async importProducts(
    @Param('storeId') storeId: string,
    @Body() dto: ImportExcelDto,
    @Request() req: RequestWithUser,
  ) {
    return this.productExcelService.importExcel(dto, storeId, req.user);
  }
}
