import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import store from '@/redux/store';
import api from '@/utils/axios';
import { Product, LIMIT_PRODUCTS } from '@/types';
import { setProductsByCategory, addProductsByCategory, setLoadingProductsByCategory } from '@/redux/products';
import { addNotification } from '@/redux/ui';
import { getCategoriesForProductLoading } from '@/utils/categoryHierarchyUtils';

export const useProducts = (storeId: string) => {
  const dispatch = useDispatch();
  const filters = useSelector((state: RootState) => state.products.filters);
  const searchText = useSelector((state: RootState) => state.ui.searchText);
  const categories = useSelector((state: RootState) => state.categories.categories);
  const productsByCategory = useSelector((state: RootState) => state.products.productsByCategory);
  const isLoadingProducts = useSelector((state: RootState) => state.products.productsByCategoryLoading);

  const loadProductsByCategory = useCallback(async (categoryId: number, loadMore = false) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) {
      return;
    }
    if (isLoadingProducts[categoryId]) return;
    dispatch(setLoadingProductsByCategory({ categoryId, isLoading: true }));
    try {
      const currentState = store.getState();
      const storeOffset = currentState.products.productsByCategory[categoryId]?.offset || 0;
      const offset = loadMore ? storeOffset + LIMIT_PRODUCTS : 0;
      const queryParams: Record<string, string> = {
        limit: LIMIT_PRODUCTS.toString(),
        offset: offset.toString(),
        category: categoryId.toString(),
        exist: 'true',
      };
      if (filters.minPrice > 0) queryParams.minPrice = filters.minPrice.toString();
      if (filters.maxPrice > 0) queryParams.maxPrice = filters.maxPrice.toString();
      if (filters.discount) queryParams.discount = filters.discount;
      if (searchText && searchText.length >= 3) { queryParams.text = searchText; }
      const query = new URLSearchParams(queryParams).toString();
      const response = await api.get(`/products/${storeId}?${query}`);
      const newProducts = response.data.products as Product[];
      let hasMore = response.data.currentPage < response.data.totalPages;
      if (loadMore && newProducts.length === 0) {
        hasMore = false;
      }
      if (
        newProducts.length === 0 &&
        !loadMore &&
        currentState.products.productsByCategory[categoryId]?.products.length > 0 &&
        searchText === ''
      ) {
        dispatch(addNotification({ message: `No hay productos para este filtro`, color: 'warning' }));
      }
      if (!loadMore) {
        dispatch(setProductsByCategory({ categoryId, products: newProducts, hasMore, offset: 0 }));
      } else {
        dispatch(addProductsByCategory({ categoryId, products: newProducts, hasMore, offset }));
      }
      return { products: newProducts, hasMore };
    } catch {
      dispatch(addNotification({ message: `Error al cargar productos de ${category.name}`, color: 'error' }));
      return null;
    } finally {
      dispatch(setLoadingProductsByCategory({ categoryId, isLoading: false }));
    }
  }, [
    filters, searchText,
    storeId, dispatch,
    isLoadingProducts, categories
  ]);

  const reloadAllProductsByCategory = useCallback(() => {
    if (categories.length > 0) {
      const categoriesToLoad = getCategoriesForProductLoading(categories);

      categoriesToLoad.forEach(category => {
        loadProductsByCategory(category.id, false);
      });
    }
  }, [loadProductsByCategory, categories]);

  return { loadProductsByCategory, reloadAllProductsByCategory, isLoadingProducts, productsByCategory };
};
