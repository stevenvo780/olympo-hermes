import { Metadata } from 'next';
import React from 'react';
import RegisterClient from '@/components/RegisterClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Registro',
  description: 'Regístrate en Graf y comienza a comprar nuestros productos',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Registro - Graf',
    description: 'Crea tu cuenta y comienza a comprar en Graf',
    images: [],
  },
  twitter: { images: [] },
  keywords: ['registro', 'crear cuenta', 'ecommerce', 'Graf'],
  alternates: { canonical: 'https://graf.com.co/register' },
};

interface StoreParams {
  params: Promise<{ storeId?: string }>;
}

export default async function RegisterPage({ params }: StoreParams) {
  const { storeId } = await params;
  return <RegisterClient storeId={storeId ?? ''} />;
}
