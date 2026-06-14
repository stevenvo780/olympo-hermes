import { Product } from '../entities/product.entity';
import { ProductPrices, ProductDisplayInfo } from './product-prices.type';

export interface ProductResponse
  extends Product,
    ProductPrices,
    ProductDisplayInfo {
  orderInCategory?: number;
}

export interface PaginatedProductsResponse {
  products: ProductResponse[];
  total: number;
  currentPage: number;
  totalPages: number;
}
