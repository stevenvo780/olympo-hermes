import React from 'react';
import OrdersList from '@/components/OrdersList';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pedidos',
  description: 'Gestiona los pedidos de tu tienda',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Pedidos - Tienda',
    description: 'Administra y visualiza los pedidos de tu negocio',
    images: [],
  },
  twitter: { images: [] },
  keywords: ['pedidos', 'ordenes', 'gestión', 'comercio', 'tienda'],
  alternates: {
    canonical: 'https://prizma-hermes.vercel.app/orders',
  },
};

export default async function CommerceOrdersPage({ params }: { params: Promise<{ storeId?: string }> }) {
  const { storeId } = await params;
  return <OrdersList storeId={storeId ?? ''} />;
}
