'use client';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/redux/store';
import { addToCartWithHierarchy } from '@/redux/cart';
import { Product } from '@/types';

export const useAddToCart = () => {
  const dispatch = useDispatch<AppDispatch>();

  const addToCart = async (product: Product, storeId: string) => {
    try {
      await dispatch(addToCartWithHierarchy({ 
        product, 
        storeId 
      })).unwrap();
      
      return true;
    } catch {
      return false;
    }
  };

  return {
    addToCart
  };
};

export default useAddToCart;
