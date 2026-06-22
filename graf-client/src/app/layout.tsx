import 'bootstrap/dist/css/bootstrap.min.css';
import 'prizma-ui/styles.css';
import '@/styles/globals.scss';
import '@/styles/bootstrap.css';
import Script from 'next/script';
import { Providers } from '@/providers';
import { Analytics } from "@vercel/analytics/react"
import React from 'react';

// Disable prerendering for pages that depend on Firebase and env vars
export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://prizma-hermes.vercel.app';

export const metadata = {
  title: {
    default: 'Hermes | E-commerce Prizma',
  },
  description:
    'Hermes es la plataforma e-commerce de Prizma: minimalista, altamente funcional y fácil de gestionar.',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: 'Hermes | E-commerce Prizma',
    description:
      'Plataforma e-commerce minimalista y altamente funcional para gestionar tus pedidos online.',
    url: siteUrl,
    siteName: 'Hermes by Prizma',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/images/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Hermes by Prizma',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hermes | E-commerce Prizma',
    description:
      'Plataforma e-commerce minimalista y funcional para gestionar tus pedidos online.',
    images: [{ url: `${siteUrl}/images/twitter-og.jpg`, width: 1200, height: 630, alt: 'Hermes by Prizma' }]
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/images/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/favicon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/images/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1.0
};

const defaultStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Hermes by Prizma',
  url: siteUrl,
  logo: `${siteUrl}/images/hermes-logo-512.png`,
  description:
    'Plataforma e-commerce minimalista y altamente funcional para gestionar pedidos de manera rápida y sencilla.',
  sameAs: [
    'https://www.facebook.com/prizma',
    'https://instagram.com/prizma',
    'https://twitter.com/prizma'
  ],
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
