import { Metadata } from 'next';
import React from 'react';
import RegisterClient from '@/components/RegisterClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Registro',
  description: 'Regístrate en Hermes y comienza a comprar nuestros productos',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Registro - Hermes',
    description: 'Crea tu cuenta y comienza a comprar en Hermes',
    images: [],
  },
  twitter: { images: [] },
  keywords: ['registro', 'crear cuenta', 'ecommerce', 'Hermes'],
  alternates: { canonical: 'https://prizma-hermes.vercel.app/register' },
};

interface StoreParams {
  params: Promise<{ storeId?: string }>;
}

export default async function RegisterPage({ params }: StoreParams) {
  const { storeId } = await params;
  return <RegisterClient storeId={storeId ?? ''} />;
}
