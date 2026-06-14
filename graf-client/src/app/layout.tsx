import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/globals.scss';
import '@/styles/bootstrap.css';
import Script from 'next/script';
import { Providers } from '@/providers';
import { Analytics } from "@vercel/analytics/react"
import React from 'react';
export const metadata = {
  title: {
    default: 'Graf',
  },
  description:
    'Graf es una aplicación e-commerce minimalista y altamente funcional para gestionar pedidos de forma rápida y sencilla.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.graf.com.co/'),
  openGraph: {
    title: 'Graf',
    description:
      'Aplicación e-commerce minimalista y altamente funcional para gestionar tus pedidos online.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.graf.com.co/',
    siteName: 'Graf',
    locale: 'es_ES',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Graf',
    description:
      'App e-commerce minimalista y funcional para gestionar tus pedidos online.',
    images: [{ url: '/images/logo.svg', alt: 'Logo de Graf' }]
  }
};

const defaultStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Graf',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.graf.com.co/',
  logo: '/images/logo.svg',
  description:
    'E-commerce minimalista y altamente funcional para gestionar pedidos de manera rápida y sencilla.',
  sameAs: [
    'https://www.facebook.com/graf',
    'https://instagram.com/graf',
    'https://twitter.com/graf'
  ],
  potentialAction: {
    '@type': 'SearchAction',
    target: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.graf.com.co/'}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Script id="default-schema-org" type="application/ld+json">
          {JSON.stringify(defaultStructuredData)}
        </Script>
      </head>
      <body>
        <Analytics />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
