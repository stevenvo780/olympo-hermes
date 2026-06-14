'use client';
import React, { useCallback, useEffect, useState, useMemo, memo } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { BsCurrencyDollar, BsCashStack, BsCashCoin, BsCash, BsTrash } from 'react-icons/bs';
import CategoryTree from './CategoryTree';
import './styles.scss';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { setFilters, setActiveRange, setQuickFilterLabels, setLoadingFilters } from '@/redux/products';
import { useParams } from 'next/navigation';
import api from '@/utils/axios';
import debounce from 'lodash/debounce';

interface ProductFiltersProps {
  isLoading?: boolean;
}

const formatPrice = (price: number): string => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const calculatePriceRanges = (minPrice: number, maxPrice: number) => {
  if (maxPrice <= minPrice) return null;
  
  const range = maxPrice - minPrice;
  const magnitude = Math.floor(Math.log10(range));
  const roundFactor = Math.pow(10, Math.max(0, magnitude - 1));
  
  const roundedMinPrice = Math.floor(minPrice / roundFactor) * roundFactor;
  const roundedMaxPrice = Math.ceil(maxPrice / roundFactor) * roundFactor;
  
  const roundedRange = roundedMaxPrice - roundedMinPrice;
  const step = Math.round(roundedRange / 4 / roundFactor) * roundFactor;
  
  const limits = [
    roundedMinPrice,
    roundedMinPrice + step,
    roundedMinPrice + step * 2,
    roundedMinPrice + step * 3,
    roundedMaxPrice
  ];
  
  return {
    limits,
    labels: {
      lowest: `${formatPrice(limits[0])} - ${formatPrice(limits[1])}`,
      low: `${formatPrice(limits[1])} - ${formatPrice(limits[2])}`,
      medium: `${formatPrice(limits[2])} - ${formatPrice(limits[3])}`,
      high: `${formatPrice(limits[3])} - ${formatPrice(limits[4])}`
    }
  };
};

