'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { extractFirstValidImageUrl } from '@/components/ImageUploader';

const getImageFallback = (type: 'product' | 'store' | 'category' | 'general' = 'general'): string => {
  switch (type) {
    case 'store':
      return '/images/logo.svg';
    default:
      return '/images/no-image.png';
  }
};

interface OptimizedImageProps {
  src: string | string[] | undefined | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackType?: 'product' | 'store' | 'category' | 'general';
  priority?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  sizes?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = 300,
  height = 300,
  className = '',
  fallbackType = 'general',
  priority = false,
  objectFit = 'cover',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
}) => {
  const [imgSrc, setImgSrc] = useState<string>(extractFirstValidImageUrl(src));
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(getImageFallback(fallbackType));
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      <Image
        src={imgSrc}
        alt={alt}
        fill
        className={`object-${objectFit}`}
        onError={handleError}
        priority={priority}
        sizes={sizes}
      />
    </div>
  );
};
