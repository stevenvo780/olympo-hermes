'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './styles.scss';
import Image from 'next/image';
import { RootState } from '@/redux/store';
import { useSelector } from 'react-redux';
import HorizontalSlider from '@/app/[storeId]/components/HorizontalSlider';

interface CategorySliderProps {
  onSelectCategory: (categoryId: string) => void;
  selectedCategoryId?: string;
}

const CategorySlider: React.FC<CategorySliderProps> = ({ 
  onSelectCategory, 
  selectedCategoryId 
}) => {

  const allCategories = useSelector((state: RootState) => state.categories.categories);
  const categoriesLoading = useSelector((state: RootState) => state.categories.loading);
  const [activeCategory, setActiveCategory] = useState<string | undefined>(selectedCategoryId);
  
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

  const categoryItems = useMemo(() => {

    const parentCategories = allCategories.filter(cat => !cat.parent);

    return parentCategories.map((cat) => {
      const isActive = activeCategory === cat.id.toString();
      const initial = cat.name.charAt(0).toUpperCase();
      return (
        <div 
          key={cat.id} 
          className="category-item" 
          onClick={() => handleCategoryClick(cat.id.toString())}
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
          </div>
          <span className={isActive ? 'active-text' : ''}>{cat.name}</span>
        </div>
      );
    });
  }, [allCategories, activeCategory, handleCategoryClick]);

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
    </div>
  );
};

export default React.memo(CategorySlider);
