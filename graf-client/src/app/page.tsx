import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Hermes | The Ultimate Ecommerce Experience',
  description:
    'Discover a wide range of products with Hermes, your go-to ecommerce platform for secure and fast shopping.',
  keywords: ['ecommerce', 'online shopping', 'Hermes', 'products', 'orders'],
  openGraph: {
    title: 'Hermes | The Ultimate Ecommerce Experience',
    description:
      'Discover a wide range of products with Hermes, your go-to ecommerce platform for secure and fast shopping.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://hermes.com.co',
    siteName: 'Hermes',
    locale: 'en_US',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Hermes - Your Online Store',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hermes | The Ultimate Ecommerce Experience',
    description:
      'Discover a wide range of products with Hermes, your go-to ecommerce platform for secure and fast shopping.',
    creator: '@Hermes',
    images: ['/images/twitter-og.jpg'],
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://hermes.com.co',
    languages: {
      'en-US': process.env.NEXT_PUBLIC_SITE_URL || 'https://hermes.com.co',
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

export default async function HomePage() {
  return redirect('/hermes');
}
