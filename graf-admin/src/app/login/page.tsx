import { Metadata } from 'next';
import React from 'react';
import LoginClient from './LoginClient';

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
  description: 'Accede a tu cuenta de Graf para gestionar tus pedidos y tiendas online.',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Iniciar Sesión - Graf',
    description: 'Accede a tu cuenta de Graf para gestionar tus pedidos y tiendas online.',
  }
};

export default function LoginPage() {
  return <LoginClient />;
}
