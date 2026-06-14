import { Metadata } from 'next';
import DiscountsClient from './DiscountsClient';

export const metadata: Metadata = {
  title: 'Descuentos - Graf | Admin',
  description: 'Gestiona la creación, edición y eliminación de descuentos',
  openGraph: {
    title: 'Descuentos - Graf | Admin',
    description: 'Gestiona la creación, edición y eliminación de descuentos',
    url: 'https://Graf.com/discounts',
    images: [],
  },
  twitter: {
    images: [],
  },
  keywords: ['descuentos', 'admin', 'gestión', 'Graf'],
  alternates: {
    canonical: 'https://Graf.com/discounts',
  }
};

export default function DiscountsPage() {
  return <DiscountsClient />;
}