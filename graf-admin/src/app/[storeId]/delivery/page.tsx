import { Metadata } from 'next';
import DeliveryClient from './DeliveryClient';

export const metadata: Metadata = {
  title: 'Zonas de Entrega - Graf | Admin',
  description: 'Gestiona la creación, edición y eliminación de zonas de entrega',
  openGraph: {
    title: 'Zonas de Entrega - Graf | Admin',
    description: 'Gestiona la creación, edición y eliminación de zonas de entrega',
    url: 'https://Graf.com/delivery',
    images: [],
  },
  twitter: {
    images: [],
  },
  keywords: ['zonas de entrega', 'delivery', 'admin', 'gestión', 'Graf'],
  alternates: {
    canonical: 'https://Graf.com/delivery',
  }
};

export default function DeliveryPage() {
  return <DeliveryClient />;
}
