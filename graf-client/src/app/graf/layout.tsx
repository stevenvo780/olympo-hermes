import React from 'react';
import Script from 'next/script';
import ClientLayout from './components/ClientLayout';

export const metadata = {
  title: {
    default: 'Graf',
    template: '%s | Graf'
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
    'https://www.facebook.com/Grafminimalista',
    'https://instagram.com/Grafminimalista',
    'https://twitter.com/Graf'
  ],
  potentialAction: {
    '@type': 'SearchAction',
    target: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.graf.com.co/'}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string'
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script id="schema-org" type="application/ld+json">
        {JSON.stringify(defaultStructuredData)}
      </Script>
      <ClientLayout>
        {children}
      </ClientLayout>
    </>
  );
}
