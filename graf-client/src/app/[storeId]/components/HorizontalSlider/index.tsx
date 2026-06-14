'use client';
import React, { useState, useRef, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { Button } from 'react-bootstrap';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './styles.scss';

function debounce<T extends (...args: unknown[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout !== null) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export interface HorizontalSliderProps {
  children: ReactNode;
  itemWidth?: number;
  gap?: number;
  isLoading?: boolean;
  loadMoreItems?: () => void;
  hasMoreItems?: boolean;
  loadingThreshold?: number;
  className?: string;
  loadingComponent?: ReactNode;
  arrowClassName?: string;
  containerClassName?: string;
  wrapperClassName?: string;
}

const HorizontalSlider: React.FC<HorizontalSliderProps> = ({
  children,
  itemWidth = 220,
  gap = 16,
  isLoading = false,
  loadMoreItems,
  hasMoreItems = false,
  loadingThreshold = 50,
  className = '',
  loadingComponent,
  arrowClassName = '',
  containerClassName = '',
  wrapperClassName = '',
}) => {
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [itemsPerView, setItemsPerView] = useState(1);
  
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollStartX, setScrollStartX] = useState(0);
  const dragTimeoutRef = useRef<number | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const totalItemWidth = useMemo(() => itemWidth + gap, [itemWidth, gap]);

  const [loadingInProgress, setLoadingInProgress] = useState(false);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const justLoadedRef = useRef<boolean>(false);

  const calculateDimensions = useCallback(() => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      setItemsPerView(Math.floor(containerWidth / itemWidth) || 1);
    }
  }, [itemWidth]);

  const checkScrollPosition = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, clientWidth, scrollWidth } = scrollContainerRef.current;

    setShowLeftArrow(scrollLeft > 5);

    const isNearEnd = scrollLeft + clientWidth + loadingThreshold >= scrollWidth;
    setShowRightArrow(!isNearEnd);

    if (isNearEnd && hasMoreItems && !isLoading && !loadingInProgress && !justLoadedRef.current) {
      setLoadingInProgress(true);
      loadMoreItems?.();
      
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft -= 100;
        }
        
        justLoadedRef.current = true;
        
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
        }
        loadTimeoutRef.current = setTimeout(() => {
          setLoadingInProgress(false);
          justLoadedRef.current = false;
        }, 800);
      }, 300);
    }
    
    if (!isNearEnd) {
      justLoadedRef.current = false;
    }
  }, [hasMoreItems, isLoading, loadMoreItems, loadingThreshold, loadingInProgress]);

  const handleScroll = useCallback(() => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 150);

    checkScrollPosition();
  }, [checkScrollPosition]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    
    setStartX(e.clientX);
    setScrollStartX(scrollContainerRef.current.scrollLeft);
    setIsDragging(true);
    
    if (scrollContainerRef.current) {
      scrollContainerRef.current.classList.add('grabbing');
    }
    
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    
    if (dragTimeoutRef.current) {
      cancelAnimationFrame(dragTimeoutRef.current);
    }
    
    dragTimeoutRef.current = requestAnimationFrame(() => {
      if (scrollContainerRef.current && isDragging) {
        const x = e.clientX;
        const walk = (startX - x) * 0.8;
        scrollContainerRef.current.scrollLeft = scrollStartX + walk;
      }
    });
    
  }, [isDragging, startX, scrollStartX]);

  const handleMouseUpOrLeave = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    if (dragTimeoutRef.current) {
      cancelAnimationFrame(dragTimeoutRef.current);
      dragTimeoutRef.current = null;
    }
    
    if (scrollContainerRef.current) {
      scrollContainerRef.current.classList.remove('grabbing');
    }
  }, [isDragging]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUpOrLeave);
      
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUpOrLeave);
        
        if (dragTimeoutRef.current) {
          cancelAnimationFrame(dragTimeoutRef.current);
        }
      };
    }
  }, [handleScroll, handleMouseMove, handleMouseUpOrLeave]);

  useEffect(() => {
    calculateDimensions();
    const debouncedResize = debounce(calculateDimensions, 200);
    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, [calculateDimensions]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  useEffect(() => {
    setTimeout(checkScrollPosition, 300);
  }, [checkScrollPosition, children]);

  useEffect(() => {
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isLoading) {
      justLoadedRef.current = true;
    }
  }, [isLoading]);

  const scrollToNext = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: totalItemWidth * itemsPerView,
        behavior: 'smooth'
      });
    }
  }, [itemsPerView, totalItemWidth]);

  const scrollToPrev = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -totalItemWidth * itemsPerView,
        behavior: 'smooth'
      });
    }
  }, [itemsPerView, totalItemWidth]);

  return (
    <div className={`horizontal-slider ${className}`}>
      <div className={`position-relative w-100 overflow-hidden ${containerClassName}`}>
        <div 
          className={`horizontal-scroll-wrapper ${isScrolling ? 'is-scrolling' : ''} ${isDragging ? 'is-dragging' : ''} ${wrapperClassName}`} 
          ref={scrollContainerRef}
          style={{ 
            '--item-width': `${itemWidth}px`, 
            '--item-gap': `${gap}px`,
            cursor: 'grab'
          } as React.CSSProperties}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseUpOrLeave}
        >
          {children}
          
          {isLoading && (loadingComponent || (
            <div className="d-flex align-items-center justify-content-center bg-light rounded" 
                 style={{ minWidth: `${itemWidth}px`, height: '250px', marginRight: `${gap}px` }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ))}
        </div>
        
        <Button
          variant="primary"
          className={`navigation-arrow prev-arrow rounded-circle shadow d-flex align-items-center justify-content-center ${!showLeftArrow ? 'hidden' : ''} ${arrowClassName}`}
          onClick={scrollToPrev}
          aria-label="Anterior"
        >
          <FaChevronLeft />
        </Button>
        <Button
          variant="primary"
          className={`navigation-arrow next-arrow rounded-circle shadow d-flex align-items-center justify-content-center ${!showRightArrow ? 'hidden' : ''} ${arrowClassName}`}
          onClick={scrollToNext}
          aria-label="Siguiente"
        >
          <FaChevronRight />
        </Button>
      </div>
    </div>
  );
};

export default React.memo(HorizontalSlider);
