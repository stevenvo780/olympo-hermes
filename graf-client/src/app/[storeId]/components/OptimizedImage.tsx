'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { validateFirebaseUrl, getImageFallback, extractImageUrl } from '@/utils/imageUtils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackSrc?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';

  imagesString?: string;
  imageType?: 'product' | 'store' | 'category' | 'general';
}

if (typeof document !== 'undefined' && !document.getElementById('shimmer-style')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'shimmer-style';
  styleEl.innerHTML = `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .shimmer-effect {
      animation: shimmer 1.5s infinite;
      background: linear-gradient(90deg, var(--bs-light) 0%, var(--bs-gray-200) 50%, var(--bs-light) 100%);
      background-size: 200% 100%;
    }
  `;
  document.head.appendChild(styleEl);
}

function useInView<T extends HTMLElement>(ref: React.RefObject<T | null>, margin = '200px') {
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: margin });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, margin]);
  return isInView;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  style, 
  fallbackSrc, 
  objectFit = 'cover',
  imagesString,
  imageType = 'general'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const bestImageUrl = useMemo(() => {

    const validatedSrc = validateFirebaseUrl(src);

    if (validatedSrc === '/images/no-image.png' && imagesString) {
      const extractedUrl = extractImageUrl(imagesString);
      if (extractedUrl !== '/images/no-image.png') {
        return extractedUrl;
      }
    }
    
    return validatedSrc;
  }, [src, imagesString]);
  
  const [currentSrc, setCurrentSrc] = useState(bestImageUrl);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView<HTMLDivElement>(containerRef);
  const shouldLoadImmediately = useMemo(() => bestImageUrl.startsWith('data:') || bestImageUrl.startsWith('blob:'), [bestImageUrl]);
  
  const finalFallbackSrc = fallbackSrc || getImageFallback(imageType);

  useEffect(() => {
    const validatedSrc = validateFirebaseUrl(src);
    let newSrc = validatedSrc;

    if (validatedSrc === '/images/no-image.png' && imagesString) {
      const extractedUrl = extractImageUrl(imagesString);
      if (extractedUrl !== '/images/no-image.png') {
        newSrc = extractedUrl;
      }
    }
    
    setCurrentSrc(newSrc);
    setHasError(false);
    setIsLoaded(false);
  }, [src, imagesString]);

  useEffect(() => {
    if (shouldLoadImmediately) setIsLoaded(true);
  }, [shouldLoadImmediately]);

  const handleLoadingComplete = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    if (currentSrc !== finalFallbackSrc) {
      setCurrentSrc(finalFallbackSrc);
      setHasError(false);
    } else {
      setHasError(true);
    }
  }, [currentSrc, finalFallbackSrc]);

  return (
    <div ref={containerRef} className={`position-relative w-100 h-100 overflow-hidden ${className}`} style={style}>
      {(isInView || shouldLoadImmediately) && !hasError && (
        <>
          <div className="position-relative w-100 h-100">
            <Image
              src={currentSrc}
              alt={alt}
              fill
              style={{ objectFit: objectFit, objectPosition: 'center', opacity: isLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
              onLoad={handleLoadingComplete}
              onError={handleError}
              loading={shouldLoadImmediately ? 'eager' : 'lazy'}
              quality={75}
              unoptimized={false}
            />
          </div>
          {!isLoaded && <div className="position-absolute top-0 start-0 w-100 h-100 shimmer-effect" />}
        </>
      )}
      {hasError && (
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light text-muted">
          <div className="text-center">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
            <small>Imagen no disponible</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(OptimizedImage, (prev, next) =>
  prev.src === next.src && 
  prev.className === next.className && 
  prev.style === next.style &&
  prev.imagesString === next.imagesString &&
  prev.imageType === next.imageType
);
