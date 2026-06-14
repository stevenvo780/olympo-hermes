import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@cauce/ui/styles.css';
import { Providers } from './providers';
import ClientLayout from '@/components/ClientLayout';
import { Analytics } from "@vercel/analytics/react"
import '@/styles/bootstrap.css';
import '@/styles/cauce-brand.css';
import Head from 'next/head';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://admin.graf.com.co';

export const metadata = {
  title: {
    default: 'Graf Admin',
    template: '%s | Graf Admin'
  },
  description: 'Graf Admin es una aplicación e-commerce minimalista y altamente funcional para gestionar pedidos de forma rápida y sencilla.',
  keywords: [
    'ecommerce',
    'pedidos online',
    'minimalista',
    'funcional',
    'compras',
    'tienda online'
  ],
  authors: [
    { name: 'Cauce', email: 'soporte@cauce.app' },
  ],
  creator: 'Graf Admin',
  publisher: 'Graf Admin',
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'Graf Admin',
    description: 'Aplicación e-commerce minimalista y altamente funcional para gestionar tus pedidos online.',
    url: siteUrl,
    siteName: 'Graf Admin',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Graf Admin',
    description: 'App e-commerce minimalista y funcional para gestionar tus pedidos online.',
    creator: '@Graf',
    images: [{
      url: '/images/logo.svg',
      alt: 'Logo de Graf Admin',
    }],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/images/logo.svg',
    apple: '/images/logo.svg',
    shortcut: '/images/logo.svg',
  },
};

export const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Graf Admin',
  url: siteUrl,
  logo: '/images/logo.svg',
  description: 'E-commerce minimalista y altamente funcional para gestionar pedidos de manera rápida y sencilla.',
  sameAs: [
    'https://www.facebook.com/graf',
    'https://instagram.com/graf',
    'https://twitter.com/Graf'
  ],
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" data-theme="light">
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
      <body suppressHydrationWarning={true} data-module="graf">
        <Analytics />
        <Providers>
          <ClientLayout>
            <div style={{ marginTop: '1rem' }}>
              {children}
            </div>
          </ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
