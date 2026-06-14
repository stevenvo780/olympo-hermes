import { Metadata } from 'next';
import ProductsClient from './ProductsClient';

export const metadata: Metadata = {
  title: 'Productos - Graf | Admin',
  description: 'Gestiona la creación, edición y eliminación de productos en Graf',
  openGraph: {
    title: 'Productos - Graf | Admin',
    description: 'Gestiona la creación, edición y eliminación de productos en Graf',
    url: 'https://Graf.com/products',
    images: [],
  },
  twitter: {
    images: [],
  },
  keywords: ['productos', 'admin', 'gestión', 'Graf'],
  alternates: {
    canonical: 'https://Graf.com/products',
  }
};

export default function ProductsPage() {
  return <ProductsClient />;
}
