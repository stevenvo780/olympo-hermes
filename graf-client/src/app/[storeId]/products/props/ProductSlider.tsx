'use client';
import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import Image from 'next/image';

interface ProductSliderProps {
  banners: string[];
}

const ProductSlider: React.FC<ProductSliderProps> = ({ banners }) => {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop' | 'largeDesktop'>('desktop');

  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else if (width < 1440) {
        setDeviceType('desktop');
      } else {
        setDeviceType('largeDesktop');
      }
    };
    
    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  if (!banners.length) return null;
  
  const getContainerHeight = () => {
    switch (deviceType) {
      case 'mobile':
        return '180px';
      case 'tablet':
        return '250px';
      case 'desktop':
        return '300px';
      case 'largeDesktop':
        return '500px';
    }
  };

  const containerHeight = getContainerHeight();

  return (
    <Swiper
      modules={[Autoplay, Pagination, Navigation]}
      spaceBetween={0}
      slidesPerView={1}
      loop={banners.length > 1}
      autoplay={{ delay: 5000, disableOnInteraction: false }}
      pagination={{ clickable: true }}
      navigation={banners.length > 1}
      style={{ width: '100%' }}
    >
      {banners.map((banner, index) => (
        <SwiperSlide key={index}>
          <div style={{ position: 'relative', width: '100%', height: containerHeight }}>
            <Image 
              src={banner} 
              alt={`Banner ${index + 1}`} 
              fill
              priority={index === 0}
              style={{ objectFit: 'contain', objectPosition: 'center' }}
            />
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default ProductSlider;
