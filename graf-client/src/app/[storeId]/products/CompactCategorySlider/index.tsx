'use client';
import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import HorizontalSlider from '@/app/[storeId]/components/HorizontalSlider';
import './styles.scss';
import throttle from 'lodash/throttle';

interface CompactCategorySliderProps {
  onSelectCategory: (categoryId: string) => void;
  selectedCategoryId?: string;
  isVisible: boolean;
  scrollThreshold?: number;
}

const useScrollVisibility = (initialVisibility: boolean, threshold: number) => {
  const [isVisible, setIsVisible] = useState(initialVisibility);
  useEffect(() => {
    const handleScroll = throttle(() => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY > threshold);
    }, 100);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold]);
  return isVisible;
};

const CompactCategorySlider: React.FC<CompactCategorySliderProps> = ({
  onSelectCategory,
  selectedCategoryId,
  isVisible: propVisibility,
  scrollThreshold
}) => {
  const allCategories = useSelector((state: RootState) => state.categories.categories);
  const [activeCategory, setActiveCategory] = useState<string | undefined>(selectedCategoryId);
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 0);
  const calculatedThreshold = useMemo(() => {
    if (scrollThreshold) return scrollThreshold;
    if (windowWidth >= 992) return 450;
    if (windowWidth >= 768) return 120;
    return 250;
  }, [windowWidth, scrollThreshold]);
  const isScrollVisible = useScrollVisibility(propVisibility, calculatedThreshold);
  const isVisible = propVisibility || isScrollVisible;
  useEffect(() => {
    setActiveCategory(selectedCategoryId);
  }, [selectedCategoryId]);
  useEffect(() => {
    const handleResize = throttle(() => {
      setWindowWidth(window.innerWidth);
    }, 200);
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);
  const handleCategoryClick = useCallback((categoryId: string) => {
    if (activeCategory === categoryId) {
      setActiveCategory(undefined);
      onSelectCategory('');
    } else {
      setActiveCategory(categoryId);
      onSelectCategory(categoryId);
    }
  }, [activeCategory, onSelectCategory]);
  const deviceType = useMemo(() =>
    windowWidth >= 992 ? 'desktop' : windowWidth >= 768 ? 'tablet' : 'mobile',
    [windowWidth]
  );
  if (allCategories.length === 0) return null;
  return (
    <div
      className={`compact-category-slider ${isVisible ? 'visible' : ''}`}
      style={{ display: isVisible ? 'block' : 'none' }}
      data-visible={isVisible.toString()}
      data-device-type={deviceType}
    >
      <HorizontalSlider
        className=""
        containerClassName="compact-category-slider-container"
        wrapperClassName="compact-slider-content"
        itemWidth={100}
        gap={8}
      >
        <div
          className={`compact-category-item ${!activeCategory || activeCategory === '' ? 'active' : ''}`}
          onClick={() => handleCategoryClick('')}
        >
          Todos
        </div>
        {allCategories
          .filter(category => !category.parent)
          .map((category) => {
          return (
            <div
              key={`compact-category-${category.id}`}
              className={`compact-category-item ${activeCategory === category.id.toString() ? 'active' : ''}`}
              onClick={() => handleCategoryClick(category.id.toString())}
            >
              {category.name}
            </div>
          )
        })}
      </HorizontalSlider>
    </div>
  );
};

export default memo(CompactCategorySlider, (prev, next) =>
  prev.selectedCategoryId === next.selectedCategoryId &&
  prev.isVisible === next.isVisible
);
