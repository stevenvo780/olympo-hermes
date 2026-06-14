export interface ProductPrices {
  basePrice: number;
  discountPrice: number;
  netPrice: number;
  taxPrice: number;
  priceWithTax: number;
  totalPrice: number;
}

export interface ProductDisplayInfo {
  isParentProduct: boolean;
  canAddToCart: boolean;
  hasStock: boolean;
  firstImageUrl: string | null;
  displayPrice: number;
}