const ProductFilters: React.FC<ProductFiltersProps> = ({ isLoading }) => {
  const dispatch = useDispatch();
  const { storeId } = useParams() as { storeId: string };
  const categoriesHierarchy = useSelector((state: RootState) => state.categories.categoriesHierarchy);
  const activeRange = useSelector((state: RootState) => state.products.activeRange);
  const filters = useSelector((state: RootState) => state.products.filters);
  const quickFilterLabels = useSelector((state: RootState) => state.products.quickFilterLabels);
  const loadingFilters = useSelector((state: RootState) => state.products.loadingFilters);
  const [buttonCooldown, setButtonCooldown] = useState(false);

  useEffect(() => {
    if (!quickFilterLabels.lowest && storeId) {
      dispatch(setLoadingFilters(true));
      api.get(`/products/${storeId}/price-range`)
        .then(response => {
          const { minPrice, maxPrice } = response.data;
          if (maxPrice > minPrice) {
            const priceRanges = calculatePriceRanges(minPrice, maxPrice);
            if (priceRanges) {
              dispatch(setQuickFilterLabels(priceRanges.labels));
            }
          }
        })
        .finally(() => dispatch(setLoadingFilters(false)));
    }
  }, [quickFilterLabels, storeId, dispatch]);

  const handleQuickFilter = useCallback((range: 'lowest' | 'low' | 'medium' | 'high') => {
    if (buttonCooldown) return;
    
    setButtonCooldown(true);
    setTimeout(() => setButtonCooldown(false), 300);
    
    if (activeRange === range) {
      dispatch(setActiveRange(''));
      dispatch(setFilters({ ...filters, minPrice: 0, maxPrice: 0 }));
    } else {
      dispatch(setActiveRange(range));
      const rangeLabel = quickFilterLabels[range];
      if (rangeLabel) {
        const [min, max] = rangeLabel.split(' - ').map(val => {
          return parseInt(val.replace(/\./g, ''));
        });
        if (!isNaN(min) && !isNaN(max)) {
          dispatch(setFilters({ ...filters, minPrice: min, maxPrice: max }));
        }
      }
    }
  }, [activeRange, quickFilterLabels, filters, dispatch, buttonCooldown]);

  const debouncedSetFilters = useMemo(() => 
    debounce((newFilters) => dispatch(setFilters(newFilters)), 300),
    [dispatch]
  );

  const handleInputChange = useCallback((field: string, value: string) => {
    const numValue = parseInt(value);
    const newFilters = { ...filters };
    
    if (field === 'minPrice') {
      newFilters.minPrice = isNaN(numValue) ? 0 : numValue;
    } else if (field === 'maxPrice') {
      newFilters.maxPrice = isNaN(numValue) ? 0 : numValue;
    }
    
    debouncedSetFilters(newFilters);
  }, [filters, debouncedSetFilters]);

  const handleInputClear = useCallback((field: string) => {
    if (field === 'minPrice') {
      dispatch(setFilters({ ...filters, minPrice: 0 }));
    } else if (field === 'maxPrice') {
      dispatch(setFilters({ ...filters, maxPrice: 0 }));
    }
  }, [filters, dispatch]);

  const handleDiscountChange = useCallback((value: string) => {
    if (buttonCooldown) return;
    
    setButtonCooldown(true);
    setTimeout(() => setButtonCooldown(false), 300);
    
    if (filters.discount === value) {
      dispatch(setFilters({ ...filters, discount: '' }));
    } else {
      dispatch(setFilters({ ...filters, discount: value }));
    }
  }, [filters, dispatch, buttonCooldown]);

  const resetAllFilters = useCallback(() => {
    dispatch(setActiveRange(''));
    dispatch(setFilters({
      minPrice: 0,
      maxPrice: 0,
      category: '',
      discount: '',
    }));
  }, [dispatch]);

  useEffect(() => {
    return () => {
      debouncedSetFilters.cancel();
    };
  }, [debouncedSetFilters]);

  const categoryTreeMemo = useMemo(() => (
    <CategoryTree 
      categories={categoriesHierarchy} 
      onSelectCategory={(id) => dispatch(setFilters({ ...filters, category: id }))}
      selectedCategoryId={filters.category}
    />
  ), [categoriesHierarchy, filters, dispatch]);

  return (
    <Form className="product-filters">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Button 
          variant="outline-danger" 
          size="sm" 
          onClick={resetAllFilters}
          className="reset-filters-btn"
        >
          <BsTrash className="me-1" /> Limpiar filtros
        </Button>
      </div>

      <Row className="mb-3 gx-2">
        <Col xs={12} className="mb-2">
          <Button 
            variant={activeRange === 'lowest' ? "primary" : "outline-primary"}
            type="button" 
            onClick={() => handleQuickFilter('lowest')}
            disabled={isLoading || loadingFilters}
            className={`w-100 d-flex align-items-center justify-content-center filter-button ${activeRange === 'lowest' ? 'active' : ''}`}
          >
            <BsCurrencyDollar size={18} className="me-2" />
            {quickFilterLabels.lowest || '...'}
          </Button>
        </Col>
        <Col xs={12} className="mb-2">
          <Button 
            variant={activeRange === 'low' ? "primary" : "outline-primary"}
            type="button" 
            onClick={() => handleQuickFilter('low')}
            disabled={isLoading || loadingFilters}
            className={`w-100 d-flex align-items-center justify-content-center filter-button ${activeRange === 'low' ? 'active' : ''}`}
          >
            <BsCashCoin size={18} className="me-2" />
            {quickFilterLabels.low || '...'}
          </Button>
        </Col>
        <Col xs={12} className="mb-2">
          <Button 
            variant={activeRange === 'medium' ? "primary" : "outline-primary"}
            type="button" 
            onClick={() => handleQuickFilter('medium')}
            disabled={isLoading || loadingFilters}
            className={`w-100 d-flex align-items-center justify-content-center filter-button ${activeRange === 'medium' ? 'active' : ''}`}
          >
            <BsCash size={18} className="me-2" />
            {quickFilterLabels.medium || '...'}
          </Button>
        </Col>
        <Col xs={12} className="mb-2">
          <Button 
            variant={activeRange === 'high' ? "primary" : "outline-primary"}
            type="button" 
            onClick={() => handleQuickFilter('high')}
            disabled={isLoading || loadingFilters}
            className={`w-100 d-flex align-items-center justify-content-center filter-button ${activeRange === 'high' ? 'active' : ''}`}
          >
            <BsCashStack size={18} className="me-2" />
            {quickFilterLabels.high || '...'}
          </Button>
        </Col>
      </Row>
      
      <Form.Group className="mb-3 input-group" controlId="filterMinPrice">
        <Form.Control 
          type="number" 
          placeholder="Precio mínimo"
          value={filters.minPrice || ''}
          onChange={(e) => handleInputChange('minPrice', e.target.value)}
          onDoubleClick={() => handleInputClear('minPrice')}
          className={`custom-input ${filters.minPrice ? 'has-value' : ''}`}
        />
        {filters.minPrice !== 0 && (
          <Button variant="link" className="clear-btn" onClick={() => handleInputClear('minPrice')}>×</Button>
        )}
      </Form.Group>
      
      <Form.Group className="mb-3 input-group" controlId="filterMaxPrice">
        <Form.Control 
          type="number" 
          placeholder="Precio máximo"
          value={filters.maxPrice || ''}
          onChange={(e) => handleInputChange('maxPrice', e.target.value)}
          onDoubleClick={() => handleInputClear('maxPrice')}
          className={`custom-input ${filters.maxPrice ? 'has-value' : ''}`}
        />
        {filters.maxPrice !== 0 && (
          <Button variant="link" className="clear-btn" onClick={() => handleInputClear('maxPrice')}>×</Button>
        )}
      </Form.Group>
      
      <Form.Group className="mb-3" controlId="filterCategory">
        <div className="card shadow-sm custom-card" style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <div className="card-body p-2">
            {categoryTreeMemo}
          </div>
        </div>
      </Form.Group>
      
      <Form.Group className="mb-3" controlId="filterDiscount">
        <div className="discount-options">
          <Button 
            variant={filters.discount === 'true' ? "primary" : "outline-primary"}
            className={`me-2 flex-grow-1 filter-button ${filters.discount === 'true' ? 'active' : ''}`}
            onClick={() => handleDiscountChange('true')}
          >
            Con descuento
          </Button>
          <Button 
            variant={filters.discount === 'false' ? "primary" : "outline-primary"}
            className={`flex-grow-1 filter-button ${filters.discount === 'false' ? 'active' : ''}`}
            onClick={() => handleDiscountChange('false')}
          >
            Sin descuento
          </Button>
        </div>
      </Form.Group>
    </Form>
  );
};

export default memo(ProductFilters, (prev, next) => {
  return prev.isLoading === next.isLoading;
});
