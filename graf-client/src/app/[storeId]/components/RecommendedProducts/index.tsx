'use client';
import React from 'react';
import { Row, Col, Spinner, Card } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { Product, ProductViewVariant } from '@/types';
import { RootState, AppDispatch } from '@/redux/store';
import ProductCard from '@/app/[storeId]/components/ProductCard';
import HorizontalSlider from '@/app/[storeId]/components/HorizontalSlider';

interface RecommendedProductsProps {
  products: Product[];
  loading?: boolean;
  dispatch: AppDispatch;
  storeId: string;
  onShowDetails: (product: Product) => void;
  onShowVariation: (product: Product) => void;
  /** Compact mode reduces item sizes for modal context */
  compact?: boolean;
  /** Optional title, defaults to 'Productos que te pueden interesar' */
  title?: string;
  /** Show title, defaults to true */
  showTitle?: boolean;
}

// Configuration for each card variant
const PRODUCT_VIEW_CONFIG: Record<ProductViewVariant, { 
  displayType: 'carousel' | 'grid'; 
  itemWidth: number | null; 
  compactItemWidth: number | null;
  responsive: { xs: number; md: number; lg: number };
  compactResponsive: { xs: number; md: number; lg: number };
}> = {
  carousel: { 
    displayType: 'carousel', 
    itemWidth: 220, 
    compactItemWidth: 160,
    responsive: { xs: 12, md: 4, lg: 4 },
    compactResponsive: { xs: 6, md: 4, lg: 3 }
  },
  grid: { 
    displayType: 'grid', 
    itemWidth: null, 
    compactItemWidth: null,
    responsive: { xs: 12, md: 4, lg: 4 },
    compactResponsive: { xs: 6, md: 4, lg: 3 }
  },
  clothing: { 
    displayType: 'grid', 
    itemWidth: null, 
    compactItemWidth: null,
    responsive: { xs: 12, md: 6, lg: 6 },
    compactResponsive: { xs: 6, md: 4, lg: 4 }
  },
  list: { 
    displayType: 'grid', 
    itemWidth: null, 
    compactItemWidth: null,
    responsive: { xs: 12, md: 12, lg: 12 },
    compactResponsive: { xs: 12, md: 12, lg: 12 }
  },
  featured: { 
    displayType: 'carousel', 
    itemWidth: 240, 
    compactItemWidth: 180,
    responsive: { xs: 12, md: 4, lg: 4 },
    compactResponsive: { xs: 6, md: 4, lg: 3 }
  },
  'clothing-grid': { 
    displayType: 'grid', 
    itemWidth: null, 
    compactItemWidth: null,
    responsive: { xs: 12, md: 6, lg: 4 },
    compactResponsive: { xs: 6, md: 4, lg: 3 }
  },
  'wide-card': { 
    displayType: 'grid', 
    itemWidth: null, 
    compactItemWidth: null,
    responsive: { xs: 12, md: 12, lg: 12 },
    compactResponsive: { xs: 12, md: 12, lg: 12 }
  },
  compact: { 
    displayType: 'carousel', 
    itemWidth: 150, 
    compactItemWidth: 120,
    responsive: { xs: 6, md: 3, lg: 3 },
    compactResponsive: { xs: 6, md: 4, lg: 3 }
  },
};

const RecommendedProducts: React.FC<RecommendedProductsProps> = ({
  products,
  loading = false,
  dispatch,
  storeId,
  onShowDetails,
  onShowVariation,
  compact = false,
  title = 'Productos que te pueden interesar',
  showTitle = true,
}) => {
  const productDetailConfig = useSelector((state: RootState) => state.config.config?.productDetailConfig);
  
  const recommendedCardType = (productDetailConfig?.recommendedCardType || 'carousel') as ProductViewVariant;
  const recommendedDisplayMode = productDetailConfig?.recommendedDisplayMode || 'carousel';

  const currentViewConfig = PRODUCT_VIEW_CONFIG[recommendedCardType] || PRODUCT_VIEW_CONFIG.carousel;
  
  // Use recommendedDisplayMode to override the display type
  const displayType = recommendedDisplayMode === 'grid' ? 'grid' : currentViewConfig.displayType;
  
  // Select appropriate sizes based on compact mode
  const itemWidth = compact ? currentViewConfig.compactItemWidth : currentViewConfig.itemWidth;
  const responsive = compact ? currentViewConfig.compactResponsive : currentViewConfig.responsive;
  
  // Default grid responsive for card types that don't have a natural grid layout
  const defaultGridResponsive = compact 
    ? { xs: 6, md: 4, lg: 3 } 
    : { xs: 12, md: 4, lg: 4 };
  
  const gridResponsive = displayType === 'grid' 
    && responsive.lg === 12 
    && recommendedCardType !== 'list' 
    && recommendedCardType !== 'wide-card'
      ? defaultGridResponsive 
      : responsive;

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  const gap = compact ? 8 : 16;
  const effectiveItemWidth = itemWidth || (compact ? 160 : 220);

  const renderCarouselMode = () => (
    <HorizontalSlider 
      itemWidth={effectiveItemWidth} 
      gap={gap} 
      className="pb-2"
    >
      {products.map((product) => (
        <div 
          key={product.id} 
          className={`horizontal-item-wrapper h-100 ${recommendedCardType === 'featured' ? 'featured-wrapper' : ''} ${recommendedCardType === 'compact' ? 'compact-wrapper' : ''}`}
          style={{ minWidth: effectiveItemWidth, maxWidth: effectiveItemWidth }}
        >
          <ProductCard
            product={product}
            handleShowDetails={onShowDetails}
            handleShowVariation={() => onShowVariation(product)}
            dispatch={dispatch}
            storeId={storeId}
            isHorizontal={true}
            variant={recommendedCardType}
          />
        </div>
      ))}
    </HorizontalSlider>
  );

  const renderGridMode = () => (
    <Row className="g-3">
      {products.map((product) => (
        <Col
          key={product.id}
          xs={gridResponsive.xs}
          md={gridResponsive.md}
          lg={gridResponsive.lg}
        >
          <ProductCard
            product={product}
            handleShowDetails={onShowDetails}
            handleShowVariation={() => onShowVariation(product)}
            dispatch={dispatch}
            storeId={storeId}
            variant={recommendedCardType}
          />
        </Col>
      ))}
    </Row>
  );

  if (compact) {
    return (
      <Card className="border-0 mt-4">
        <Card.Body>
          {showTitle && <h5 className="mb-3">{title}</h5>}
          {displayType === 'carousel' ? renderCarouselMode() : renderGridMode()}
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      {showTitle && <h4 className="mb-4">{title}</h4>}
      {displayType === 'carousel' ? renderCarouselMode() : renderGridMode()}
    </>
  );
};

export default RecommendedProducts;
