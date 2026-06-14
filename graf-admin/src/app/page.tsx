import { Metadata } from 'next';
import AdminHome from './home/AdminHome';

export const metadata: Metadata = {
  title: 'Graf Admin',
  description: 'Admin panel for store owners to manage their stores.',
  keywords: ['ecommerce', 'admin', 'store management'],
  openGraph: {
    title: 'Graf',
    description: 'Admin panel for store owners to manage their stores.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://Graf.com',
    siteName: 'Graf',
    locale: 'en_US',
    images: [
      {
        url: '/images/logo.svg',
        width: 1200,
        height: 630,
        alt: 'Graf - Admin Panel',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Graf | Ecommerce Admin',
    description: 'Admin panel for store owners to manage their stores.',
    creator: '@Graf',
    images: ['/images/logo.svg'],
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://Graf.com',
    languages: {
      'en-US': process.env.NEXT_PUBLIC_SITE_URL || 'https://Graf.com',
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
  icons: {
    icon: '/images/logo.svg',
    apple: '/images/logo.svg',
  },
};

export default function HomePage() {
  return <AdminHome />;
}
