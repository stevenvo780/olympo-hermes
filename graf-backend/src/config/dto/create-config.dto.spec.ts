import { plainToInstance } from 'class-transformer';
import { CreateConfigDto } from './create-config.dto';
import {
  ProductDetailViewType,
  ProductContentType,
  RecommendedCardType,
  RecommendedDisplayMode,
} from '../entities/config.entity';

describe('CreateConfigDto', () => {
  describe('ProductViewConfigDto transformation', () => {
    it('should transform productViewConfig nested object', () => {
      const plain = {
        logo: 'test.png',
        productViewConfig: {
          defaultView: RecommendedCardType.CAROUSEL,
          filteredView: RecommendedDisplayMode.GRID,
          cardConfig: {
            maxTitleLines: 2,
          },
        },
      };

      const result = plainToInstance(CreateConfigDto, plain);

      expect(result).toBeInstanceOf(CreateConfigDto);
      expect(result.productViewConfig).toBeDefined();
      expect(result.productViewConfig?.defaultView).toBe(
        RecommendedCardType.CAROUSEL,
      );
    });
  });

  describe('ProductDetailConfigDto transformation', () => {
    it('should transform productDetailConfig nested object', () => {
      const plain = {
        logo: 'test.png',
        productDetailConfig: {
          viewType: ProductDetailViewType.MODAL,
          contentType: ProductContentType.HTML,
          showRecommendedProducts: true,
        },
      };

      const result = plainToInstance(CreateConfigDto, plain);

      expect(result).toBeInstanceOf(CreateConfigDto);
      expect(result.productDetailConfig).toBeDefined();
      expect(result.productDetailConfig?.viewType).toBe(
        ProductDetailViewType.MODAL,
      );
      expect(result.productDetailConfig?.contentType).toBe(
        ProductContentType.HTML,
      );
    });

    it('should handle undefined productDetailConfig', () => {
      const plain = {
        logo: 'test.png',
      };

      const result = plainToInstance(CreateConfigDto, plain);

      expect(result).toBeInstanceOf(CreateConfigDto);
      expect(result.productDetailConfig).toBeUndefined();
    });

    it('should transform all productDetailConfig fields', () => {
      const plain = {
        productDetailConfig: {
          viewType: ProductDetailViewType.PAGE,
          contentType: ProductContentType.PLAIN,
          showRecommendedProducts: false,
          recommendedDisplayMode: RecommendedDisplayMode.CAROUSEL,
          recommendedCardType: RecommendedCardType.FEATURED,
        },
      };

      const result = plainToInstance(CreateConfigDto, plain);

      expect(result.productDetailConfig).toBeDefined();
      expect(result.productDetailConfig?.viewType).toBe(
        ProductDetailViewType.PAGE,
      );
      expect(result.productDetailConfig?.showRecommendedProducts).toBe(false);
      expect(result.productDetailConfig?.recommendedDisplayMode).toBe(
        RecommendedDisplayMode.CAROUSEL,
      );
    });
  });
});
