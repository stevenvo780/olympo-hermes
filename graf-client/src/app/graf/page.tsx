import { Metadata } from 'next';
import React from 'react';
import ClientHome from './home/ClientHome';

export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://prizma-hermes.vercel.app';

export const metadata: Metadata = {
  title: 'Hermes | Crea tu tienda online con Prizma',
  description:
    'Hermes es la plataforma e-commerce de Prizma: crea tu tienda online con alta personalización, rendimiento excepcional y a un costo accesible.',
  keywords: ['ecommerce', 'tienda online', 'Hermes', 'Prizma', 'productos', 'pedidos'],
  openGraph: {
    title: 'Hermes | Crea tu tienda online con Prizma',
    description:
      'Crea tu tienda online con Hermes de Prizma: alta personalización, alto rendimiento y soporte profesional.',
    type: 'website',
    url: siteUrl,
    siteName: 'Hermes by Prizma',
    locale: 'es_ES',
    images: [
      {
        url: `${siteUrl}/images/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Hermes by Prizma - Tu plataforma e-commerce',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hermes | Crea tu tienda online con Prizma',
    description:
      'Crea tu tienda online con Hermes de Prizma: alta personalización, alto rendimiento y soporte profesional.',
    images: [{ url: `${siteUrl}/images/twitter-og.jpg`, width: 1200, height: 630 }],
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      'es-CO': siteUrl,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export default async function HomePage() {
  return <ClientHome />;
}
