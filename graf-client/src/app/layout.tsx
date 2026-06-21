import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/globals.scss';
import '@/styles/bootstrap.css';
import Script from 'next/script';
import { Providers } from '@/providers';
import { Analytics } from "@vercel/analytics/react"
import React from 'react';
export const metadata = {
  title: {
    default: 'Hermes',
  },
  description:
    'Hermes es una aplicación e-commerce minimalista y altamente funcional para gestionar pedidos de forma rápida y sencilla.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hermes.com.co/'),
  openGraph: {
    title: 'Hermes',
    description:
      'Aplicación e-commerce minimalista y altamente funcional para gestionar tus pedidos online.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hermes.com.co/',
    siteName: 'Hermes',
    locale: 'es_ES',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hermes',
    description:
      'App e-commerce minimalista y funcional para gestionar tus pedidos online.',
    images: [{ url: '/images/logo.svg', alt: 'Logo de Hermes' }]
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1.0
};

const defaultStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Hermes',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hermes.com.co/',
  logo: '/images/logo.svg',
  description:
    'E-commerce minimalista y altamente funcional para gestionar pedidos de manera rápida y sencilla.',
  sameAs: [
    'https://www.facebook.com/hermes',
    'https://instagram.com/hermes',
    'https://twitter.com/hermes'
  ],
  potentialAction: {
    '@type': 'SearchAction',
    target: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hermes.com.co/'}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Script id="default-schema-org" type="application/ld+json">
          {JSON.stringify(defaultStructuredData)}
        </Script>
        <Analytics />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
