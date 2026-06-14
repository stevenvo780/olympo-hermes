import { Metadata } from 'next';
import React from 'react';
import LoginClient from '@/components/LoginClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
  description: 'Accede a tu cuenta en la comunidad de debate más caótica',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Iniciar Sesión - Cafetería del Caos',
    description: 'Accede a tu cuenta y participa en los debates más intensos',
  }
};

export default function LoginPage() {
  return <LoginClient storeId="" />;
}
