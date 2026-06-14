import { Metadata } from 'next';
import React from 'react';
import LoginClient from '@/components/LoginClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
  description: 'Accede a tu cuenta en la comunidad de debate más caótica',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Iniciar Sesión - Cafetería del Caos',
    description: 'Accede a tu cuenta y participa en los debates más intensos',
  }
};

interface StoreParams {
  params: Promise<{ storeId?: string }>;
}

export default async function LoginPage({ params }: StoreParams) {
  const { storeId } = await params;
  return <LoginClient storeId={storeId ?? ''} />;
}
