import axiosServer from '@/utils/axiosServer';
import ProductsMain from './products/ProductsMain';
import ProductSchema from './components/ProductSchema';
import { Category, Product, LIMIT_PRODUCTS } from '@/types';
import { sortProductsByCategoryOrder } from '@/utils/productOrder';
import React from 'react';

interface ProductsByCategoryItem {
  products: {
    products: Product[];
    total: number;
    currentPage: number;
    totalPages: number;
  };
  loading: boolean;
  hasNextPage: boolean;
  currentPage: number;
}

type ProductsByCategory = Record<number, ProductsByCategoryItem>;

export const revalidate = 86400;

export default async function ProductsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  if (storeId.toLowerCase() === 'favicon.ico') return <></>;
  const responses = await Promise.allSettled([
    axiosServer.get<Category[]>(`/categories/${storeId}`),
    axiosServer.get(`/categories/${storeId}/hierarchical`),
    axiosServer.get<Category[]>(`/categories/${storeId}/get/roots`)
  ]);

  const flatResponse = responses[0].status === 'fulfilled' ? responses[0].value : { data: [] };
  const hierarchyResponse = responses[1].status === 'fulfilled' ? responses[1].value : { data: [] };
  const rootsResponse = responses[2].status === 'fulfilled' ? responses[2].value : { data: [] };

  let productsByCategory: ProductsByCategory = {};

  if (rootsResponse.data.length > 0) {

    const categoryIds = rootsResponse.data.map((cat: Category) => cat.id);

    const productsPromises = categoryIds.map((categoryId: number) =>
      axiosServer.get<{
        products: Product[];
        total: number;
        currentPage: number;
        totalPages: number;
      }>(`/products/${storeId}`, {
        params: {
          limit: LIMIT_PRODUCTS.toString(),
          offset: "0",
          category: categoryId.toString(),
          exist: 'true'
        }
      })
    );

    const productsResponses = await Promise.allSettled(productsPromises);

    productsByCategory = productsResponses.reduce((acc, response, index) => {
      if (response.status === 'fulfilled') {
        const categoryId = categoryIds[index];
        const ordered = sortProductsByCategoryOrder(response.value.data.products);
        acc[categoryId] = {
          products: { ...response.value.data, products: ordered },
          loading: false,
          hasNextPage: ordered.length >= LIMIT_PRODUCTS,
          currentPage: 1
        };
      }
      return acc;
    }, {} as ProductsByCategory);
  }

  const productsSSRFormatted = Object.entries(productsByCategory).reduce((acc, [catId, data]) => {
    acc[Number(catId)] = {
      products: data.products.products,
      hasNextPage: data.hasNextPage,
      currentPage: data.currentPage
    };
    return acc;
  }, {} as Record<number, {
    products: Product[];
    hasNextPage: boolean;
    currentPage: number;
  }>);

  return (
    <>
      <ProductSchema storeId={storeId} maxProducts={1000} />
      <ProductsMain
        categoriesSSR={flatResponse.data}
        hierarchySSR={hierarchyResponse.data}
        rootCategoriesSSR={rootsResponse.data}
        productsSSR={productsSSRFormatted}
      />
    </>
  );
}
