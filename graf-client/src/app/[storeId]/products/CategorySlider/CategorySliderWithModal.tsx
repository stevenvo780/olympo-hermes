'use client';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import './styles.scss';
import Image from 'next/image';
import { RootState } from '@/redux/store';
import { useSelector } from 'react-redux';
import HorizontalSlider from '@/app/[storeId]/components/HorizontalSlider';
import SubcategoryModal from './SubcategoryModal';
import { Category } from '@/types';

interface CategorySliderWithModalProps {
  onSelectCategory: (categoryId: string) => void;
  selectedCategoryId?: string;
}

const CategorySliderWithModal: React.FC<CategorySliderWithModalProps> = ({ 
  onSelectCategory, 
  selectedCategoryId 
}) => {
  const allCategories = useSelector((state: RootState) => state.categories.categories);
  const categoriesLoading = useSelector((state: RootState) => state.categories.loading);
  const [activeCategory, setActiveCategory] = useState<string | undefined>(selectedCategoryId);
  const [hoveredCategory, setHoveredCategory] = useState<Category | null>(null);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const categoryRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const gap = useMemo(() => {
    return typeof window !== 'undefined' && window.innerWidth <= 768 ? 16 : 30;
  }, []);

  useEffect(() => {
    setActiveCategory(selectedCategoryId);
  }, [selectedCategoryId]);

  const handleCategoryClick = useCallback((categoryId: string) => {
    const newCategoryId = activeCategory === categoryId ? '' : categoryId;
    setActiveCategory(newCategoryId);
    onSelectCategory(newCategoryId);
  }, [activeCategory, onSelectCategory]);

  const handleCategoryHover = useCallback((category: Category) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    if (category.children && category.children.length > 0) {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredCategory(category);
        setShowSubcategoryModal(true);
      }, 300);
    }
  }, []);

  const handleCategoryLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowSubcategoryModal(false);
    setHoveredCategory(null);
  }, []);

  const handleSelectSubcategory = useCallback((subcategoryId: string) => {
    setActiveCategory(subcategoryId);
    onSelectCategory(subcategoryId);
  }, [onSelectCategory]);

  const setCategoryRef = useCallback((categoryId: number) => (node: HTMLDivElement | null) => {
    if (node) {
      categoryRefs.current.set(categoryId, node);
    }
  }, []);

  const categoryItems = useMemo(() => {

    const parentCategories = allCategories.filter(cat => !cat.parent);

    return parentCategories.map((cat) => {
      const isActive = activeCategory === cat.id.toString();
      const initial = cat.name.charAt(0).toUpperCase();
      const hasSubcategories = cat.children && cat.children.length > 0;
      
      return (
        <div 
          key={cat.id} 
          ref={setCategoryRef(cat.id)}
          className={`category-item ${hasSubcategories ? 'has-subcategories' : ''}`}
          onClick={() => handleCategoryClick(cat.id.toString())}
          onMouseEnter={() => handleCategoryHover(cat)}
          onMouseLeave={handleCategoryLeave}
        >
          <div className={`cat-bubble ${isActive ? 'active' : ''}`}>
            {cat.imageUrl
              ? (
                <Image 
                  src={cat.imageUrl} 
                  alt={cat.name} 
                  fill
                  sizes="80px"
                  priority={isActive}
                  style={{ objectFit: 'cover' }}
                />
              )
              : <span className="cat-initial">{initial}</span>
            }
            {hasSubcategories && (
              <div className="subcategory-indicator">
                <span>+{cat.children?.length}</span>
              </div>
            )}
          </div>
          <span className={isActive ? 'active-text' : ''}>{cat.name}</span>
        </div>
      );
    }).filter(Boolean);
  }, [allCategories, activeCategory, handleCategoryClick, handleCategoryHover, handleCategoryLeave, setCategoryRef]);

  return (
    <div className="category-slider">
      <HorizontalSlider
        itemWidth={100}
        gap={gap}
        isLoading={categoriesLoading}
        arrowClassName="category-arrow"
        wrapperClassName="category-wrapper"
      >
        {categoryItems}
      </HorizontalSlider>
      
      {hoveredCategory && categoryRefs.current.get(hoveredCategory.id) && (
        <SubcategoryModal
          category={hoveredCategory}
          isVisible={showSubcategoryModal}
          onSelectSubcategory={handleSelectSubcategory}
          onClose={handleCloseModal}
          triggerRef={{ current: categoryRefs.current.get(hoveredCategory.id)! }}
        />
      )}
    </div>
  );
};

export default React.memo(CategorySliderWithModal);
