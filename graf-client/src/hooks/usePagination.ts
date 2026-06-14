import { useRef, useEffect, useCallback } from 'react';

interface PaginationOptions {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  rootMargin?: string;
}

export const usePagination = ({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 0.1,
  rootMargin = '100px'
}: PaginationOptions) => {
  const lastItemRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadedRef = useRef<boolean>(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setLastItemRef = useCallback((node: HTMLElement | null) => {
    lastItemRef.current = node;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (!node || !hasMore || isLoading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading && !loadedRef.current) {
          if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
          
          loadingTimeoutRef.current = setTimeout(() => {
            loadedRef.current = true;
            onLoadMore();
            
            setTimeout(() => {
              loadedRef.current = false;
            }, 500);
          }, 100);
        }
      },
      { threshold, rootMargin }
    );

    observerRef.current.observe(node);
  }, [hasMore, isLoading, onLoadMore, threshold, rootMargin]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  return { setLastItemRef };
};
