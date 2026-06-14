import React from 'react';
import { Spinner } from 'react-bootstrap';
import HorizontalSlider from '@/app/[storeId]/components/HorizontalSlider';
import ProductCard from '@/app/[storeId]/components/ProductCard';
import type { Product } from '@/types';
import type { AppDispatch } from '@/redux/store';

interface Props {
  loading: boolean;
  variations: Product[];
  handleShowDetails: (variation: Product) => void;
  handleShowVariation: (variation: Product) => void;
  dispatch: AppDispatch;
  storeId: string;
}

const VariationSelectorModalBody: React.FC<Props> = ({
  loading,
  variations,
  handleShowDetails,
  handleShowVariation,
  dispatch,
  storeId
}) => (
  <>
    {loading ? (
      <div className="text-center py-4">
        <Spinner animation="border" />
      </div>
    ) : (
      <HorizontalSlider itemWidth={220} gap={8}>
        {variations.map(variation => (
          <div key={variation.id} style={{ padding: '0 8px' }} className="d-flex h-100">
            <ProductCard
              product={variation}
              handleShowDetails={() => handleShowDetails(variation)}
              handleShowVariation={() => handleShowVariation(variation)}
              dispatch={dispatch}
              storeId={storeId}
              variant="carousel"
            />
          </div>
        ))}
      </HorizontalSlider>
    )}
  </>
);

export default VariationSelectorModalBody;
