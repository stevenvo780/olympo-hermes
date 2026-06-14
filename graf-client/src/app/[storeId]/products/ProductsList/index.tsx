'use client';
import React, { memo, useMemo, useEffect } from 'react';
import { Row, Col, Container, Button } from 'react-bootstrap';
import { FaEye, FaTshirt, FaStar, FaTh, FaCompress } from 'react-icons/fa';
import { MdViewCarousel, MdFolderOpen } from 'react-icons/md';
import { BsGrid3X3Gap, BsViewList, BsCardList } from 'react-icons/bs';
import { Product, ProductViewVariant } from '@/types';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import { setCategoryViewMode } from '@/redux/products';
import './styles.scss';
import ProductCard from '@/app/[storeId]/components/ProductCard';
import { RootState } from '@/redux/store';
import HorizontalSlider from '@/app/[storeId]/components/HorizontalSlider';
import { usePagination } from '@/hooks/usePagination';
import { sortProductsByCategoryOrder } from '@/utils/productOrder';

const CARD_WIDTH = 220;
const CARD_GAP = 16;

const PRODUCT_VIEW_CONFIG = {
  carousel: {
    icon: MdViewCarousel,
    title: 'Vista carrusel',
    displayType: 'carousel',
    itemWidth: 220,
    responsive: {
      xs: 12, md: 12, lg: 12
    }
  },
  grid: {
    icon: BsGrid3X3Gap,
    title: 'Vista cuadrícula',
    displayType: 'grid',
    itemWidth: null,
    responsive: {
      xs: 12, md: 4, lg: 4
    }
  },
  clothing: {
    icon: FaTshirt,
    title: 'Vista ropa',
    displayType: 'grid',
    itemWidth: null,
    responsive: {
      xs: 12, md: 6, lg: 6
    }
  },
  list: {
    icon: BsViewList,
    title: 'Vista lista',
    displayType: 'grid',
    itemWidth: null,
    responsive: {
      xs: 12, md: 12, lg: 12
    }
  },
  featured: {
    icon: FaStar,
    title: 'Vista destacada',
    displayType: 'carousel',
    itemWidth: 240,
    responsive: {
      xs: 12, md: 12, lg: 12
    }
  },
  'clothing-grid': {
    icon: FaTh,
    title: 'Ropa en cuadrícula',
    displayType: 'grid',
    itemWidth: null,
    responsive: {
      xs: 12, md: 6, lg: 4
    }
  },
  'wide-card': {
    icon: BsCardList,
    title: 'Vista amplia',
    displayType: 'grid',
    itemWidth: null,
    responsive: {
      xs: 12, md: 12, lg: 12
    }
  },
  compact: {
    icon: FaCompress,
    title: 'Vista compacta',
    displayType: 'carousel',
    itemWidth: 150,
    responsive: {
      xs: 12, md: 12, lg: 12
    }
  }
} as const;

interface ProductsListProps {
  handleShowDetails: (product: Product) => void;
  handleShowVariation: (product: Product) => void;
  categoryName?: string;
  categoryId: number;
  loadMoreProducts: () => void;
  hasMoreProducts: boolean;
  hasActiveFilters?: boolean;
  hasSubcategories?: boolean;
  depth?: number;
}

