import { Metadata } from 'next';
import TaxesClient from './TaxesClient';

export const metadata: Metadata = {
  title: 'Impuestos - Graf | Admin',
  description: 'Gestiona la creación, edición y eliminación de impuestos',
  openGraph: {
    title: 'Impuestos - Graf | Admin',
    description: 'Gestiona la creación, edición y eliminación de impuestos',
    url: 'https://Graf.com/taxes',
    images: [],
  },
  twitter: {
    images: [],
  },
  keywords: ['impuestos', 'admin', 'gestión', 'Graf'],
  alternates: {
    canonical: 'https://Graf.com/taxes',
  }
};

export default function TaxesPage() {
  return <TaxesClient />;
}