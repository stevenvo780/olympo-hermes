import { Metadata } from 'next';
import CategoriesClient from './CategoriesClient';

export const metadata: Metadata = {
  title: 'Categorías - Graf | Admin',
  description: 'Gestiona la creación, edición y eliminación de categorías',
  openGraph: {
    title: 'Categorías - Graf | Admin',
    description: 'Gestiona la creación, edición y eliminación de categorías',
    url: 'https://Graf.com/categories',
    images: [],
  },
  twitter: {
    images: [],
  },
  keywords: ['categorías', 'admin', 'gestión', 'Graf'],
  alternates: {
    canonical: 'https://Graf.com/categories',
  }
};

export default function CategoriesPage() {
  return <CategoriesClient />;
}