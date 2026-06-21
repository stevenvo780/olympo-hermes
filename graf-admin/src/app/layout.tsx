import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'prizma-ui/styles.css';
import { Providers } from './providers';
import ClientLayout from '@/components/ClientLayout';
import { Analytics } from "@vercel/analytics/react"
import '@/styles/bootstrap.css';
import '@/styles/prizma-brand.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://admin.hermes.com.co';

export const metadata = {
  title: {
    default: 'Hermes Admin',
    template: '%s | Hermes Admin'
  },
  description: 'Hermes Admin es una aplicación e-commerce minimalista y altamente funcional para gestionar pedidos de forma rápida y sencilla.',
  keywords: [
    'ecommerce',
    'pedidos online',
    'minimalista',
    'funcional',
    'compras',
    'tienda online'
  ],
  authors: [
    { name: 'Prizma', email: 'soporte@prizma.app' },
  ],
  creator: 'Hermes Admin',
  publisher: 'Hermes Admin',
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'Hermes Admin',
    description: 'Aplicación e-commerce minimalista y altamente funcional para gestionar tus pedidos online.',
    url: siteUrl,
    siteName: 'Hermes Admin',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hermes Admin',
    description: 'App e-commerce minimalista y funcional para gestionar tus pedidos online.',
    creator: '@Hermes',
    images: [{
      url: '/images/logo.svg',
      alt: 'Logo de Hermes Admin',
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
  name: 'Hermes Admin',
  url: siteUrl,
  logo: '/images/logo.svg',
  description: 'E-commerce minimalista y altamente funcional para gestionar pedidos de manera rápida y sencilla.',
  sameAs: [
    'https://www.facebook.com/hermes',
    'https://instagram.com/hermes',
    'https://twitter.com/Hermes'
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
      <body suppressHydrationWarning={true} data-module="hermes">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
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
