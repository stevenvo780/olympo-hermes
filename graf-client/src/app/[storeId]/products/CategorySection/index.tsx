'use client';
import React, { useEffect, useRef, memo, useCallback, useMemo } from 'react';
import ProductsList from '../ProductsList';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { Product, Category } from '@/types';
import './styles.scss';
import { useProducts } from '@/hooks/useProducts';
import { useParams } from 'next/navigation';
import { getAllDescendants } from '@/utils/categoryHierarchyUtils';
import { 
  MdFolder, 
  MdFolderOpen, 
  MdSubdirectoryArrowRight,
  MdWarning,
  MdAccountTree,
  MdArrowRight
} from 'react-icons/md';

interface CategorySectionProps {
  id?: string;
  category: Category;
  handleShowDetails: (product: Product) => void;
  handleShowVariation: (product: Product) => void;
  depth?: number;
  maxDepth?: number;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  id,
  category,
  handleShowDetails,
  handleShowVariation,
  depth = 0,
  maxDepth = 6
}) => {
  const { storeId } = useParams() as { storeId: string };
  const { loadProductsByCategory } = useProducts(storeId);
  const filters = useSelector((state: RootState) => state.products.filters);
  const productsByCategorySelected = useSelector((state: RootState) =>
    state.products.productsByCategory[category.id] || null);
  const isCurrentlyLoading = useSelector((state: RootState) =>
    state.products.productsByCategoryLoading[category.id] || false);
  const prevFiltersRef = useRef(filters);

  const isDepthExceeded = depth > maxDepth;

  const stableLoadProductsByCategory = useCallback((categoryId: number) => {
    loadProductsByCategory(categoryId);
  }, [loadProductsByCategory]);
  
  useEffect(() => {
    if (isDepthExceeded) {
      return;
    }

    if (!filters.category || filters.category === category.id.toString()) {
      if (!productsByCategorySelected) {
        stableLoadProductsByCategory(category.id);
      }
    }
  }, [category.id, filters.category, productsByCategorySelected, isDepthExceeded, stableLoadProductsByCategory, category.name, depth, maxDepth]);

  useEffect(() => {
    if (isDepthExceeded) return;
    
    const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(filters);
    if (filtersChanged && (!filters.category || filters.category === category.id.toString())) {
      stableLoadProductsByCategory(category.id);
    }
    prevFiltersRef.current = filters;
  }, [filters, category.id, stableLoadProductsByCategory, isDepthExceeded]);

  const loadMoreProducts = useCallback(() => {
    if (isDepthExceeded) return;
    
    if (productsByCategorySelected && productsByCategorySelected.hasMore && !isCurrentlyLoading) {
      loadProductsByCategory(category.id, true);
    }
  }, [productsByCategorySelected, isCurrentlyLoading, category.id, loadProductsByCategory, isDepthExceeded]);

  const hasProducts = useMemo(() => {
    return productsByCategorySelected && productsByCategorySelected.products.length > 0;
  }, [productsByCategorySelected]);

  const hasSubcategories = category.children && category.children.length > 0;

  if (isDepthExceeded) {
    const descendants = getAllDescendants(category);
    return (
      <div className="category-section depth-exceeded">
        <div className="category-header">
          <h5>
            <MdWarning className="warning-icon" />
            {category.name}
          </h5>
          <p className="text-muted small">
            <MdAccountTree className="tree-icon" />
            Jerarquía demasiado profunda (nivel {depth}). 
            Contiene {descendants.length} subcategorías.
          </p>
        </div>
      </div>
    );
  }

  if (!hasProducts && !hasSubcategories) {
    return null;
  }

  return (
    <section id={id} className={`category-section depth-${depth}`} key={category.id}>

      {hasSubcategories && !hasProducts && (
        <div className="category-header-with-icon container-only">
          <MdFolder className="category-icon container-icon" />
          <span className="category-name">{category.name}</span>
          <span className="subcategory-count">
            ({category.children?.length} subcategorías)
          </span>
          {depth > 0 && (
            <MdArrowRight className="hierarchy-indicator" />
          )}
        </div>
      )}

      {hasProducts && (
        <div className="category-content">

          {depth > 1 && hasSubcategories && (
            <div className="category-header-with-icon">
              <MdFolderOpen className="category-icon container-icon" />
              <span className="category-name">{category.name}</span>
              <MdSubdirectoryArrowRight className="hierarchy-indicator" />
            </div>
          )}
          <ProductsList
            handleShowDetails={handleShowDetails}
            handleShowVariation={handleShowVariation}
            categoryName={category.name}
            categoryId={category.id}
            loadMoreProducts={loadMoreProducts}
            hasMoreProducts={productsByCategorySelected?.hasMore || false}
            hasSubcategories={hasSubcategories}
            depth={depth}
          />
        </div>
      )}

      {hasSubcategories && !isDepthExceeded && category.children?.map((subcat) => (
        <div className="subcategories-container mt-3" key={`category-placeholder-${subcat.id}`}>
          <CategorySection
            id={`category-${subcat.id}`}
            category={subcat}
            handleShowDetails={handleShowDetails}
            handleShowVariation={handleShowVariation}
            depth={depth + 1}
            maxDepth={maxDepth}
          />
        </div>
      ))}
    </section>
  );
};

export default memo(CategorySection, (prev, next) => {

  return (
    prev.category.id === next.category.id &&
    prev.depth === next.depth &&
    prev.maxDepth === next.maxDepth &&
    prev.category.name === next.category.name &&
    prev.category.children?.length === next.category.children?.length
  );
});
