import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import { ProductCoreService } from './product-core.service';
import { CreateProductDto } from '../../dto/create-product.dto';
import { UpdateProductDto } from '../../dto/update-product.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '@/auth/firebase-auth.guard';
import { RolesGuard } from '@/auth/roles.guard';
import { Roles } from '@/auth/roles.decorator';
import { UserRole } from '@/user/entities/user.entity';
import { RequestWithUser } from '@/auth/types';

@Controller('products/:storeId')
export class ProductCoreController {
  constructor(private readonly core: ProductCoreService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  create(
    @Body() createProductDto: CreateProductDto,
    @Param('storeId') storeId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.core.create(createProductDto, storeId, req.user);
  }

  @Get()
  findAll(
    @Param('storeId') storeId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('exist') exist?: string,
    @Query('includeOutOfStock') includeOutOfStock?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('title') title?: string,
    @Query('category') category?: string,
    @Query('discount') discount?: string,
    @Query('text') text?: string,
  ) {
    const filter = {
      limit,
      offset,
      exist: exist === 'true' ? true : exist === 'false' ? false : undefined,
      includeOutOfStock:
        includeOutOfStock === 'true'
          ? true
          : includeOutOfStock === 'false'
          ? false
          : undefined,
      minPrice,
      maxPrice,
      title,
      category,
      discount:
        discount === 'true' ? true : discount === 'false' ? false : undefined,
      text,
    };
    return this.core.findAll(storeId, filter);
  }

  @Get('search')
  searchGlobal(
    @Query('query') query: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.core.searchGlobal({ query, limit, offset });
  }

  @Get('popular')
  findMostPopular(
    @Param('storeId') storeId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.core.findMostPopularByStore(parseInt(storeId), limit);
  }

  @Get('price-range')
  getPriceRange(@Param('storeId') storeId: string) {
    return this.core.getMinMaxPrices(storeId);
  }

  @Get('all')
  getAllProducts(@Param('storeId') storeId: string) {
    return this.core.getAllProducts(storeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Param('storeId') storeId: string) {
    return this.core.findOne(+id, storeId);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Param('storeId') storeId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.core.update(+id, updateProductDto, storeId, req.user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  remove(
    @Param('id') id: string,
    @Param('storeId') storeId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.core.remove(+id, storeId, req.user);
  }
}
