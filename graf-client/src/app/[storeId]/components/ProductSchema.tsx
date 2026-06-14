import React from 'react';
import { Product } from '@/types';
import axiosServer from '@/utils/axiosServer';

interface ProductSchemaProps {
  products?: Product[];
  storeId?: string;
  maxProducts?: number;
}

async function fetchAllProductsForSchema(storeId: string, maxProducts: number) {
  try {
    const response = await axiosServer.get<{
      products: Product[];
      total: number;
    }>(`/products/${storeId}`, {
      params: {
        limit: maxProducts.toString(),
        offset: "0",
        exist: "true"
      }
    });
    
    return response.data.products;
  } catch {
    return [];
  }
}

const ProductSchema = async ({ products, storeId, maxProducts = 1000 }: ProductSchemaProps) => {
  let schemaProducts: Product[] = [];
  if (products) {
    schemaProducts = products;
  } else if (storeId) {
    try {
      schemaProducts = await fetchAllProductsForSchema(storeId, maxProducts);
    } catch {
      schemaProducts = [];
    }
  }
  
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": schemaProducts.map((product, index) => {
      const firstImage = product.images?.find(img => img?.trim());
      
      return {
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Product",
          "name": product.title,
          "description": product.description || '',
          "sku": product.sku || '',
          ...(firstImage && { "image": firstImage }),
          "offers": {
            "@type": "Offer",
            "priceCurrency": "COP",
            "price": product.totalPrice,
            "availability": (product.stock > 0) 
              ? "https://schema.org/InStock" 
              : "https://schema.org/OutOfStock"
          }
        }
      };
    })
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
};

export default ProductSchema;
