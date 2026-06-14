import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ProductCoreService } from './product-core.service';

@Controller('products-search')
export class ProductSearchController {
  constructor(private readonly core: ProductCoreService) {}

  @Get()
  searchGlobal(
    @Query('query') query: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.core.searchGlobal({ query, limit, offset });
  }
}