const ProductsList: React.FC<ProductsListProps> = ({
  handleShowDetails,
  handleShowVariation,
  categoryName,
  categoryId,
  loadMoreProducts,
  hasMoreProducts,
  hasActiveFilters = false,
  hasSubcategories = false,
  depth = 0
}) => {
  const dispatch = useDispatch();
  const productsByCategory = useSelector((state: RootState) => state.products.productsByCategory[categoryId]);
  const isLoading = useSelector((state: RootState) => state.products.productsByCategoryLoading[categoryId] || false);
  const storeConfig = useSelector((state: RootState) => state.config.config);
  const userSelectedView = useSelector((state: RootState) => state.products.viewModes[categoryId]);
  const { storeId } = useParams() as { storeId: string };

  const productViewConfig = useMemo(() => {
    if (storeConfig?.productViewConfig) {
      return storeConfig.productViewConfig;
    }

    const fallback = {
      defaultView: 'carousel' as ProductViewVariant,
      filteredView: 'grid' as ProductViewVariant,
      availableViews: ['carousel', 'grid'] as ProductViewVariant[]
    };

    return fallback;
  }, [storeConfig?.productViewConfig]);

  const getCurrentViewConfig = (viewType: ProductViewVariant) => {
    return PRODUCT_VIEW_CONFIG[viewType as keyof typeof PRODUCT_VIEW_CONFIG];
  };

  const hasMultipleViews = productViewConfig.availableViews.length > 1;

  const currentViewMode = useMemo(() => {
    if (hasMultipleViews && userSelectedView && productViewConfig.availableViews.includes(userSelectedView)) {
      return userSelectedView;
    }

    if (hasActiveFilters && productViewConfig.filteredView) {
      return productViewConfig.filteredView as ProductViewVariant;
    }

    return productViewConfig.defaultView as ProductViewVariant;
  }, [hasActiveFilters, productViewConfig, hasMultipleViews, userSelectedView]);

  const currentViewConfig = getCurrentViewConfig(currentViewMode);

  const handleViewChange = (newView: ProductViewVariant) => {
    dispatch(setCategoryViewMode({ categoryId, viewMode: newView }));
  };

  const { setLastItemRef } = usePagination({
    hasMore: hasMoreProducts,
    isLoading,
    onLoadMore: loadMoreProducts
  });

  const processedProducts = useMemo(() =>
    sortProductsByCategoryOrder(productsByCategory.products).map((product, index) => ({
        ...product,
        uniqueKey: `${product.id}-${categoryId}-${index}`,
        isLast: index >= productsByCategory.products.length - 5
      })),
    [productsByCategory.products, categoryId]
  );

  useEffect(() => {
    if (hasMoreProducts && !isLoading && productsByCategory.products.length < 12) {
      loadMoreProducts();
    }
  }, [hasMoreProducts, isLoading, loadMoreProducts, productsByCategory.products.length]);

  return (
    <Container fluid className="mb-1 p-0">
      <div className="d-flex justify-content-between align-items-center mb-3 px-3 pt-3">
        {categoryName && (
          <div className="m-0 p-0 d-flex align-items-center gap-2">

            {depth > 1 && hasSubcategories && (
              <MdFolderOpen className="category-icon container-icon" size={20} />
            )}
            <h4 className="m-0 fw-bold" style={{ color: 'var(--card-title-color)' }}>{categoryName}</h4>
          </div>
        )}

        <div className="d-flex align-items-center gap-2">
          {hasMultipleViews ? (
            <>
              {productViewConfig.availableViews.map(viewType => {
                const viewConfig = getCurrentViewConfig(viewType as ProductViewVariant);
                if (!viewConfig) return null;

                const IconComponent = viewConfig.icon;
                return (
                  <Button
                    key={viewType}
                    variant="light"
                    className={`view-toggle-button d-flex align-items-center justify-content-center p-0 ${currentViewMode === viewType ? 'active' : ''}`}
                    onClick={() => handleViewChange(viewType as ProductViewVariant)}
                    title={viewConfig.title}
                  >
                    <IconComponent />
                  </Button>
                );
              })}
              {hasActiveFilters && (
                <span className="badge bg-secondary ms-2">Con filtros</span>
              )}
            </>
          ) : (
            <div className="d-flex align-items-center gap-2 text-muted small">
              <FaEye />
              <span>Vista: {currentViewConfig?.title || 'Desconocida'}</span>
              {hasActiveFilters && (
                <span className="badge bg-secondary">Con filtros</span>
              )}
            </div>
          )}
        </div>
      </div>

      {currentViewConfig?.displayType === 'carousel' && (
        <HorizontalSlider
          itemWidth={currentViewConfig.itemWidth || CARD_WIDTH}
          gap={CARD_GAP}
          isLoading={isLoading}
          loadMoreItems={loadMoreProducts}
          hasMoreItems={hasMoreProducts}
          containerClassName="px-2"
        >
          {processedProducts.map(product => (
            <div key={product.uniqueKey}>
              <ProductCard
                product={product}
                handleShowDetails={handleShowDetails}
                handleShowVariation={handleShowVariation}
                dispatch={dispatch}
                storeId={storeId}
                variant={currentViewMode}
              />
            </div>
          ))}
        </HorizontalSlider>
      )}

      {currentViewConfig?.displayType === 'grid' && (
        <>
          <Row className={`g-1 mx-2 ${currentViewMode === 'list' ? 'list-view' : currentViewMode === 'wide-card' ? 'wide-card-view' : ''}`}>
            {processedProducts.map(product => (
              <Col
                key={product.uniqueKey}
                xs={currentViewConfig.responsive.xs}
                md={currentViewConfig.responsive.md}
                lg={currentViewConfig.responsive.lg}
                style={{ padding: '7px' }}
                ref={product.isLast ? node => setLastItemRef(node) : null}
              >
                <ProductCard
                  product={product}
                  handleShowDetails={handleShowDetails}
                  handleShowVariation={handleShowVariation}
                  dispatch={dispatch}
                  storeId={storeId}
                  variant={currentViewMode}
                />
              </Col>
            ))}

            {isLoading && (
              <Col xs={12} className="d-flex justify-content-center my-3">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </Col>
            )}
          </Row>

          {hasMoreProducts && !isLoading && (
            <div className="d-flex justify-content-center my-3">
              <Button
                variant="outline-primary"
                onClick={loadMoreProducts}
                className="px-4"
              >
                Ver más productos
              </Button>
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default memo(ProductsList, (prev, next) => {
  return prev.categoryId === next.categoryId &&
    prev.hasMoreProducts === next.hasMoreProducts &&
    prev.hasActiveFilters === next.hasActiveFilters &&
    JSON.stringify(prev.handleShowDetails) === JSON.stringify(next.handleShowDetails);
});
