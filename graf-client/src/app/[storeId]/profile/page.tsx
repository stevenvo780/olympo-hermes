import { Metadata } from 'next';
import React from 'react';
import ProfileEditor from '@/components/ProfileEditor';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Editar Perfil',
  description: 'Modifica la información de tu comercio',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Editar Perfil - TotalPedidos',
    description: 'Gestiona y actualiza la información de tu comercio',
    images: [],
  },
  twitter: { images: [] },
  keywords: ['perfil', 'comercio', 'editar', 'configuración', 'tienda'],
  alternates: { canonical: 'https://graf.com.co/profile' },
};

interface StoreParams {
  params: Promise<{ storeId?: string }>;
}

export default async function EditUserPage({ params }: StoreParams) {
  const { storeId } = await params;
  return <ProfileEditor storeId={storeId ?? ''} />;
}
