import { Metadata } from 'next';
import OrdersClient from './OrdersClient';

export const metadata: Metadata = {
  title: 'Gestión de Órdenes - Graf | Admin',
  description: 'Gestiona las órdenes de los clientes en Graf',
  openGraph: {
    title: 'Gestión de Órdenes - Graf | Admin',
    description: 'Gestiona las órdenes de los clientes en Graf',
    url: 'https://Graf.com/orders',
    images: [],
  },
  twitter: {
    images: [],
  },
  keywords: ['órdenes', 'pedidos', 'gestión', 'Graf'],
  alternates: {
    canonical: 'https://Graf.com/orders',
  }
};

export default function OrdersPage() {
  return <OrdersClient />;
}
